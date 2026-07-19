// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test} from "forge-std/Test.sol";
import {HabibiCampaigns} from "../src/HabibiCampaigns.sol";

/// @dev Random contribute/refund actions across two campaigns; the escrow
///      invariant must hold at all times.
contract CampaignHandler is Test {
    HabibiCampaigns public c;
    uint256[2] public ids;
    address[4] public actors;
    uint128 constant UNIT = 0.05 ether;

    constructor(HabibiCampaigns _c, uint256[2] memory _ids) {
        c = _c;
        ids = _ids;
        actors = [makeAddr("h1"), makeAddr("h2"), makeAddr("h3"), makeAddr("h4")];
    }

    function contribute(uint256 actorSeed, uint256 poolSeed, uint96 raw) external {
        address a = actors[actorSeed % actors.length];
        uint256 id = ids[poolSeed % ids.length];
        HabibiCampaigns.Campaign memory cam = c.getCampaign(id);
        if (cam.state != HabibiCampaigns.State.FundingOpen) return;
        uint256 amt = (uint256(raw) / cam.weiPerUnit) * cam.weiPerUnit;
        if (amt < cam.minContribution) return;
        uint256 remaining = uint256(cam.fundingTarget) - cam.totalCommitted;
        if (amt > remaining) amt = (remaining / cam.weiPerUnit) * cam.weiPerUnit;
        if (amt < cam.minContribution) return;
        vm.deal(a, amt);
        vm.prank(a);
        c.contribute{value: amt}(id, 0, "");
    }
}

contract CampaignInvariantsTest is Test {
    HabibiCampaigns c;
    CampaignHandler handler;
    address admin = makeAddr("admin");
    uint256[2] ids;

    function setUp() public {
        c = new HabibiCampaigns(admin);
        vm.startPrank(admin);
        ids[0] = c.createCampaign(
            20 ether,
            5 ether,
            0.05 ether,
            0,
            0.05 ether,
            0,
            address(0),
            HabibiCampaigns.ExcessPolicy.ProportionalRefund,
            "",
            keccak256("t1")
        );
        ids[1] = c.createCampaign(
            8 ether,
            2 ether,
            0.05 ether,
            3 ether,
            0.05 ether,
            0,
            address(0),
            HabibiCampaigns.ExcessPolicy.ProportionalRefund,
            "",
            keccak256("t2")
        );
        for (uint256 i = 0; i < 2; i++) {
            c.scheduleCampaign(ids[i], uint64(block.timestamp), uint64(block.timestamp + 30 days));
            c.openCampaign(ids[i]);
        }
        vm.stopPrank();
        handler = new CampaignHandler(c, ids);
        targetContract(address(handler));
    }

    /// Invariant 1/15: contract ETH balance == sum(committed - released - refunded).
    function invariant_EscrowMatchesAccounting() public view {
        uint256 expected;
        for (uint256 i = 0; i < 2; i++) {
            HabibiCampaigns.Campaign memory cam = c.getCampaign(ids[i]);
            expected += uint256(cam.totalCommitted) - cam.releasedAmount - cam.totalRefunded;
        }
        assertEq(address(c).balance, expected);
    }

    /// Invariant 2/14: never over target / over 100%.
    function invariant_NeverOverfunded() public view {
        for (uint256 i = 0; i < 2; i++) {
            HabibiCampaigns.Campaign memory cam = c.getCampaign(ids[i]);
            assertLe(uint256(cam.totalCommitted), uint256(cam.fundingTarget));
            assertLe(c.fundedBps(ids[i]), 10_000);
        }
    }

    /// Invariant 8: no participation units exist while still fundraising.
    function invariant_NoUnitsDuringFunding() public view {
        for (uint256 i = 0; i < 2; i++) {
            HabibiCampaigns.Campaign memory cam = c.getCampaign(ids[i]);
            if (uint8(cam.state) < uint8(HabibiCampaigns.State.Acquired)) {
                assertEq(c.unitsIssued(ids[i]), 0);
            }
        }
    }
}
