// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Script} from "forge-std/Script.sol";
import {HabibiPropertyPools} from "../src/HabibiPropertyPools.sol";

/// @notice LOCAL / TESTNET ONLY: creates the four preview pools with TEST
///         parameters so the frontend has live onchain state to integrate
///         against. Values are test fixtures, not real property economics.
///         Refuses to run on Robinhood Chain mainnet (4663) — mainnet property
///         parameters must come from verified real configuration.
contract CreateLocalProperties is Script {
    function run() external {
        require(block.chainid != 4663, "TEST FIXTURES: not for mainnet");

        uint256 key = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address poolsAddr = vm.envAddress("POOLS_CONTRACT_ADDRESS");
        address treasury = vm.envAddress("HABIBI_TREASURY_ADDRESS");
        HabibiPropertyPools pools = HabibiPropertyPools(poolsAddr);

        // unit = 0.01 ETH per participation unit for all test pools
        uint128 unit = 0.01 ether;

        vm.startBroadcast(key);
        // [target, minContribution, maxPerWallet(0=unlimited)]
        uint256 p1 = pools.createProperty(
            38 ether,
            0.01 ether,
            0,
            unit,
            treasury,
            "habibi://property/marina-residences",
            keccak256("TEST-TERMS-marina-v1")
        );
        uint256 p2 = pools.createProperty(
            62 ether, 0.01 ether, 0, unit, treasury, "habibi://property/yas-waterfront", keccak256("TEST-TERMS-yas-v1")
        );
        uint256 p3 = pools.createProperty(
            95 ether,
            0.01 ether,
            0,
            unit,
            treasury,
            "habibi://property/palm-garden-villa",
            keccak256("TEST-TERMS-palm-v1")
        );
        uint256 p4 = pools.createProperty(
            24 ether,
            0.01 ether,
            0,
            unit,
            treasury,
            "habibi://property/downtown-residence",
            keccak256("TEST-TERMS-downtown-v1")
        );
        pools.openProperty(p1);
        pools.openProperty(p2);
        pools.openProperty(p3);
        pools.openProperty(p4);
        vm.stopBroadcast();
    }
}
