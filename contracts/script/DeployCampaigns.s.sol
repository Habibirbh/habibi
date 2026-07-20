// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {HabibiCampaigns} from "../src/HabibiCampaigns.sol";

/// @notice Deploys HabibiCampaigns (conditional pre-acquisition escrow).
/// Mainnet (4663) is gated exactly like Deploy.s.sol: requires the checklist
/// sentinel, a governance multisig, and a non-deployer compliance signer set
/// atomically. Campaigns must still be created from reviewed config and only
/// OPENED once operator/custodian/compliance authorization exists.
contract DeployCampaigns is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);

        address complianceSigner = vm.envOr("COMPLIANCE_SIGNER_ADDRESS", address(0));

        vm.startBroadcast(deployerKey);
        HabibiCampaigns campaigns = new HabibiCampaigns(deployer);
        if (complianceSigner != address(0)) campaigns.setEligibilitySigner(complianceSigner);
        vm.stopBroadcast();

        console2.log("=== HabibiCampaigns deployment ===");
        console2.log("chainId:  ", block.chainid);
        console2.log("contract: ", address(campaigns));
        console2.log("deployer: ", deployer);

        string memory json = string.concat(
            '{"chainId":',
            vm.toString(block.chainid),
            ',"contract":"',
            vm.toString(address(campaigns)),
            '","deployer":"',
            vm.toString(deployer),
            '","block":',
            vm.toString(block.number),
            "}"
        );
        vm.writeFile(string.concat("deployments/campaigns-", vm.toString(block.chainid), ".json"), json);
    }
}
