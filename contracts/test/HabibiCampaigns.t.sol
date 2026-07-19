// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test} from "forge-std/Test.sol";
import {HabibiCampaigns} from "../src/HabibiCampaigns.sol";

contract HabibiCampaignsTest is Test {
    HabibiCampaigns c;

    address admin = makeAddr("admin");
    address seller = makeAddr("seller");
    address alice = makeAddr("alice");
    address bob = makeAddr("bob");
    address carol = makeAddr("carol");
    address mallory = makeAddr("mallory");

    uint128 constant TARGET = 10 ether;
    uint128 constant THRESHOLD = 6 ether;
    uint128 constant MINC = 0.1 ether;
    uint128 constant UNIT = 0.1 ether;

    function setUp() public {
        c = new HabibiCampaigns(admin);
        vm.deal(alice, 100 ether);
        vm.deal(bob, 100 ether);
        vm.deal(carol, 100 ether);
        vm.deal(mallory, 100 ether);
    }

    function _open() internal returns (uint256 id) {
        vm.startPrank(admin);
        id = c.createCampaign(
            TARGET,
            THRESHOLD,
            MINC,
            0,
            UNIT,
            0,
            address(0),
            HabibiCampaigns.ExcessPolicy.ProportionalRefund,
            "ipfs://m",
            keccak256("terms")
        );
        c.scheduleCampaign(id, uint64(block.timestamp), uint64(block.timestamp + 7 days));
        c.openCampaign(id);
        vm.stopPrank();
    }

    function _authAndRelease(uint256 id, uint256 price) internal {
        HabibiCampaigns.AcquisitionAuthorization memory a = HabibiCampaigns.AcquisitionAuthorization({
            campaignId: id,
            finalAcquisitionPrice: price,
            approvedPaymentDestination: seller,
            acquisitionAgreementHash: keccak256("agreement"),
            SPVIdentifier: keccak256("spv"),
            closingDocumentHash: keccak256("closing"),
            authorizationExpiry: block.timestamp + 1 days,
            authorizationNonce: uint256(keccak256(abi.encode(id, price)))
        });
        vm.startPrank(admin);
        c.authorizeAcquisition(a, "");
        c.releaseAcquisitionFunds(id, keccak256("evidence"));
        vm.stopPrank();
    }

    // ---- contribution never = ownership; no token minted during funding ----
    function test_ContributionIsEscrowedNoTokenMinted() public {
        uint256 id = _open();
        vm.prank(alice);
        c.contribute{value: 2 ether}(id, 0, "");

        assertEq(c.contributedWei(id, alice), 2 ether);
        assertEq(c.balanceOf(alice, id), 0, "no participation token during funding");
        assertEq(address(c).balance, 2 ether, "funds held in escrow, not forwarded");
        assertEq(c.escrowBalance(id), 2 ether);
        assertEq(uint8(c.getCampaign(id).state), uint8(HabibiCampaigns.State.FundingOpen));
    }

    function test_TargetReachedTransitionsToFundingSuccessful() public {
        uint256 id = _open();
        vm.prank(alice);
        c.contribute{value: 10 ether}(id, 0, "");
        assertEq(uint8(c.getCampaign(id).state), uint8(HabibiCampaigns.State.FundingSuccessful));
        // no further contributions
        vm.prank(bob);
        vm.expectRevert();
        c.contribute{value: MINC}(id, 0, "");
    }

    function test_RevertWhen_Overfunding() public {
        uint256 id = _open();
        vm.prank(alice);
        c.contribute{value: 9 ether}(id, 0, "");
        vm.prank(bob);
        vm.expectRevert(abi.encodeWithSelector(HabibiCampaigns.ExceedsCapacity.selector, 1 ether));
        c.contribute{value: 2 ether}(id, 0, "");
    }

    // ---- failed funding -> refunds ----
    function test_FailedFundingEnablesRefunds() public {
        uint256 id = _open();
        vm.prank(alice);
        c.contribute{value: 3 ether}(id, 0, ""); // below 6 ETH threshold
        vm.warp(block.timestamp + 8 days);
        vm.prank(admin);
        c.closeFunding(id);
        assertEq(uint8(c.getCampaign(id).state), uint8(HabibiCampaigns.State.Refunding));

        uint256 before = alice.balance;
        vm.prank(alice);
        c.claimRefund(id);
        assertEq(alice.balance, before + 3 ether);
        assertEq(address(c).balance, 0);
        // no double refund
        vm.prank(alice);
        vm.expectRevert(HabibiCampaigns.NothingToRefund.selector);
        c.claimRefund(id);
    }

    function test_CancelThenRefund() public {
        uint256 id = _open();
        vm.prank(alice);
        c.contribute{value: 2 ether}(id, 0, "");
        vm.prank(bob);
        c.contribute{value: 1 ether}(id, 0, "");

        vm.startPrank(admin);
        c.cancelCampaign(id, keccak256("seller withdrew"));
        c.enableRefunds(id);
        vm.stopPrank();

        vm.prank(alice);
        c.claimRefund(id);
        vm.prank(bob);
        c.claimRefund(id);
        assertEq(address(c).balance, 0);
    }

    function test_RevertWhen_AdminWithdrawAfterRefunds() public {
        uint256 id = _open();
        vm.prank(alice);
        c.contribute{value: 2 ether}(id, 0, "");
        vm.startPrank(admin);
        c.cancelCampaign(id, keccak256("x"));
        c.enableRefunds(id);
        vm.stopPrank();
        // There is no admin withdraw function at all; escrow can only leave via
        // claimRefund (to the contributor) — assert the balance is intact.
        assertEq(address(c).balance, 2 ether);
        assertEq(c.refundableAmount(id, alice), 2 ether);
    }

    // ---- acquisition: release gated, units only after close ----
    function test_RevertWhen_ReleaseBeforeAuthorization() public {
        uint256 id = _open();
        vm.prank(alice);
        c.contribute{value: 10 ether}(id, 0, "");
        vm.prank(admin);
        vm.expectRevert();
        c.releaseAcquisitionFunds(id, keccak256("e"));
    }

    function test_RevertWhen_UnauthorizedAuthorizes() public {
        uint256 id = _open();
        vm.prank(alice);
        c.contribute{value: 10 ether}(id, 0, "");
        HabibiCampaigns.AcquisitionAuthorization memory a;
        a.campaignId = id;
        a.finalAcquisitionPrice = 10 ether;
        a.approvedPaymentDestination = seller;
        a.acquisitionAgreementHash = keccak256("a");
        a.closingDocumentHash = keccak256("c");
        a.authorizationExpiry = block.timestamp + 1 days;
        a.authorizationNonce = 1;
        vm.prank(mallory);
        vm.expectRevert();
        c.authorizeAcquisition(a, "");
    }

    function test_RevertWhen_ClaimUnitsBeforeAcquisition() public {
        uint256 id = _open();
        vm.prank(alice);
        c.contribute{value: 10 ether}(id, 0, "");
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(HabibiCampaigns.NotAcquired.selector, id));
        c.claimUnitsAndExcess(id);
    }

    function test_FullAcquisitionAndUnitClaim() public {
        uint256 id = _open();
        vm.prank(alice);
        c.contribute{value: 6 ether}(id, 0, "");
        vm.prank(bob);
        c.contribute{value: 4 ether}(id, 0, ""); // reaches 10 -> FundingSuccessful

        uint256 sellerBefore = seller.balance;
        _authAndRelease(id, 10 ether);
        assertEq(seller.balance, sellerBefore + 10 ether, "acquisition funds released to seller");
        assertEq(uint8(c.getCampaign(id).state), uint8(HabibiCampaigns.State.Acquired));

        vm.prank(admin);
        c.finalizeInterests(id);

        vm.prank(alice);
        c.claimUnitsAndExcess(id);
        vm.prank(bob);
        c.claimUnitsAndExcess(id);
        assertEq(c.balanceOf(alice, id), 60); // 6 ETH / 0.1
        assertEq(c.balanceOf(bob, id), 40);
        assertEq(address(c).balance, 0, "nothing left after full acquisition + claims");

        // units are transfer-restricted
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(HabibiCampaigns.TransfersDisabled.selector, id));
        c.safeTransferFrom(alice, bob, id, 1, "");
    }

    function test_PriceReductionRefundsExcessProRata() public {
        uint256 id = _open();
        vm.prank(alice);
        c.contribute{value: 6 ether}(id, 0, "");
        vm.prank(bob);
        c.contribute{value: 4 ether}(id, 0, "");

        // property closes at 8 ETH instead of 10 -> 2 ETH excess, pro-rata
        _authAndRelease(id, 8 ether);

        uint256 aBefore = alice.balance;
        uint256 bBefore = bob.balance;
        vm.prank(alice);
        c.claimUnitsAndExcess(id);
        vm.prank(bob);
        c.claimUnitsAndExcess(id);

        // effective invested = contributed * 8/10; alice 4.8, bob 3.2
        // units: alice 48, bob 32; excess refund: alice 1.2, bob 0.8
        assertEq(c.balanceOf(alice, id), 48);
        assertEq(c.balanceOf(bob, id), 32);
        assertEq(alice.balance, aBefore + 1.2 ether);
        assertEq(bob.balance, bBefore + 0.8 ether);
        assertEq(address(c).balance, 0, "excess fully refunded, acquisition released");
    }

    function test_RevertWhen_DoubleClaimUnits() public {
        uint256 id = _open();
        vm.prank(alice);
        c.contribute{value: 10 ether}(id, 0, "");
        _authAndRelease(id, 10 ether);
        vm.prank(alice);
        c.claimUnitsAndExcess(id);
        vm.prank(alice);
        vm.expectRevert(HabibiCampaigns.AlreadyClaimed.selector);
        c.claimUnitsAndExcess(id);
    }

    function test_RevertWhen_CancelAfterAcquired() public {
        uint256 id = _open();
        vm.prank(alice);
        c.contribute{value: 10 ether}(id, 0, "");
        _authAndRelease(id, 10 ether);
        vm.prank(admin);
        vm.expectRevert();
        c.cancelCampaign(id, keccak256("x"));
    }

    function test_ConfigValidation() public {
        vm.startPrank(admin);
        vm.expectRevert(abi.encodeWithSelector(HabibiCampaigns.InvalidConfiguration.selector, "fundingTarget"));
        c.createCampaign(
            0,
            THRESHOLD,
            MINC,
            0,
            UNIT,
            0,
            address(0),
            HabibiCampaigns.ExcessPolicy.ProportionalRefund,
            "",
            keccak256("t")
        );
        vm.expectRevert(abi.encodeWithSelector(HabibiCampaigns.InvalidConfiguration.selector, "termsHash"));
        c.createCampaign(
            TARGET,
            THRESHOLD,
            MINC,
            0,
            UNIT,
            0,
            address(0),
            HabibiCampaigns.ExcessPolicy.ProportionalRefund,
            "",
            bytes32(0)
        );
        vm.stopPrank();
    }

    function testFuzz_EscrowMatchesAccounting(uint96 a1, uint96 a2, uint96 a3) public {
        uint256 id = _open();
        address[3] memory who = [alice, bob, carol];
        uint96[3] memory amts = [a1, a2, a3];
        for (uint256 i = 0; i < 3; i++) {
            uint256 amt = (uint256(amts[i]) / UNIT) * UNIT;
            if (amt < MINC) continue;
            uint256 remaining = c.remainingCapacityWei(id);
            if (amt > remaining) amt = (remaining / UNIT) * UNIT;
            if (amt < MINC || c.getCampaign(id).state != HabibiCampaigns.State.FundingOpen) continue;
            vm.prank(who[i]);
            c.contribute{value: amt}(id, 0, "");
        }
        // escrow invariant: contract balance == committed - released - refunded
        HabibiCampaigns.Campaign memory cam = c.getCampaign(id);
        assertEq(address(c).balance, uint256(cam.totalCommitted) - cam.releasedAmount - cam.totalRefunded);
        assertLe(cam.totalCommitted, TARGET);
    }
}
