// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test} from "forge-std/Test.sol";
import {HabibiPropertyPools} from "../src/HabibiPropertyPools.sol";

/// @dev Treasury that rejects ETH — used to prove atomic revert on forwarding failure.
contract RejectingTreasury {
    receive() external payable {
        revert("no");
    }
}

contract HabibiPropertyPoolsTest is Test {
    HabibiPropertyPools pools;

    address admin = makeAddr("admin");
    address treasury = makeAddr("treasury");
    address alice = makeAddr("alice");
    address bob = makeAddr("bob");
    address mallory = makeAddr("mallory");

    uint256 complianceKey = 0xC0FFEE;
    address complianceSigner;

    uint128 constant TARGET = 10 ether;
    uint128 constant MIN = 0.01 ether;
    uint128 constant UNIT = 0.01 ether; // 1 unit per 0.01 ETH -> 1000 units max

    function setUp() public {
        complianceSigner = vm.addr(complianceKey);
        pools = new HabibiPropertyPools(admin);
        vm.deal(alice, 100 ether);
        vm.deal(bob, 100 ether);
        vm.deal(mallory, 100 ether);
    }

    // ------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------

    function _createOpen(uint128 maxPerWallet) internal returns (uint256 id) {
        vm.startPrank(admin);
        id = pools.createProperty(TARGET, MIN, maxPerWallet, UNIT, treasury, "ipfs://meta/1", keccak256("terms-v1"));
        pools.openProperty(id);
        vm.stopPrank();
    }

    function _auth(address wallet, uint256 propertyId, uint256 maxWei, uint256 nonce, uint256 expiry)
        internal
        view
        returns (bytes memory)
    {
        HabibiPropertyPools.EligibilityAuthorization memory a = HabibiPropertyPools.EligibilityAuthorization({
            wallet: wallet,
            propertyId: propertyId,
            maxContributionWei: maxWei,
            eligibilityClass: keccak256("UAE_RETAIL"),
            nonce: nonce,
            expiry: expiry
        });
        bytes32 structHash = keccak256(
            abi.encode(
                keccak256(
                    "EligibilityAuthorization(address wallet,uint256 propertyId,uint256 maxContributionWei,bytes32 eligibilityClass,uint256 nonce,uint256 expiry)"
                ),
                a.wallet,
                a.propertyId,
                a.maxContributionWei,
                a.eligibilityClass,
                a.nonce,
                a.expiry
            )
        );
        bytes32 domainSeparator = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256(bytes("HabibiPropertyPools")),
                keccak256(bytes("1")),
                block.chainid,
                address(pools)
            )
        );
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", domainSeparator, structHash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(complianceKey, digest);
        return abi.encode(a, abi.encodePacked(r, s, v));
    }

    // ------------------------------------------------------------------
    // Creation & configuration
    // ------------------------------------------------------------------

    function test_CreateProperty() public {
        vm.prank(admin);
        uint256 id = pools.createProperty(TARGET, MIN, 0, UNIT, treasury, "ipfs://m", keccak256("t"));
        HabibiPropertyPools.Property memory p = pools.getProperty(id);
        assertEq(p.fundingTargetWei, TARGET);
        assertEq(uint8(p.status), uint8(HabibiPropertyPools.Status.Draft));
        assertEq(p.treasury, treasury);
    }

    function test_RevertWhen_CreateWithZeroTreasury() public {
        vm.prank(admin);
        vm.expectRevert(abi.encodeWithSelector(HabibiPropertyPools.InvalidConfiguration.selector, "treasury"));
        pools.createProperty(TARGET, MIN, 0, UNIT, address(0), "", bytes32(0));
    }

    function test_RevertWhen_TargetNotUnitAligned() public {
        vm.prank(admin);
        vm.expectRevert();
        pools.createProperty(TARGET + 1, MIN, 0, UNIT, treasury, "", bytes32(0));
    }

    function test_RevertWhen_NonManagerCreates() public {
        vm.prank(mallory);
        vm.expectRevert();
        pools.createProperty(TARGET, MIN, 0, UNIT, treasury, "", bytes32(0));
    }

    function test_RevertWhen_PurchaseOnDraft() public {
        vm.prank(admin);
        uint256 id = pools.createProperty(TARGET, MIN, 0, UNIT, treasury, "", bytes32(0));
        vm.prank(alice);
        vm.expectRevert();
        pools.purchase{value: 1 ether}(id, 0, "");
    }

    function test_RevertWhen_MetadataUpdateAfterOpen() public {
        uint256 id = _createOpen(0);
        vm.prank(admin);
        vm.expectRevert(abi.encodeWithSelector(HabibiPropertyPools.ImmutableAfterOpen.selector, "metadata"));
        pools.updateMetadata(id, "ipfs://new", keccak256("new"));
    }

    // ------------------------------------------------------------------
    // Purchase
    // ------------------------------------------------------------------

    function test_SuccessfulPurchase() public {
        uint256 id = _createOpen(0);
        uint256 treasuryBefore = treasury.balance;

        vm.prank(alice);
        pools.purchase{value: 1 ether}(id, 100, "");

        assertEq(pools.contributedWei(id, alice), 1 ether);
        assertEq(pools.balanceOf(alice, id), 100); // 1 ETH / 0.01 = 100 units
        assertEq(pools.unitsIssued(id), 100);
        assertEq(treasury.balance, treasuryBefore + 1 ether, "ETH forwarded atomically");
        assertEq(address(pools).balance, 0, "contract retains nothing");
        assertEq(pools.totalForwardedWei(), 1 ether);
        assertEq(pools.getProperty(id).participantCount, 1);
        assertEq(pools.fundedBps(id), 1000); // 10%
    }

    function test_PurchaseEmitsEvent() public {
        uint256 id = _createOpen(0);
        vm.prank(alice);
        vm.expectEmit(true, true, true, true);
        emit HabibiPropertyPools.PropertyPurchased(id, alice, treasury, 1 ether, 100, 1 ether, block.timestamp);
        pools.purchase{value: 1 ether}(id, 0, "");
    }

    function test_MultipleUsersAndRepeatPurchases() public {
        uint256 id = _createOpen(0);
        vm.prank(alice);
        pools.purchase{value: 2 ether}(id, 0, "");
        vm.prank(bob);
        pools.purchase{value: 3 ether}(id, 0, "");
        vm.prank(alice);
        pools.purchase{value: 1 ether}(id, 0, "");

        assertEq(pools.contributedWei(id, alice), 3 ether);
        assertEq(pools.contributedWei(id, bob), 3 ether);
        assertEq(pools.getProperty(id).totalContributedWei, 6 ether);
        assertEq(pools.getProperty(id).participantCount, 2, "repeat purchase doesn't recount");
        assertEq(treasury.balance, 6 ether);
    }

    function test_RevertWhen_BelowMinimum() public {
        // min (0.05) is a multiple of unit (0.01), so 0.01 is unit-aligned but below min
        vm.startPrank(admin);
        uint256 id = pools.createProperty(TARGET, 0.05 ether, 0, UNIT, treasury, "", bytes32(0));
        pools.openProperty(id);
        vm.stopPrank();
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(HabibiPropertyPools.BelowMinimum.selector, 0.05 ether));
        pools.purchase{value: 0.01 ether}(id, 0, "");
    }

    function test_RevertWhen_NotUnitMultiple() public {
        uint256 id = _createOpen(0);
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(HabibiPropertyPools.NotUnitMultiple.selector, UNIT));
        pools.purchase{value: 0.015 ether}(id, 0, "");
    }

    function test_RevertWhen_AboveWalletMax() public {
        uint256 id = _createOpen(2 ether);
        vm.prank(alice);
        pools.purchase{value: 1.5 ether}(id, 0, "");
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(HabibiPropertyPools.AboveWalletMaximum.selector, 2 ether, 1.5 ether));
        pools.purchase{value: 1 ether}(id, 0, "");
    }

    function test_RevertWhen_Overfunding() public {
        uint256 id = _createOpen(0);
        vm.prank(alice);
        pools.purchase{value: 9 ether}(id, 0, "");
        vm.prank(bob);
        vm.expectRevert(abi.encodeWithSelector(HabibiPropertyPools.ExceedsRemaining.selector, 1 ether));
        pools.purchase{value: 2 ether}(id, 0, "");
    }

    function test_ExactTargetCompletion_TransitionsToFunded() public {
        uint256 id = _createOpen(0);
        vm.prank(alice);
        pools.purchase{value: 9 ether}(id, 0, "");
        vm.prank(bob);
        pools.purchase{value: 1 ether}(id, 0, "");

        HabibiPropertyPools.Property memory p = pools.getProperty(id);
        assertEq(uint8(p.status), uint8(HabibiPropertyPools.Status.Funded));
        assertEq(p.totalContributedWei, TARGET);
        assertEq(pools.fundedBps(id), 10_000);

        // No further purchases once funded
        vm.prank(alice);
        vm.expectRevert();
        pools.purchase{value: MIN}(id, 0, "");
    }

    function test_RevertWhen_SlippageFloorNotMet() public {
        uint256 id = _createOpen(0);
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(HabibiPropertyPools.SlippageUnitsTooLow.selector, 100, 101));
        pools.purchase{value: 1 ether}(id, 101, "");
    }

    function test_RevertWhen_TreasuryRejectsETH() public {
        RejectingTreasury bad = new RejectingTreasury();
        vm.startPrank(admin);
        uint256 id = pools.createProperty(TARGET, MIN, 0, UNIT, address(bad), "", bytes32(0));
        pools.openProperty(id);
        vm.stopPrank();

        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(HabibiPropertyPools.TreasuryTransferFailed.selector, address(bad)));
        pools.purchase{value: 1 ether}(id, 0, "");

        // Entire purchase reverted — no accounting mutation survived
        assertEq(pools.contributedWei(id, alice), 0);
        assertEq(pools.getProperty(id).totalContributedWei, 0);
        assertEq(pools.unitsIssued(id), 0);
    }

    function test_TimestampWindow() public {
        vm.startPrank(admin);
        uint256 id = pools.createProperty(TARGET, MIN, 0, UNIT, treasury, "", bytes32(0));
        uint64 opens = uint64(block.timestamp + 1 days);
        uint64 closes = uint64(block.timestamp + 2 days);
        pools.scheduleProperty(id, opens, closes);
        pools.openProperty(id);
        vm.stopPrank();

        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(HabibiPropertyPools.NotYetOpen.selector, opens));
        pools.purchase{value: 1 ether}(id, 0, "");

        vm.warp(opens);
        vm.prank(alice);
        pools.purchase{value: 1 ether}(id, 0, "");

        vm.warp(closes + 1);
        vm.prank(bob);
        vm.expectRevert(abi.encodeWithSelector(HabibiPropertyPools.AlreadyClosed.selector, closes));
        pools.purchase{value: 1 ether}(id, 0, "");
    }

    function test_PauseBlocksPurchases() public {
        uint256 id = _createOpen(0);
        vm.prank(admin);
        pools.setPurchasesPaused(id, true);
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(HabibiPropertyPools.PurchasesArePaused.selector, id));
        pools.purchase{value: 1 ether}(id, 0, "");

        vm.prank(admin);
        pools.setPurchasesPaused(id, false);
        vm.prank(alice);
        pools.purchase{value: 1 ether}(id, 0, "");
    }

    function test_GlobalPause() public {
        uint256 id = _createOpen(0);
        vm.prank(admin);
        pools.pause();
        vm.prank(alice);
        vm.expectRevert();
        pools.purchase{value: 1 ether}(id, 0, "");
        vm.prank(admin);
        pools.unpause();
        vm.prank(alice);
        pools.purchase{value: 1 ether}(id, 0, "");
    }

    // ------------------------------------------------------------------
    // Eligibility (EIP-712)
    // ------------------------------------------------------------------

    function _enableEligibility() internal {
        vm.prank(admin);
        pools.setEligibilitySigner(complianceSigner);
    }

    function test_EligibilityRequiredWhenSignerSet() public {
        uint256 id = _createOpen(0);
        _enableEligibility();
        vm.prank(alice);
        vm.expectRevert(HabibiPropertyPools.EligibilityRequired.selector);
        pools.purchase{value: 1 ether}(id, 0, "");
    }

    function test_EligibilityValidSignature() public {
        uint256 id = _createOpen(0);
        _enableEligibility();
        bytes memory auth = _auth(alice, id, 5 ether, 1, block.timestamp + 300);
        vm.prank(alice);
        pools.purchase{value: 1 ether}(id, 0, auth);
        assertEq(pools.contributedWei(id, alice), 1 ether);
        assertTrue(pools.nonceUsed(alice, 1));
    }

    function test_RevertWhen_EligibilityExpired() public {
        uint256 id = _createOpen(0);
        _enableEligibility();
        bytes memory auth = _auth(alice, id, 5 ether, 1, block.timestamp - 1);
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(HabibiPropertyPools.EligibilityExpired.selector, block.timestamp - 1));
        pools.purchase{value: 1 ether}(id, 0, auth);
    }

    function test_RevertWhen_NonceReplayed() public {
        uint256 id = _createOpen(0);
        _enableEligibility();
        bytes memory auth = _auth(alice, id, 5 ether, 7, block.timestamp + 300);
        vm.prank(alice);
        pools.purchase{value: 1 ether}(id, 0, auth);
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(HabibiPropertyPools.EligibilityNonceUsed.selector, 7));
        pools.purchase{value: 1 ether}(id, 0, auth);
    }

    function test_RevertWhen_WrongWalletUsesAuthorization() public {
        uint256 id = _createOpen(0);
        _enableEligibility();
        bytes memory auth = _auth(alice, id, 5 ether, 1, block.timestamp + 300);
        vm.prank(mallory);
        vm.expectRevert(abi.encodeWithSelector(HabibiPropertyPools.EligibilityWalletMismatch.selector, alice, mallory));
        pools.purchase{value: 1 ether}(id, 0, auth);
    }

    function test_RevertWhen_WrongPropertyAuthorization() public {
        uint256 id = _createOpen(0);
        uint256 id2 = _createOpen(0);
        _enableEligibility();
        bytes memory auth = _auth(alice, id, 5 ether, 1, block.timestamp + 300);
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(HabibiPropertyPools.EligibilityPropertyMismatch.selector, id, id2));
        pools.purchase{value: 1 ether}(id2, 0, auth);
    }

    function test_RevertWhen_AuthorizedAmountExceeded() public {
        uint256 id = _createOpen(0);
        _enableEligibility();
        bytes memory auth = _auth(alice, id, 1 ether, 1, block.timestamp + 300);
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(HabibiPropertyPools.EligibilityAmountExceeded.selector, 1 ether));
        pools.purchase{value: 2 ether}(id, 0, auth);
    }

    function test_RevertWhen_SignatureFromWrongSigner() public {
        uint256 id = _createOpen(0);
        _enableEligibility();
        // sign with a different key
        uint256 wrongKey = 0xBAD;
        HabibiPropertyPools.EligibilityAuthorization memory a = HabibiPropertyPools.EligibilityAuthorization({
            wallet: alice,
            propertyId: id,
            maxContributionWei: 5 ether,
            eligibilityClass: keccak256("UAE_RETAIL"),
            nonce: 1,
            expiry: block.timestamp + 300
        });
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(wrongKey, keccak256("junk"));
        bytes memory bad = abi.encode(a, abi.encodePacked(r, s, v));
        vm.prank(alice);
        vm.expectRevert();
        pools.purchase{value: 1 ether}(id, 0, bad);
    }

    // ------------------------------------------------------------------
    // Transfers
    // ------------------------------------------------------------------

    function test_TransfersBlockedByDefault() public {
        uint256 id = _createOpen(0);
        vm.prank(alice);
        pools.purchase{value: 1 ether}(id, 0, "");
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(HabibiPropertyPools.TransfersDisabled.selector, id));
        pools.safeTransferFrom(alice, bob, id, 10, "");
    }

    function test_TransfersWorkWhenEnabled() public {
        uint256 id = _createOpen(0);
        vm.prank(alice);
        pools.purchase{value: 1 ether}(id, 0, "");
        vm.prank(admin);
        pools.setTransfersEnabled(id, true);
        vm.prank(alice);
        pools.safeTransferFrom(alice, bob, id, 10, "");
        assertEq(pools.balanceOf(bob, id), 10);
    }

    // ------------------------------------------------------------------
    // Cancellation & refunds (Model A)
    // ------------------------------------------------------------------

    function test_RefundFlow() public {
        uint256 id = _createOpen(0);
        vm.prank(alice);
        pools.purchase{value: 2 ether}(id, 0, "");

        vm.startPrank(admin);
        pools.cancelProperty(id);
        pools.enableRefunds(id);
        vm.stopPrank();

        // Refund pool must be funded (treasury operation) before claims work
        vm.prank(alice);
        vm.expectRevert();
        pools.claimRefund(id);

        vm.deal(treasury, 5 ether);
        vm.prank(treasury);
        pools.fundRefunds{value: 2 ether}(id);

        uint256 before = alice.balance;
        vm.prank(alice);
        pools.claimRefund(id);
        assertEq(alice.balance, before + 2 ether);
        assertEq(pools.balanceOf(alice, id), 0, "units burned");
        assertEq(pools.refundClaimedWei(id, alice), 2 ether);

        // Cannot double-claim
        vm.prank(alice);
        vm.expectRevert();
        pools.claimRefund(id);
    }

    function test_RevertWhen_RefundsWithoutCancellation() public {
        uint256 id = _createOpen(0);
        vm.prank(admin);
        vm.expectRevert();
        pools.enableRefunds(id);
    }

    // ------------------------------------------------------------------
    // Roles
    // ------------------------------------------------------------------

    function test_RoleTransfer() public {
        address multisig = makeAddr("multisig");
        vm.startPrank(admin);
        pools.grantRole(pools.DEFAULT_ADMIN_ROLE(), multisig);
        pools.grantRole(pools.PROPERTY_MANAGER_ROLE(), multisig);
        pools.renounceRole(pools.PROPERTY_MANAGER_ROLE(), admin);
        pools.renounceRole(pools.DEFAULT_ADMIN_ROLE(), admin);
        vm.stopPrank();

        vm.prank(admin);
        vm.expectRevert();
        pools.createProperty(TARGET, MIN, 0, UNIT, treasury, "", bytes32(0));

        vm.prank(multisig);
        pools.createProperty(TARGET, MIN, 0, UNIT, treasury, "", bytes32(0));
    }

    // ------------------------------------------------------------------
    // Fuzz
    // ------------------------------------------------------------------

    function testFuzz_PurchaseNeverExceedsTarget(uint96 a, uint96 b, uint96 c) public {
        uint256 id = _createOpen(0);
        address[3] memory buyers = [alice, bob, mallory];
        uint96[3] memory amounts = [a, b, c];

        for (uint256 i = 0; i < 3; i++) {
            uint256 amt = (uint256(amounts[i]) / UNIT) * UNIT; // align to unit
            if (amt < MIN) continue;
            // Read state BEFORE pranking (a view call would consume the prank).
            uint256 remaining = pools.remainingCapacityWei(id);
            bool isOpen = pools.getProperty(id).status == HabibiPropertyPools.Status.Open;
            vm.deal(buyers[i], amt);
            vm.prank(buyers[i]);
            if (amt > remaining || !isOpen) {
                vm.expectRevert();
                pools.purchase{value: amt}(id, 0, "");
            } else {
                pools.purchase{value: amt}(id, 0, "");
            }
        }

        HabibiPropertyPools.Property memory p = pools.getProperty(id);
        assertLe(p.totalContributedWei, TARGET, "invariant: never overfunded");
        assertEq(
            uint256(p.totalContributedWei), pools.unitsIssued(id) * UNIT, "invariant: units * weiPerUnit == contributed"
        );
        assertEq(treasury.balance, uint256(p.totalContributedWei), "invariant: all ETH forwarded");
    }

    function testFuzz_UnitsMatchContribution(uint256 amount) public {
        uint256 id = _createOpen(0);
        amount = bound(amount, MIN, TARGET);
        amount = (amount / UNIT) * UNIT;
        if (amount < MIN) amount = MIN;
        vm.deal(alice, amount);
        vm.prank(alice);
        pools.purchase{value: amount}(id, 0, "");
        assertEq(pools.balanceOf(alice, id), amount / UNIT);
    }

    function testFuzz_FundedBpsNeverExceeds10000(uint256 amount) public {
        uint256 id = _createOpen(0);
        amount = bound(amount, MIN, TARGET);
        amount = (amount / UNIT) * UNIT;
        if (amount < MIN) amount = MIN;
        vm.deal(alice, amount);
        vm.prank(alice);
        pools.purchase{value: amount}(id, 0, "");
        assertLe(pools.fundedBps(id), 10_000);
    }
}
