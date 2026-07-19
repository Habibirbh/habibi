// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test} from "forge-std/Test.sol";
import {HabibiPropertyPools} from "../src/HabibiPropertyPools.sol";

/// @dev Randomized-actor handler: performs purchases of arbitrary sizes from a
///      set of actors against two pools, tracking a ghost sum of accepted ETH.
contract Handler is Test {
    HabibiPropertyPools public pools;
    address public treasury;
    uint256[2] public ids;
    address[4] public actors;

    uint256 public ghostAcceptedWei;

    constructor(HabibiPropertyPools _pools, address _treasury, uint256[2] memory _ids) {
        pools = _pools;
        treasury = _treasury;
        ids = _ids;
        actors = [makeAddr("a1"), makeAddr("a2"), makeAddr("a3"), makeAddr("a4")];
    }

    function purchase(uint256 actorSeed, uint256 poolSeed, uint96 rawAmount) external {
        address actor = actors[actorSeed % actors.length];
        uint256 id = ids[poolSeed % ids.length];

        HabibiPropertyPools.Property memory p = pools.getProperty(id);
        uint256 amount = (uint256(rawAmount) / p.weiPerUnit) * p.weiPerUnit;
        if (amount < p.minContributionWei) return;
        if (p.status != HabibiPropertyPools.Status.Open) return;
        uint256 remaining = uint256(p.fundingTargetWei) - uint256(p.totalContributedWei);
        if (amount > remaining) amount = (remaining / p.weiPerUnit) * p.weiPerUnit;
        if (amount == 0 || amount < p.minContributionWei) return;

        vm.deal(actor, amount);
        vm.prank(actor);
        pools.purchase{value: amount}(id, 0, "");
        ghostAcceptedWei += amount;
    }
}

contract InvariantsTest is Test {
    HabibiPropertyPools pools;
    Handler handler;
    address admin = makeAddr("admin");
    address treasury = makeAddr("treasury");
    uint256[2] ids;

    uint128 constant UNIT = 0.005 ether;

    function setUp() public {
        pools = new HabibiPropertyPools(admin);
        vm.startPrank(admin);
        ids[0] = pools.createProperty(20 ether, UNIT, 0, UNIT, treasury, "", bytes32(0));
        ids[1] = pools.createProperty(7.5 ether, UNIT, 3 ether, UNIT, treasury, "", bytes32(0));
        pools.openProperty(ids[0]);
        pools.openProperty(ids[1]);
        vm.stopPrank();

        handler = new Handler(pools, treasury, ids);
        targetContract(address(handler));
    }

    /// Invariant 1 + 10: no pool ever exceeds its target / 100%.
    function invariant_NeverOverfunded() public view {
        for (uint256 i = 0; i < 2; i++) {
            HabibiPropertyPools.Property memory p = pools.getProperty(ids[i]);
            assertLe(uint256(p.totalContributedWei), uint256(p.fundingTargetWei));
            assertLe(pools.fundedBps(ids[i]), 10_000);
        }
    }

    /// Invariant 2 + 3: units issued always equal contributed / weiPerUnit.
    function invariant_UnitAccountingConsistent() public view {
        for (uint256 i = 0; i < 2; i++) {
            HabibiPropertyPools.Property memory p = pools.getProperty(ids[i]);
            assertEq(pools.unitsIssued(ids[i]) * uint256(p.weiPerUnit), uint256(p.totalContributedWei));
        }
    }

    /// Invariant 5: every accepted wei was forwarded to the treasury; the
    /// contract itself custodies nothing outside refund pools.
    function invariant_TreasuryForwardingExact() public view {
        uint256 totalContributed;
        for (uint256 i = 0; i < 2; i++) {
            totalContributed += uint256(pools.getProperty(ids[i]).totalContributedWei);
        }
        assertEq(treasury.balance, totalContributed);
        assertEq(treasury.balance, handler.ghostAcceptedWei());
        assertEq(pools.totalForwardedWei(), totalContributed);
        assertEq(address(pools).balance, 0);
    }
}
