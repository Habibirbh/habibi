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

        address complianceSigner = address(0);
        if (block.chainid == 4663) {
            require(
                keccak256(bytes(vm.envOr("MAINNET_DEPLOY_CONFIRMED", string(""))))
                    == keccak256("I_HAVE_COMPLETED_THE_MAINNET_CHECKLIST"),
                "MAINNET GATE: complete DEPLOYMENT_GUIDE.md checklist"
            );
            require(vm.envAddress("HABIBI_ADMIN_MULTISIG") != address(0), "HABIBI_ADMIN_MULTISIG required");
            require(
                vm.envAddress("HABIBI_ADMIN_MULTISIG") != deployer,
                "HABIBI_ADMIN_MULTISIG must not be the deployer (handoff would be a no-op)"
            );
            complianceSigner = vm.envAddress("COMPLIANCE_SIGNER_ADDRESS");
            require(complianceSigner != address(0), "COMPLIANCE_SIGNER_ADDRESS required on mainnet");
            require(complianceSigner != deployer, "compliance signer must not be the deployer");
        }

        vm.startBroadcast(deployerKey);
        HabibiCampaigns campaigns = new HabibiCampaigns(deployer);
        if (complianceSigner != address(0)) campaigns.setEligibilitySigner(complianceSigner);

        // Mainnet: hand ALL authority to the governance multisig and drop the
        // deployer entirely, in the same broadcast. No single hot key retains
        // control after deployment (preview-mode / §8 role-handoff requirement).
        if (block.chainid == 4663) {
            address gov = vm.envAddress("HABIBI_ADMIN_MULTISIG");
            campaigns.grantRole(campaigns.DEFAULT_ADMIN_ROLE(), gov);
            campaigns.grantRole(campaigns.CAMPAIGN_MANAGER_ROLE(), gov);
            campaigns.grantRole(campaigns.PAUSER_ROLE(), gov);
            campaigns.grantRole(campaigns.ELIGIBILITY_MANAGER_ROLE(), gov);
            campaigns.grantRole(campaigns.ACQUISITION_AUTHORIZER_ROLE(), gov);

            campaigns.revokeRole(campaigns.CAMPAIGN_MANAGER_ROLE(), deployer);
            campaigns.revokeRole(campaigns.PAUSER_ROLE(), deployer);
            campaigns.revokeRole(campaigns.ELIGIBILITY_MANAGER_ROLE(), deployer);
            campaigns.revokeRole(campaigns.ACQUISITION_AUTHORIZER_ROLE(), deployer);
            // DEFAULT_ADMIN_ROLE last: once revoked the deployer can grant nothing further.
            campaigns.revokeRole(campaigns.DEFAULT_ADMIN_ROLE(), deployer);
        }
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
