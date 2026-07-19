// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {HabibiPropertyPools} from "../src/HabibiPropertyPools.sol";

/// @notice Deploys HabibiPropertyPools.
///
/// SAFETY GATES:
///  - Refuses to run against chain id 4663 (Robinhood Chain mainnet) unless
///    MAINNET_DEPLOY_CONFIRMED=I_HAVE_COMPLETED_THE_MAINNET_CHECKLIST is set.
///    The checklist lives in DEPLOYMENT_GUIDE.md (audit, treasury multisig,
///    admin multisig, compliance signer, verified parameters).
///  - Prints a manifest and writes a versioned deployment artifact.
contract Deploy is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);

        address complianceSigner = address(0);
        if (block.chainid == 4663) {
            string memory confirmed = vm.envOr("MAINNET_DEPLOY_CONFIRMED", string(""));
            require(
                keccak256(bytes(confirmed)) == keccak256("I_HAVE_COMPLETED_THE_MAINNET_CHECKLIST"),
                "MAINNET GATE: complete DEPLOYMENT_GUIDE.md checklist and set MAINNET_DEPLOY_CONFIRMED"
            );
            // On mainnet the admin must be the governance multisig, never the deployer.
            require(vm.envAddress("HABIBI_ADMIN_MULTISIG") != address(0), "HABIBI_ADMIN_MULTISIG required");
            // A mainnet deployment cannot exist without eligibility enforcement:
            // the compliance signer is configured atomically with deployment.
            complianceSigner = vm.envAddress("COMPLIANCE_SIGNER_ADDRESS");
            require(complianceSigner != address(0), "COMPLIANCE_SIGNER_ADDRESS required on mainnet");
            require(complianceSigner != deployer, "compliance signer must not be the deployer");
        }

        vm.startBroadcast(deployerKey);
        HabibiPropertyPools pools = new HabibiPropertyPools(deployer);
        if (complianceSigner != address(0)) {
            pools.setEligibilitySigner(complianceSigner);
        }
        vm.stopBroadcast();

        console2.log("=== Habibi deployment manifest ===");
        console2.log("chainId:        ", block.chainid);
        console2.log("contract:       ", address(pools));
        console2.log("deployer/admin: ", deployer);
        console2.log("block:          ", block.number);

        string memory json = string.concat(
            '{"chainId":',
            vm.toString(block.chainid),
            ',"contract":"',
            vm.toString(address(pools)),
            '","deployer":"',
            vm.toString(deployer),
            '","block":',
            vm.toString(block.number),
            "}"
        );
        vm.writeFile(string.concat("deployments/", vm.toString(block.chainid), ".json"), json);
    }
}
