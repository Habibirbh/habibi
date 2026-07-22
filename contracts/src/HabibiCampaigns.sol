// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title  Habibi Campaigns — conditional pre-acquisition crowdfunding & escrow
/// @notice Habibi does NOT own the target property when a campaign opens. Each
///         campaign raises *conditional* commitments toward a proposed UAE
///         property acquisition. Contributions are held in per-campaign escrow
///         inside THIS contract (never forwarded to an operating treasury) and:
///           - are refundable if funding fails or the campaign is cancelled;
///           - are released to an approved acquisition destination ONLY after a
///             signed acquisition authorization (multisig authorizer role);
///           - are NOT ownership. Final participation units are minted only
///             AFTER the acquisition closes, and are transfer-restricted.
///
/// @dev    A contribution is a "conditional subscription", not property title.
///         Security: single audited contract, per-campaign segregated escrow,
///         checks-effects-interactions, ReentrancyGuard on every ETH path,
///         pull-based refunds, custom errors, role-based access, no admin
///         free-withdrawal route, treasury balance never used for accounting.
contract HabibiCampaigns is ERC1155, AccessControl, Pausable, ReentrancyGuard, EIP712 {
    // -------------------------------------------------------------- roles
    bytes32 public constant CAMPAIGN_MANAGER_ROLE = keccak256("CAMPAIGN_MANAGER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant ELIGIBILITY_MANAGER_ROLE = keccak256("ELIGIBILITY_MANAGER_ROLE");
    bytes32 public constant ACQUISITION_AUTHORIZER_ROLE = keccak256("ACQUISITION_AUTHORIZER_ROLE");

    // -------------------------------------------------------------- types
    enum State {
        None,
        Draft,
        DueDiligence,
        Scheduled,
        FundingOpen,
        FundingSuccessful,
        AcquisitionPending,
        Acquired,
        InterestsIssued,
        Cancelled,
        Refunding,
        Refunded
    }

    /// @dev Excess (raised > final acquisition price) default treatment.
    enum ExcessPolicy {
        ProportionalRefund, // default: return the unused portion pro-rata
        RetainPerTerms // only if the approved campaign terms permit
    }

    struct Campaign {
        // configuration (immutable once FundingOpen)
        uint128 fundingTarget; // hard cap
        uint128 minThreshold; // soft cap / minimum success
        uint128 minContribution;
        uint128 maxPerWallet; // 0 = unlimited
        uint128 weiPerUnit; // proposed participation-unit conversion (>0)
        uint64 openingTime; // 0 = open immediately once FundingOpen
        uint64 closingTime; // 0 = no deadline (must be set to open)
        uint16 feeBps; // disclosed platform fee on released amount
        ExcessPolicy excessPolicy;
        address feeRecipient;
        address acceptedAsset; // 0 = native ETH, otherwise ERC20 token address
        // live accounting
        uint128 totalCommitted; // sum of accepted contributions
        uint128 totalRefunded; // sum of full + excess refunds paid out
        uint128 releasedAmount; // sent to acquisition destination (+fee)
        uint128 finalAcquisitionPrice; // set at release
        uint64 participantCount;
        State state;
        bool transfersEnabled;
        // acquisition
        address acquisitionDestination; // set at authorization
    }

    struct AcquisitionAuthorization {
        uint256 campaignId;
        uint256 finalAcquisitionPrice;
        address approvedPaymentDestination;
        bytes32 acquisitionAgreementHash;
        bytes32 SPVIdentifier;
        bytes32 closingDocumentHash;
        uint256 authorizationExpiry;
        uint256 authorizationNonce;
    }

    struct EligibilityAuthorization {
        address wallet;
        uint256 campaignId;
        uint256 maxContributionWei;
        bytes32 eligibilityClass;
        uint256 nonce;
        uint256 expiry;
    }

    // -------------------------------------------------------------- storage
    uint256 public nextCampaignId = 1;
    mapping(uint256 => Campaign) internal _campaigns;
    mapping(uint256 => string) public metadataURI;
    mapping(uint256 => bytes32) public termsHash;

    /// @notice Escrowed contribution per wallet (never decreases; refunds are
    ///         tracked separately so the original history is preserved).
    mapping(uint256 => mapping(address => uint256)) public contributedWei;
    mapping(uint256 => mapping(address => uint256)) public refundedWei; // full-refund claims
    mapping(uint256 => mapping(address => bool)) public finalClaimed; // units + excess claimed
    mapping(uint256 => uint256) public unitsIssued;

    mapping(address => mapping(uint256 => bool)) public eligibilityNonceUsed;
    mapping(uint256 => bool) public acquisitionNonceUsed;

    address public eligibilitySigner; // 0 => eligibility enforcement off (test only)

    bytes32 private constant ELIGIBILITY_TYPEHASH = keccak256(
        "EligibilityAuthorization(address wallet,uint256 campaignId,uint256 maxContributionWei,bytes32 eligibilityClass,uint256 nonce,uint256 expiry)"
    );
    bytes32 private constant ACQUISITION_TYPEHASH = keccak256(
        "AcquisitionAuthorization(uint256 campaignId,uint256 finalAcquisitionPrice,address approvedPaymentDestination,bytes32 acquisitionAgreementHash,bytes32 SPVIdentifier,bytes32 closingDocumentHash,uint256 authorizationExpiry,uint256 authorizationNonce)"
    );

    // -------------------------------------------------------------- events
    event CampaignCreated(
        uint256 indexed campaignId,
        uint256 fundingTarget,
        uint256 minThreshold,
        uint256 weiPerUnit,
        string metadataURI,
        bytes32 termsHash
    );
    event CampaignStateChanged(uint256 indexed campaignId, State from, State to);
    event CampaignOpened(uint256 indexed campaignId, uint64 openingTime, uint64 closingTime);
    event ContributionReceived(
        uint256 indexed campaignId,
        address indexed contributor,
        uint256 amountWei,
        uint256 proposedUnits,
        uint256 totalCommittedWei,
        uint256 timestamp
    );
    event FundingTargetReached(uint256 indexed campaignId, uint256 totalCommittedWei);
    event CampaignCancelled(uint256 indexed campaignId, bytes32 reasonHash);
    event RefundsEnabled(uint256 indexed campaignId);
    event RefundClaimed(uint256 indexed campaignId, address indexed wallet, uint256 amountWei);
    event AcquisitionAuthorized(
        uint256 indexed campaignId,
        address indexed destination,
        uint256 finalAcquisitionPrice,
        bytes32 acquisitionAgreementHash,
        bytes32 SPVIdentifier,
        bytes32 closingDocumentHash,
        uint256 timestamp
    );
    event AcquisitionFundsReleased(
        uint256 indexed campaignId,
        address indexed destination,
        uint256 amountWei,
        uint256 feeWei,
        bytes32 evidenceHash,
        uint256 timestamp
    );
    event PropertyAcquired(uint256 indexed campaignId, uint256 finalAcquisitionPrice);
    event ExcessRefundEnabled(uint256 indexed campaignId, uint256 excessWei);
    event ParticipationUnitsIssued(
        uint256 indexed campaignId, address indexed wallet, uint256 units, uint256 excessRefundWei
    );
    event CampaignClosed(uint256 indexed campaignId);
    event TransferPolicyUpdated(uint256 indexed campaignId, bool enabled);
    event EligibilitySignerUpdated(address indexed signer);

    // -------------------------------------------------------------- errors
    error CampaignNotFound(uint256 id);
    error InvalidConfiguration(string field);
    error InvalidState(State current, State required);
    error NotFundingOpen(uint256 id, State state);
    error NotYetOpen(uint64 openingTime);
    error FundingClosed(uint64 closingTime);
    error BelowMinimum(uint256 minWei);
    error NotUnitMultiple(uint256 weiPerUnit);
    error ZeroAmount();
    error AboveWalletMaximum(uint256 maxWei, uint256 already);
    error ExceedsCapacity(uint256 remainingWei);
    error SlippageUnitsTooLow(uint256 got, uint256 min);
    error EligibilityRequired();
    error EligibilityInvalid(string why);
    error RefundsNotEnabled(uint256 id);
    error NothingToRefund();
    error DeadlineNotReached(uint64 closingTime);
    error ThresholdNotMet(uint256 committed, uint256 threshold);
    error AcquisitionNotAuthorized();
    error TransferFailed(address to);
    error TransfersDisabled(uint256 id);
    error AlreadyClaimed();
    error NotAcquired(uint256 id);
    error EvidenceInvalid(string why);

    constructor(address admin) ERC1155("") EIP712("HabibiCampaigns", "1") {
        if (admin == address(0)) revert InvalidConfiguration("admin");
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(CAMPAIGN_MANAGER_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
        _grantRole(ELIGIBILITY_MANAGER_ROLE, admin);
        _grantRole(ACQUISITION_AUTHORIZER_ROLE, admin);
    }

    // -------------------------------------------------------------- views
    function getCampaign(uint256 id) external view returns (Campaign memory c) {
        c = _campaigns[id];
        if (c.state == State.None) revert CampaignNotFound(id);
    }

    /// @notice ETH still escrowed for a campaign = committed - released - refunded.
    function escrowBalance(uint256 id) public view returns (uint256) {
        Campaign storage c = _campaigns[id];
        return uint256(c.totalCommitted) - uint256(c.releasedAmount) - uint256(c.totalRefunded);
    }

    function remainingCapacityWei(uint256 id) public view returns (uint256) {
        Campaign storage c = _campaigns[id];
        if (c.state == State.None) revert CampaignNotFound(id);
        return uint256(c.fundingTarget) - uint256(c.totalCommitted);
    }

    /// @notice Funding progress in basis points from ESCROW accounting only.
    function fundedBps(uint256 id) external view returns (uint256) {
        Campaign storage c = _campaigns[id];
        if (c.state == State.None) revert CampaignNotFound(id);
        return (uint256(c.totalCommitted) * 10_000) / uint256(c.fundingTarget);
    }

    /// @notice Refundable now (full refund path) for a wallet.
    function refundableAmount(uint256 id, address user) public view returns (uint256) {
        Campaign storage c = _campaigns[id];
        if (c.state != State.Refunding && c.state != State.Refunded) return 0;
        return contributedWei[id][user] - refundedWei[id][user];
    }

    function uri(uint256 id) public view override returns (string memory) {
        return metadataURI[id];
    }

    // -------------------------------------------------------------- contribute
    /// @notice Make a CONDITIONAL contribution toward a proposed acquisition.
    ///         No token is minted here; funds are escrowed and refundable.
    function contribute(uint256 id, uint256 minUnitsOut, bytes calldata eligibilityData)
        external
        payable
    {
        contribute(id, msg.value, minUnitsOut, eligibilityData);
    }

    function contribute(uint256 id, uint256 amount, uint256 minUnitsOut, bytes calldata eligibilityData)
        public
        payable
        nonReentrant
        whenNotPaused
    {
        Campaign storage c = _campaigns[id];
        if (c.state == State.None) revert CampaignNotFound(id);
        if (c.state != State.FundingOpen) revert NotFundingOpen(id, c.state);
        if (c.openingTime != 0 && block.timestamp < c.openingTime) revert NotYetOpen(c.openingTime);
        if (c.closingTime != 0 && block.timestamp > c.closingTime) revert FundingClosed(c.closingTime);
        if (amount == 0) revert ZeroAmount();
        if (amount % c.weiPerUnit != 0) revert NotUnitMultiple(c.weiPerUnit);
        if (amount < c.minContribution) revert BelowMinimum(c.minContribution);

        if (c.acceptedAsset == address(0)) {
            if (msg.value != amount) revert InvalidConfiguration("amount mismatch");
        } else {
            if (msg.value != 0) revert InvalidConfiguration("ETH not accepted");
            SafeERC20.safeTransferFrom(IERC20(c.acceptedAsset), msg.sender, address(this), amount);
        }

        uint256 already = contributedWei[id][msg.sender];
        if (c.maxPerWallet != 0 && already + amount > c.maxPerWallet) {
            revert AboveWalletMaximum(c.maxPerWallet, already);
        }
        uint256 remaining = uint256(c.fundingTarget) - uint256(c.totalCommitted);
        if (amount > remaining) revert ExceedsCapacity(remaining);

        _checkEligibility(id, already, amount, eligibilityData);

        uint256 proposedUnits = amount / c.weiPerUnit;
        if (proposedUnits < minUnitsOut) revert SlippageUnitsTooLow(proposedUnits, minUnitsOut);

        if (already == 0) c.participantCount += 1;
        contributedWei[id][msg.sender] = already + amount;
        c.totalCommitted += uint128(amount);

        emit ContributionReceived(id, msg.sender, amount, proposedUnits, c.totalCommitted, block.timestamp);

        if (c.totalCommitted == c.fundingTarget) {
            _setState(c, id, State.FundingSuccessful);
            emit FundingTargetReached(id, c.totalCommitted);
        }
    }

    function _checkEligibility(uint256 id, uint256 already, uint256 amount, bytes calldata data) internal {
        address signer = eligibilitySigner;
        if (signer == address(0)) return;
        if (data.length == 0) revert EligibilityRequired();
        (EligibilityAuthorization memory a, bytes memory sig) = abi.decode(data, (EligibilityAuthorization, bytes));
        if (a.wallet != msg.sender) revert EligibilityInvalid("wallet");
        if (a.campaignId != id) revert EligibilityInvalid("campaign");
        if (block.timestamp > a.expiry) revert EligibilityInvalid("expired");
        if (eligibilityNonceUsed[msg.sender][a.nonce]) revert EligibilityInvalid("nonce");
        if (already + amount > a.maxContributionWei) revert EligibilityInvalid("amount");
        bytes32 digest = _hashTypedDataV4(
            keccak256(
                abi.encode(
                    ELIGIBILITY_TYPEHASH,
                    a.wallet,
                    a.campaignId,
                    a.maxContributionWei,
                    a.eligibilityClass,
                    a.nonce,
                    a.expiry
                )
            )
        );
        if (ECDSA.recover(digest, sig) != signer) revert EligibilityInvalid("signature");
        eligibilityNonceUsed[msg.sender][a.nonce] = true;
    }

    // -------------------------------------------------------------- funding close
    /// @notice After the deadline: threshold met -> FundingSuccessful, else -> Refunding.
    function closeFunding(uint256 id) external onlyRole(CAMPAIGN_MANAGER_ROLE) {
        Campaign storage c = _campaigns[id];
        if (c.state != State.FundingOpen) revert InvalidState(c.state, State.FundingOpen);
        if (c.closingTime == 0 || block.timestamp <= c.closingTime) revert DeadlineNotReached(c.closingTime);
        if (c.totalCommitted >= c.minThreshold && c.totalCommitted > 0) {
            _setState(c, id, State.FundingSuccessful);
        } else {
            _setState(c, id, State.Refunding);
            emit RefundsEnabled(id);
        }
    }

    // -------------------------------------------------------------- cancel & refunds
    function cancelCampaign(uint256 id, bytes32 reasonHash) external onlyRole(CAMPAIGN_MANAGER_ROLE) {
        Campaign storage c = _campaigns[id];
        if (c.state == State.None) revert CampaignNotFound(id);
        // Cannot cancel once funds have been released to acquisition.
        if (
            c.state == State.Acquired || c.state == State.InterestsIssued || c.state == State.Cancelled
                || c.state == State.Refunded
        ) {
            revert InvalidState(c.state, State.Cancelled);
        }
        _setState(c, id, State.Cancelled);
        emit CampaignCancelled(id, reasonHash);
    }

    /// @notice Enable pull refunds for a cancelled campaign.
    function enableRefunds(uint256 id) external onlyRole(CAMPAIGN_MANAGER_ROLE) {
        Campaign storage c = _campaigns[id];
        if (c.state != State.Cancelled) revert InvalidState(c.state, State.Cancelled);
        _setState(c, id, State.Refunding);
        emit RefundsEnabled(id);
    }

    /// @notice Participant claims their own full refund. Pull-based, single claim.
    function claimRefund(uint256 id) external nonReentrant {
        Campaign storage c = _campaigns[id];
        if (c.state != State.Refunding) revert RefundsNotEnabled(id);
        uint256 owed = contributedWei[id][msg.sender] - refundedWei[id][msg.sender];
        if (owed == 0) revert NothingToRefund();

        // effects
        refundedWei[id][msg.sender] += owed;
        c.totalRefunded += uint128(owed);
        emit RefundClaimed(id, msg.sender, owed);

        // interaction
        if (c.acceptedAsset == address(0)) {
            (bool ok,) = msg.sender.call{value: owed}("");
            if (!ok) revert TransferFailed(msg.sender);
        } else {
            SafeERC20.safeTransfer(IERC20(c.acceptedAsset), msg.sender, owed);
        }
    }

    // -------------------------------------------------------------- acquisition
    /// @notice Authorize the acquisition close. Requires the authorizer role AND
    ///         a signed acquisition certificate (evidence). Only from
    ///         FundingSuccessful. Sets destination + moves to AcquisitionPending.
    function authorizeAcquisition(AcquisitionAuthorization calldata a, bytes calldata signature)
        external
        onlyRole(ACQUISITION_AUTHORIZER_ROLE)
    {
        Campaign storage c = _campaigns[a.campaignId];
        if (c.state != State.FundingSuccessful) revert InvalidState(c.state, State.FundingSuccessful);
        if (a.approvedPaymentDestination == address(0)) revert EvidenceInvalid("destination");
        if (block.timestamp > a.authorizationExpiry) revert EvidenceInvalid("expired");
        if (acquisitionNonceUsed[a.authorizationNonce]) revert EvidenceInvalid("nonce");
        if (a.finalAcquisitionPrice == 0 || a.finalAcquisitionPrice > c.totalCommitted) {
            revert EvidenceInvalid("price");
        }
        if (a.acquisitionAgreementHash == bytes32(0) || a.closingDocumentHash == bytes32(0)) {
            revert EvidenceInvalid("documents");
        }
        // Evidence must be co-signed by the eligibility/compliance signer when set.
        if (eligibilitySigner != address(0)) {
            bytes32 digest = _hashTypedDataV4(
                keccak256(
                    abi.encode(
                        ACQUISITION_TYPEHASH,
                        a.campaignId,
                        a.finalAcquisitionPrice,
                        a.approvedPaymentDestination,
                        a.acquisitionAgreementHash,
                        a.SPVIdentifier,
                        a.closingDocumentHash,
                        a.authorizationExpiry,
                        a.authorizationNonce
                    )
                )
            );
            if (ECDSA.recover(digest, signature) != eligibilitySigner) revert EvidenceInvalid("signature");
        }

        acquisitionNonceUsed[a.authorizationNonce] = true;
        c.acquisitionDestination = a.approvedPaymentDestination;
        c.finalAcquisitionPrice = uint128(a.finalAcquisitionPrice);
        _setState(c, a.campaignId, State.AcquisitionPending);
        emit AcquisitionAuthorized(
            a.campaignId,
            a.approvedPaymentDestination,
            a.finalAcquisitionPrice,
            a.acquisitionAgreementHash,
            a.SPVIdentifier,
            a.closingDocumentHash,
            block.timestamp
        );
    }

    /// @notice Release the acquisition funds to the approved destination (+fee).
    ///         Any excess above the final price stays escrowed for pro-rata
    ///         refund. Moves the campaign to Acquired.
    function releaseAcquisitionFunds(uint256 id, bytes32 evidenceHash)
        external
        onlyRole(ACQUISITION_AUTHORIZER_ROLE)
        nonReentrant
    {
        Campaign storage c = _campaigns[id];
        if (c.state != State.AcquisitionPending) revert InvalidState(c.state, State.AcquisitionPending);
        if (c.acquisitionDestination == address(0)) revert AcquisitionNotAuthorized();

        uint256 price = c.finalAcquisitionPrice;
        uint256 fee = (price * c.feeBps) / 10_000;
        uint256 toSeller = price - fee;

        // effects
        c.releasedAmount = uint128(price);
        _setState(c, id, State.Acquired);
        emit AcquisitionFundsReleased(id, c.acquisitionDestination, toSeller, fee, evidenceHash, block.timestamp);
        emit PropertyAcquired(id, price);
        if (c.totalCommitted > price) emit ExcessRefundEnabled(id, uint256(c.totalCommitted) - price);

        // interactions
        if (c.acceptedAsset == address(0)) {
            (bool ok1,) = c.acquisitionDestination.call{value: toSeller}("");
            if (!ok1) revert TransferFailed(c.acquisitionDestination);
            if (fee > 0) {
                address fr = c.feeRecipient;
                (bool ok2,) = fr.call{value: fee}("");
                if (!ok2) revert TransferFailed(fr);
            }
        } else {
            SafeERC20.safeTransfer(IERC20(c.acceptedAsset), c.acquisitionDestination, toSeller);
            if (fee > 0) {
                SafeERC20.safeTransfer(IERC20(c.acceptedAsset), c.feeRecipient, fee);
            }
        }
    }

    /// @notice Mark interests issuable after acquisition (config step).
    function finalizeInterests(uint256 id) external onlyRole(CAMPAIGN_MANAGER_ROLE) {
        Campaign storage c = _campaigns[id];
        if (c.state != State.Acquired) revert NotAcquired(id);
        _setState(c, id, State.InterestsIssued);
    }

    /// @notice Participant claims final participation units (on the portion that
    ///         funded the acquisition) plus any proportional excess refund.
    ///         Pull-based, single claim. Units are transfer-restricted by default.
    function claimUnitsAndExcess(uint256 id) external nonReentrant {
        Campaign storage c = _campaigns[id];
        if (c.state != State.Acquired && c.state != State.InterestsIssued) revert NotAcquired(id);
        if (finalClaimed[id][msg.sender]) revert AlreadyClaimed();

        uint256 contributed = contributedWei[id][msg.sender];
        if (contributed == 0) revert NothingToRefund();

        uint256 raised = c.totalCommitted;
        uint256 acquired = c.releasedAmount;
        // portion of this wallet's contribution that actually funded acquisition
        uint256 effective = (contributed * acquired) / raised;
        // align down to a whole unit; remainder is refunded as excess
        uint256 units = effective / c.weiPerUnit;
        uint256 investedForUnits = units * c.weiPerUnit;
        uint256 excess = contributed - investedForUnits;

        // effects
        finalClaimed[id][msg.sender] = true;
        if (excess > 0) {
            c.totalRefunded += uint128(excess);
        }
        if (units > 0) {
            unitsIssued[id] += units;
        }
        emit ParticipationUnitsIssued(id, msg.sender, units, excess);

        // interactions
        if (units > 0) _mint(msg.sender, id, units, "");
        if (excess > 0) {
            if (c.acceptedAsset == address(0)) {
                (bool ok,) = msg.sender.call{value: excess}("");
                if (!ok) revert TransferFailed(msg.sender);
            } else {
                SafeERC20.safeTransfer(IERC20(c.acceptedAsset), msg.sender, excess);
            }
        }
    }

    // -------------------------------------------------------------- admin
    function createCampaign(
        uint128 fundingTarget,
        uint128 minThreshold,
        uint128 minContribution,
        uint128 maxPerWallet,
        uint128 weiPerUnit,
        uint16 feeBps,
        address feeRecipient,
        ExcessPolicy excessPolicy,
        string calldata metadataURI_,
        bytes32 termsHash_
    ) external onlyRole(CAMPAIGN_MANAGER_ROLE) returns (uint256 id) {
        return createCampaign(
            fundingTarget,
            minThreshold,
            minContribution,
            maxPerWallet,
            weiPerUnit,
            feeBps,
            feeRecipient,
            excessPolicy,
            address(0),
            metadataURI_,
            termsHash_
        );
    }

    function createCampaign(
        uint128 fundingTarget,
        uint128 minThreshold,
        uint128 minContribution,
        uint128 maxPerWallet,
        uint128 weiPerUnit,
        uint16 feeBps,
        address feeRecipient,
        ExcessPolicy excessPolicy,
        address acceptedAsset,
        string calldata metadataURI_,
        bytes32 termsHash_
    ) public onlyRole(CAMPAIGN_MANAGER_ROLE) returns (uint256 id) {
        if (fundingTarget == 0) revert InvalidConfiguration("fundingTarget");
        if (weiPerUnit == 0 || fundingTarget % weiPerUnit != 0) revert InvalidConfiguration("weiPerUnit");
        if (minContribution == 0 || minContribution % weiPerUnit != 0) revert InvalidConfiguration("minContribution");
        if (minThreshold == 0 || minThreshold > fundingTarget || minThreshold % weiPerUnit != 0) {
            revert InvalidConfiguration("minThreshold");
        }
        if (maxPerWallet != 0 && maxPerWallet < minContribution) revert InvalidConfiguration("maxPerWallet");
        if (feeBps > 1000) revert InvalidConfiguration("feeBps"); // <=10%
        if (feeBps > 0 && feeRecipient == address(0)) revert InvalidConfiguration("feeRecipient");
        if (termsHash_ == bytes32(0)) revert InvalidConfiguration("termsHash");

        id = nextCampaignId++;
        Campaign storage c = _campaigns[id];
        c.fundingTarget = fundingTarget;
        c.minThreshold = minThreshold;
        c.minContribution = minContribution;
        c.maxPerWallet = maxPerWallet;
        c.weiPerUnit = weiPerUnit;
        c.feeBps = feeBps;
        c.feeRecipient = feeRecipient;
        c.excessPolicy = excessPolicy;
        c.acceptedAsset = acceptedAsset;
        c.state = State.Draft;
        metadataURI[id] = metadataURI_;
        termsHash[id] = termsHash_;
        emit CampaignCreated(id, fundingTarget, minThreshold, weiPerUnit, metadataURI_, termsHash_);
    }

    function scheduleCampaign(uint256 id, uint64 openingTime, uint64 closingTime)
        external
        onlyRole(CAMPAIGN_MANAGER_ROLE)
    {
        Campaign storage c = _campaigns[id];
        if (c.state != State.Draft && c.state != State.DueDiligence) revert InvalidState(c.state, State.Draft);
        if (closingTime == 0 || closingTime <= openingTime) revert InvalidConfiguration("closingTime");
        c.openingTime = openingTime;
        c.closingTime = closingTime;
        _setState(c, id, State.Scheduled);
    }

    function setDueDiligence(uint256 id) external onlyRole(CAMPAIGN_MANAGER_ROLE) {
        Campaign storage c = _campaigns[id];
        if (c.state != State.Draft) revert InvalidState(c.state, State.Draft);
        _setState(c, id, State.DueDiligence);
    }

    /// @notice Open a scheduled campaign for funding. Requires a closing time.
    function openCampaign(uint256 id) external onlyRole(CAMPAIGN_MANAGER_ROLE) {
        Campaign storage c = _campaigns[id];
        if (c.state != State.Scheduled) revert InvalidState(c.state, State.Scheduled);
        if (c.closingTime == 0) revert InvalidConfiguration("closingTime");
        _setState(c, id, State.FundingOpen);
        emit CampaignOpened(id, c.openingTime, c.closingTime);
    }

    function closeCampaign(uint256 id) external onlyRole(CAMPAIGN_MANAGER_ROLE) {
        Campaign storage c = _campaigns[id];
        if (c.state != State.InterestsIssued) revert InvalidState(c.state, State.InterestsIssued);
        emit CampaignClosed(id);
    }

    function updateMetadata(uint256 id, string calldata uri_, bytes32 terms_) external onlyRole(CAMPAIGN_MANAGER_ROLE) {
        Campaign storage c = _campaigns[id];
        if (c.state == State.None) revert CampaignNotFound(id);
        // Frozen once funding opens.
        if (uint8(c.state) >= uint8(State.FundingOpen)) revert InvalidState(c.state, State.Scheduled);
        metadataURI[id] = uri_;
        termsHash[id] = terms_;
    }

    function setTransfersEnabled(uint256 id, bool enabled) external onlyRole(DEFAULT_ADMIN_ROLE) {
        Campaign storage c = _campaigns[id];
        if (c.state == State.None) revert CampaignNotFound(id);
        c.transfersEnabled = enabled;
        emit TransferPolicyUpdated(id, enabled);
    }

    function setEligibilitySigner(address signer) external onlyRole(ELIGIBILITY_MANAGER_ROLE) {
        eligibilitySigner = signer;
        emit EligibilitySignerUpdated(signer);
    }

    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    // -------------------------------------------------------------- internal
    function _setState(Campaign storage c, uint256 id, State to) internal {
        State from = c.state;
        c.state = to;
        emit CampaignStateChanged(id, from, to);
    }

    /// @dev Final participation units are transfer-restricted until governance
    ///      enables transfers for that campaign. Mint/burn always allowed.
    function _update(address from, address to, uint256[] memory ids, uint256[] memory values) internal override {
        if (from != address(0) && to != address(0)) {
            for (uint256 i = 0; i < ids.length; i++) {
                if (!_campaigns[ids[i]].transfersEnabled) revert TransfersDisabled(ids[i]);
            }
        }
        super._update(from, to, ids, values);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC1155, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
