// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {HabibiPropertyPools} from "../src/HabibiPropertyPools.sol";

/// @notice Post-deployment governance handover: grants all roles to the
///         verified admin multisig, then revokes every role from the deployer.
///         Run only after HABIBI_ADMIN_MULTISIG has been explicitly supplied
///         and independently verified (see ADMIN_OPERATIONS.md).
contract TransferRoles is Script {
    function run() external {
        uint256 key = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(key);
        address multisig = vm.envAddress("HABIBI_ADMIN_MULTISIG");
        HabibiPropertyPools pools = HabibiPropertyPools(vm.envAddress("POOLS_CONTRACT_ADDRESS"));

        require(multisig != address(0) && multisig != deployer, "invalid multisig");

        vm.startBroadcast(key);
        pools.grantRole(pools.DEFAULT_ADMIN_ROLE(), multisig);
        pools.grantRole(pools.PROPERTY_MANAGER_ROLE(), multisig);
        pools.grantRole(pools.PAUSER_ROLE(), multisig);
        pools.grantRole(pools.ELIGIBILITY_MANAGER_ROLE(), multisig);

        pools.renounceRole(pools.PROPERTY_MANAGER_ROLE(), deployer);
        pools.renounceRole(pools.PAUSER_ROLE(), deployer);
        pools.renounceRole(pools.ELIGIBILITY_MANAGER_ROLE(), deployer);
        pools.renounceRole(pools.DEFAULT_ADMIN_ROLE(), deployer);
        vm.stopBroadcast();

        require(!pools.hasRole(pools.DEFAULT_ADMIN_ROLE(), deployer), "deployer still admin");
        require(pools.hasRole(pools.DEFAULT_ADMIN_ROLE(), multisig), "multisig not admin");
        console2.log("Roles transferred to multisig:", multisig);
    }
}
