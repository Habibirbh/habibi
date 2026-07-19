// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/// @title  Habibi Property Pools
/// @notice Primary participation pools for fractional interests in curated UAE
///         real-estate opportunities. Each pool (one ERC-1155 token id) accepts
///         native ETH up to an immutable funding target, mints participation
///         units at a fixed wei-per-unit conversion, and atomically forwards
///         accepted ETH to the pool's configured treasury.
///
/// @dev    LEGAL NOTE: units are contract-recorded fractional interests that a
///         legal backend maps to off-chain participation agreements (see
///         `termsHash` / `metadataURI`). Units are NOT, by themselves, UAE land
///         title. Transfers are disabled per-pool until the transfer policy is
///         explicitly enabled by governance.
///
///         Refunds follow Model A (immediate treasury forwarding): the contract
///         holds no purchase ETH, so refunds for a cancelled pool require the
///         treasury to fund the refund pool via {fundRefunds}. Refunds are
///         therefore operational, not automatic, and the UI must say so.
///
///         Security posture: non-upgradeable, checks-effects-interactions,
///         ReentrancyGuard on all ETH paths, custom errors, no delegatecall,
///         no tx.origin, no owner-withdraw route (contract is not designed to
///         custody ETH outside the refund pool).
contract HabibiPropertyPools is ERC1155, AccessControl, Pausable, ReentrancyGuard, EIP712 {
    // ---------------------------------------------------------------------
    // Roles
    // ---------------------------------------------------------------------

    bytes32 public constant PROPERTY_MANAGER_ROLE = keccak256("PROPERTY_MANAGER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant ELIGIBILITY_MANAGER_ROLE = keccak256("ELIGIBILITY_MANAGER_ROLE");

    // ---------------------------------------------------------------------
    // Types
    // ---------------------------------------------------------------------

    enum Status {
        None, // unset / does not exist
        Draft,
        Scheduled,
        Open,
        Funded,
        Closed,
        Cancelled
    }

    struct Property {
        // --- configuration (immutable once opened) ---
        uint128 fundingTargetWei;
        uint128 minContributionWei;
        uint128 maxPerWalletWei; // 0 = unlimited
        uint128 weiPerUnit; // fixed conversion, > 0
        uint64 openingTime; // 0 = immediately once Open
        uint64 closingTime; // 0 = no deadline
        address treasury;
        bytes32 termsHash; // hash of the governing participation terms
        string metadataURI; // off-chain metadata (name, docs, media)
        // --- live accounting ---
        uint128 totalContributedWei;
        uint128 refundPoolWei;
        uint64 participantCount;
        Status status;
        bool purchasesPaused;
        bool transfersEnabled;
        bool refundsEnabled;
    }

    struct EligibilityAuthorization {
        address wallet;
        uint256 propertyId;
        uint256 maxContributionWei; // cumulative cap authorised for this wallet+property
        bytes32 eligibilityClass;
        uint256 nonce;
        uint256 expiry;
    }

    // ---------------------------------------------------------------------
    // Storage
    // ---------------------------------------------------------------------

    uint256 public nextPropertyId = 1;
    mapping(uint256 propertyId => Property) internal _properties;

    /// @notice Wei contributed by a wallet to a pool (never decreases; refunds
    ///         are tracked separately in {refundClaimedWei}).
    mapping(uint256 propertyId => mapping(address wallet => uint256)) public contributedWei;
    mapping(uint256 propertyId => mapping(address wallet => uint256)) public refundClaimedWei;

    /// @notice Total units minted per pool (mirror of ERC1155 supply).
    mapping(uint256 propertyId => uint256) public unitsIssued;

    /// @notice EIP-712 nonce replay protection, per wallet.
    mapping(address wallet => mapping(uint256 nonce => bool)) public nonceUsed;

    /// @notice Compliance signer. address(0) disables eligibility enforcement —
    ///         permitted only for local/test deployments; production deploys
    ///         MUST set a signer before opening pools (see SECURITY_MODEL.md).
    address public eligibilitySigner;

    /// @notice Lifetime ETH forwarded to treasuries across all pools.
    uint256 public totalForwardedWei;

    bytes32 private constant ELIGIBILITY_TYPEHASH = keccak256(
        "EligibilityAuthorization(address wallet,uint256 propertyId,uint256 maxContributionWei,bytes32 eligibilityClass,uint256 nonce,uint256 expiry)"
    );

    // ---------------------------------------------------------------------
    // Events
    // ---------------------------------------------------------------------

    event PropertyCreated(
        uint256 indexed propertyId,
        address indexed treasury,
        uint256 fundingTargetWei,
        uint256 weiPerUnit,
        string metadataURI,
        bytes32 termsHash
    );
    event PropertyScheduled(uint256 indexed propertyId, uint64 openingTime, uint64 closingTime);
    event PropertyOpened(uint256 indexed propertyId);
    event PropertyPurchasePaused(uint256 indexed propertyId, bool paused);
    event PropertyFunded(uint256 indexed propertyId, uint256 totalContributedWei);
    event PropertyClosed(uint256 indexed propertyId);
    event PropertyCancelled(uint256 indexed propertyId);
    event PropertyMetadataUpdated(uint256 indexed propertyId, string metadataURI, bytes32 termsHash);
    event TransferPolicyUpdated(uint256 indexed propertyId, bool transfersEnabled);
    event EligibilitySignerUpdated(address indexed signer);
    event RefundsEnabled(uint256 indexed propertyId);
    event RefundPoolFunded(uint256 indexed propertyId, address indexed funder, uint256 amountWei);
    event RefundClaimed(uint256 indexed propertyId, address indexed wallet, uint256 amountWei, uint256 unitsBurned);

    event PropertyPurchased(
        uint256 indexed propertyId,
        address indexed purchaser,
        address indexed treasury,
        uint256 amountWei,
        uint256 unitsIssued,
        uint256 propertyTotalContributedWei,
        uint256 timestamp
    );

    // ---------------------------------------------------------------------
    // Errors
    // ---------------------------------------------------------------------

    error PropertyNotFound(uint256 propertyId);
    error InvalidConfiguration(string field);
    error InvalidStateTransition(Status from, Status to);
    error PropertyNotOpen(uint256 propertyId, Status status);
    error PurchasesArePaused(uint256 propertyId);
    error NotYetOpen(uint64 openingTime);
    error AlreadyClosed(uint64 closingTime);
    error BelowMinimum(uint256 minimumWei);
    error AboveWalletMaximum(uint256 maxPerWalletWei, uint256 alreadyContributedWei);
    error ExceedsRemaining(uint256 remainingWei);
    error NotUnitMultiple(uint256 weiPerUnit);
    error ZeroContribution();
    error SlippageUnitsTooLow(uint256 unitsOut, uint256 minimumUnitsOut);
    error EligibilityRequired();
    error EligibilityExpired(uint256 expiry);
    error EligibilityNonceUsed(uint256 nonce);
    error EligibilityWalletMismatch(address expected, address actual);
    error EligibilityPropertyMismatch(uint256 expected, uint256 actual);
    error EligibilityAmountExceeded(uint256 maxAuthorizedWei);
    error EligibilityInvalidSignature();
    error TreasuryTransferFailed(address treasury);
    error ImmutableAfterOpen(string field);
    error TransfersDisabled(uint256 propertyId);
    error RefundsNotEnabled(uint256 propertyId);
    error NothingToRefund(uint256 propertyId, address wallet);
    error RefundPoolInsufficient(uint256 availableWei, uint256 requiredWei);

    // ---------------------------------------------------------------------
    // Construction
    // ---------------------------------------------------------------------

    /// @param admin  Initial admin (deployer during setup; roles are transferred
    ///               to the governance multisig post-deployment and the
    ///               deployer's roles revoked — see script/TransferRoles.s.sol).
    constructor(address admin) ERC1155("") EIP712("HabibiPropertyPools", "1") {
        if (admin == address(0)) revert InvalidConfiguration("admin");
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(PROPERTY_MANAGER_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
        _grantRole(ELIGIBILITY_MANAGER_ROLE, admin);
    }

    // ---------------------------------------------------------------------
    // Views
    // ---------------------------------------------------------------------

    function getProperty(uint256 propertyId) external view returns (Property memory) {
        Property memory p = _properties[propertyId];
        if (p.status == Status.None) revert PropertyNotFound(propertyId);
        return p;
    }

    function propertyExists(uint256 propertyId) public view returns (bool) {
        return _properties[propertyId].status != Status.None;
    }

    /// @notice Remaining capacity in wei (0 when funded/closed).
    function remainingCapacityWei(uint256 propertyId) public view returns (uint256) {
        Property storage p = _properties[propertyId];
        if (p.status == Status.None) revert PropertyNotFound(propertyId);
        return uint256(p.fundingTargetWei) - uint256(p.totalContributedWei);
    }

    /// @notice Funded ratio in basis points (0..10_000), computed from contract
    ///         accounting — never from any wallet balance.
    function fundedBps(uint256 propertyId) external view returns (uint256) {
        Property storage p = _properties[propertyId];
        if (p.status == Status.None) revert PropertyNotFound(propertyId);
        return (uint256(p.totalContributedWei) * 10_000) / uint256(p.fundingTargetWei);
    }

    /// @notice ERC-1155 metadata URI per property.
    function uri(uint256 propertyId) public view override returns (string memory) {
        return _properties[propertyId].metadataURI;
    }

    // ---------------------------------------------------------------------
    // Purchase
    // ---------------------------------------------------------------------

    /// @notice Contribute native ETH to an open pool. Atomically validates,
    ///         updates accounting, mints units, and forwards the full amount to
    ///         the pool treasury; reverts entirely if forwarding fails.
    /// @param propertyId       Pool / ERC-1155 token id.
    /// @param minimumUnitsOut  Slippage floor on units issued.
    /// @param eligibilityData  abi.encode(EligibilityAuthorization, bytes signature).
    ///                         Ignored (may be empty) when eligibilitySigner is
    ///                         unset (test deployments only).
    function purchase(uint256 propertyId, uint256 minimumUnitsOut, bytes calldata eligibilityData)
        external
        payable
        nonReentrant
        whenNotPaused
    {
        Property storage p = _properties[propertyId];

        // ----- checks -----
        if (p.status == Status.None) revert PropertyNotFound(propertyId);
        if (p.status != Status.Open) revert PropertyNotOpen(propertyId, p.status);
        if (p.purchasesPaused) revert PurchasesArePaused(propertyId);
        if (p.openingTime != 0 && block.timestamp < p.openingTime) revert NotYetOpen(p.openingTime);
        if (p.closingTime != 0 && block.timestamp > p.closingTime) revert AlreadyClosed(p.closingTime);
        if (msg.value == 0) revert ZeroContribution();
        if (msg.value % p.weiPerUnit != 0) revert NotUnitMultiple(p.weiPerUnit);
        if (msg.value < p.minContributionWei) revert BelowMinimum(p.minContributionWei);

        uint256 already = contributedWei[propertyId][msg.sender];
        if (p.maxPerWalletWei != 0 && already + msg.value > p.maxPerWalletWei) {
            revert AboveWalletMaximum(p.maxPerWalletWei, already);
        }

        uint256 remaining = uint256(p.fundingTargetWei) - uint256(p.totalContributedWei);
        if (msg.value > remaining) revert ExceedsRemaining(remaining);

        _checkEligibility(propertyId, already, eligibilityData);

        uint256 units = msg.value / p.weiPerUnit;
        if (units < minimumUnitsOut) revert SlippageUnitsTooLow(units, minimumUnitsOut);

        // ----- effects -----
        if (already == 0) p.participantCount += 1;
        contributedWei[propertyId][msg.sender] = already + msg.value;
        // Safe: msg.value <= remaining <= fundingTargetWei (uint128).
        // forge-lint: disable-next-line(unsafe-typecast)
        p.totalContributedWei += uint128(msg.value);
        unitsIssued[propertyId] += units;
        totalForwardedWei += msg.value;

        bool nowFunded = p.totalContributedWei == p.fundingTargetWei;
        if (nowFunded) p.status = Status.Funded;

        _mint(msg.sender, propertyId, units, "");

        emit PropertyPurchased(
            propertyId, msg.sender, p.treasury, msg.value, units, p.totalContributedWei, block.timestamp
        );
        if (nowFunded) emit PropertyFunded(propertyId, p.totalContributedWei);

        // ----- interaction -----
        (bool ok,) = p.treasury.call{value: msg.value}("");
        if (!ok) revert TreasuryTransferFailed(p.treasury);
    }

    function _checkEligibility(uint256 propertyId, uint256 alreadyContributed, bytes calldata eligibilityData)
        internal
    {
        address signer = eligibilitySigner;
        if (signer == address(0)) return; // test/dev deployments only

        if (eligibilityData.length == 0) revert EligibilityRequired();
        (EligibilityAuthorization memory auth, bytes memory signature) =
            abi.decode(eligibilityData, (EligibilityAuthorization, bytes));

        if (auth.wallet != msg.sender) revert EligibilityWalletMismatch(auth.wallet, msg.sender);
        if (auth.propertyId != propertyId) revert EligibilityPropertyMismatch(auth.propertyId, propertyId);
        if (block.timestamp > auth.expiry) revert EligibilityExpired(auth.expiry);
        if (nonceUsed[msg.sender][auth.nonce]) revert EligibilityNonceUsed(auth.nonce);
        if (alreadyContributed + msg.value > auth.maxContributionWei) {
            revert EligibilityAmountExceeded(auth.maxContributionWei);
        }

        bytes32 digest = _hashTypedDataV4(
            keccak256(
                abi.encode(
                    ELIGIBILITY_TYPEHASH,
                    auth.wallet,
                    auth.propertyId,
                    auth.maxContributionWei,
                    auth.eligibilityClass,
                    auth.nonce,
                    auth.expiry
                )
            )
        );
        if (ECDSA.recover(digest, signature) != signer) revert EligibilityInvalidSignature();

        nonceUsed[msg.sender][auth.nonce] = true;
    }

    // ---------------------------------------------------------------------
    // Refunds — Model A (treasury-funded; NOT automatic)
    // ---------------------------------------------------------------------

    /// @notice Fund the refund pool of a cancelled property. Callable by anyone
    ///         (operationally: the treasury), so refund capital can only enter,
    ///         never be redirected.
    function fundRefunds(uint256 propertyId) external payable nonReentrant {
        Property storage p = _properties[propertyId];
        if (p.status == Status.None) revert PropertyNotFound(propertyId);
        if (!p.refundsEnabled) revert RefundsNotEnabled(propertyId);
        if (msg.value == 0) revert ZeroContribution();
        // Refund pool never needs to exceed what was contributed (uint128).
        if (msg.value > type(uint128).max - p.refundPoolWei) revert InvalidConfiguration("refund overflow");
        // forge-lint: disable-next-line(unsafe-typecast)
        p.refundPoolWei += uint128(msg.value);
        emit RefundPoolFunded(propertyId, msg.sender, msg.value);
    }

    /// @notice Claim a refund of recorded contributions for a cancelled,
    ///         refund-enabled property. Burns the claimant's units.
    function claimRefund(uint256 propertyId) external nonReentrant {
        Property storage p = _properties[propertyId];
        if (p.status == Status.None) revert PropertyNotFound(propertyId);
        if (!p.refundsEnabled) revert RefundsNotEnabled(propertyId);

        uint256 owed = contributedWei[propertyId][msg.sender] - refundClaimedWei[propertyId][msg.sender];
        if (owed == 0) revert NothingToRefund(propertyId, msg.sender);
        if (p.refundPoolWei < owed) revert RefundPoolInsufficient(p.refundPoolWei, owed);

        // effects
        refundClaimedWei[propertyId][msg.sender] += owed;
        // Safe: owed <= refundPoolWei checked above; both bounded by uint128.
        // forge-lint: disable-next-line(unsafe-typecast)
        p.refundPoolWei -= uint128(owed);
        uint256 units = balanceOf(msg.sender, propertyId);
        if (units > 0) {
            unitsIssued[propertyId] -= units;
            _burn(msg.sender, propertyId, units);
        }
        emit RefundClaimed(propertyId, msg.sender, owed, units);

        // interaction
        (bool ok,) = msg.sender.call{value: owed}("");
        if (!ok) revert TreasuryTransferFailed(msg.sender);
    }

    // ---------------------------------------------------------------------
    // Administration
    // ---------------------------------------------------------------------

    function createProperty(
        uint128 fundingTargetWei,
        uint128 minContributionWei,
        uint128 maxPerWalletWei,
        uint128 weiPerUnit,
        address treasury,
        string calldata metadataURI,
        bytes32 termsHash
    ) external onlyRole(PROPERTY_MANAGER_ROLE) returns (uint256 propertyId) {
        if (treasury == address(0)) revert InvalidConfiguration("treasury");
        if (fundingTargetWei == 0) revert InvalidConfiguration("fundingTargetWei");
        if (weiPerUnit == 0) revert InvalidConfiguration("weiPerUnit");
        if (fundingTargetWei % weiPerUnit != 0) revert InvalidConfiguration("target not unit-aligned");
        if (minContributionWei == 0 || minContributionWei % weiPerUnit != 0) {
            revert InvalidConfiguration("minContributionWei");
        }
        if (maxPerWalletWei != 0 && maxPerWalletWei < minContributionWei) {
            revert InvalidConfiguration("maxPerWalletWei");
        }

        propertyId = nextPropertyId++;
        Property storage p = _properties[propertyId];
        p.fundingTargetWei = fundingTargetWei;
        p.minContributionWei = minContributionWei;
        p.maxPerWalletWei = maxPerWalletWei;
        p.weiPerUnit = weiPerUnit;
        p.treasury = treasury;
        p.metadataURI = metadataURI;
        p.termsHash = termsHash;
        p.status = Status.Draft;

        emit PropertyCreated(propertyId, treasury, fundingTargetWei, weiPerUnit, metadataURI, termsHash);
    }

    function scheduleProperty(uint256 propertyId, uint64 openingTime, uint64 closingTime)
        external
        onlyRole(PROPERTY_MANAGER_ROLE)
    {
        Property storage p = _requireStatus(propertyId, Status.Draft);
        if (closingTime != 0 && closingTime <= openingTime) revert InvalidConfiguration("closingTime");
        p.openingTime = openingTime;
        p.closingTime = closingTime;
        p.status = Status.Scheduled;
        emit PropertyScheduled(propertyId, openingTime, closingTime);
    }

    function openProperty(uint256 propertyId) external onlyRole(PROPERTY_MANAGER_ROLE) {
        Property storage p = _properties[propertyId];
        if (p.status == Status.None) revert PropertyNotFound(propertyId);
        if (p.status != Status.Draft && p.status != Status.Scheduled) {
            revert InvalidStateTransition(p.status, Status.Open);
        }
        p.status = Status.Open;
        emit PropertyOpened(propertyId);
    }

    function setPurchasesPaused(uint256 propertyId, bool paused_) external onlyRole(PAUSER_ROLE) {
        Property storage p = _properties[propertyId];
        if (p.status == Status.None) revert PropertyNotFound(propertyId);
        p.purchasesPaused = paused_;
        emit PropertyPurchasePaused(propertyId, paused_);
    }

    function closeProperty(uint256 propertyId) external onlyRole(PROPERTY_MANAGER_ROLE) {
        Property storage p = _properties[propertyId];
        if (p.status == Status.None) revert PropertyNotFound(propertyId);
        if (p.status != Status.Open && p.status != Status.Funded) {
            revert InvalidStateTransition(p.status, Status.Closed);
        }
        p.status = Status.Closed;
        emit PropertyClosed(propertyId);
    }

    function cancelProperty(uint256 propertyId) external onlyRole(PROPERTY_MANAGER_ROLE) {
        Property storage p = _properties[propertyId];
        if (p.status == Status.None) revert PropertyNotFound(propertyId);
        if (p.status == Status.Closed || p.status == Status.Cancelled) {
            revert InvalidStateTransition(p.status, Status.Cancelled);
        }
        p.status = Status.Cancelled;
        emit PropertyCancelled(propertyId);
    }

    function enableRefunds(uint256 propertyId) external onlyRole(PROPERTY_MANAGER_ROLE) {
        Property storage p = _requireStatus(propertyId, Status.Cancelled);
        p.refundsEnabled = true;
        emit RefundsEnabled(propertyId);
    }

    /// @notice Metadata may only change before a pool opens; after opening the
    ///         terms participants purchased under are frozen.
    function updateMetadata(uint256 propertyId, string calldata metadataURI, bytes32 termsHash)
        external
        onlyRole(PROPERTY_MANAGER_ROLE)
    {
        Property storage p = _properties[propertyId];
        if (p.status == Status.None) revert PropertyNotFound(propertyId);
        if (p.status != Status.Draft && p.status != Status.Scheduled) revert ImmutableAfterOpen("metadata");
        p.metadataURI = metadataURI;
        p.termsHash = termsHash;
        emit PropertyMetadataUpdated(propertyId, metadataURI, termsHash);
    }

    function setTransfersEnabled(uint256 propertyId, bool enabled) external onlyRole(DEFAULT_ADMIN_ROLE) {
        Property storage p = _properties[propertyId];
        if (p.status == Status.None) revert PropertyNotFound(propertyId);
        p.transfersEnabled = enabled;
        emit TransferPolicyUpdated(propertyId, enabled);
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

    // ---------------------------------------------------------------------
    // Transfer policy hook
    // ---------------------------------------------------------------------

    /// @dev Mint (from == 0) and burn (to == 0) are always allowed; wallet-to-
    ///      wallet transfers require the per-pool policy to be enabled.
    function _update(address from, address to, uint256[] memory ids, uint256[] memory values) internal override {
        if (from != address(0) && to != address(0)) {
            for (uint256 i = 0; i < ids.length; i++) {
                if (!_properties[ids[i]].transfersEnabled) revert TransfersDisabled(ids[i]);
            }
        }
        super._update(from, to, ids, values);
    }

    // ---------------------------------------------------------------------
    // Internal helpers
    // ---------------------------------------------------------------------

    function _requireStatus(uint256 propertyId, Status expected) internal view returns (Property storage p) {
        p = _properties[propertyId];
        if (p.status == Status.None) revert PropertyNotFound(propertyId);
        if (p.status != expected) revert InvalidStateTransition(p.status, expected);
    }

    // ---------------------------------------------------------------------
    // Interface support
    // ---------------------------------------------------------------------

    function supportsInterface(bytes4 interfaceId) public view override(ERC1155, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
