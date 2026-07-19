// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {HabibiPropertyPools} from "../src/HabibiPropertyPools.sol";

/// @notice Creates properties from a JSON configuration file.
///
/// Usage:
///   PROPERTIES_CONFIG_PATH=config/properties.json \
///   POOLS_CONTRACT_ADDRESS=0x... DEPLOYER_PRIVATE_KEY=... \
///   forge script script/CreateProperties.s.sol --rpc-url <rpc> --broadcast
///
/// Config schema (see config/properties.example.json):
///   { "count": N, "properties": [ { "slug", "fundingTargetWei",
///     "minContributionWei", "maxPerWalletWei", "weiPerUnit", "treasury",
///     "metadataURI", "termsHash", "open" } ] }
///
/// VALIDATION (fail-closed):
///  - every numeric field nonzero where required, target unit-aligned
///  - treasury nonzero
///  - metadataURI must be content-addressed or HTTPS (rejects local fixture
///    schemes and placeholder markers)
///  - termsHash nonzero
///  - on chain 4663: the mainnet sentinel is required AND the example config
///    is rejected — real, reviewed property parameters only.
contract CreateProperties is Script {
    function run() external {
        uint256 key = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address poolsAddr = vm.envAddress("POOLS_CONTRACT_ADDRESS");
        string memory path = vm.envString("PROPERTIES_CONFIG_PATH");
        HabibiPropertyPools pools = HabibiPropertyPools(poolsAddr);

        if (block.chainid == 4663) {
            string memory confirmed = vm.envOr("MAINNET_DEPLOY_CONFIRMED", string(""));
            require(
                keccak256(bytes(confirmed)) == keccak256("I_HAVE_COMPLETED_THE_MAINNET_CHECKLIST"),
                "MAINNET GATE: see DEPLOYMENT_GUIDE.md"
            );
            require(!_contains(path, "example"), "MAINNET GATE: example config not permitted on mainnet");
        }

        string memory json = vm.readFile(path);
        uint256 count = vm.parseJsonUint(json, ".count");
        require(count > 0 && count <= 50, "config: invalid count");

        vm.startBroadcast(key);
        for (uint256 i = 0; i < count; i++) {
            string memory p = string.concat(".properties[", vm.toString(i), "]");
            string memory slug = vm.parseJsonString(json, string.concat(p, ".slug"));
            uint256 target = vm.parseJsonUint(json, string.concat(p, ".fundingTargetWei"));
            uint256 minC = vm.parseJsonUint(json, string.concat(p, ".minContributionWei"));
            uint256 maxW = vm.parseJsonUint(json, string.concat(p, ".maxPerWalletWei"));
            uint256 unit = vm.parseJsonUint(json, string.concat(p, ".weiPerUnit"));
            address treasury = vm.parseJsonAddress(json, string.concat(p, ".treasury"));
            string memory uri = vm.parseJsonString(json, string.concat(p, ".metadataURI"));
            bytes32 termsHash = vm.parseJsonBytes32(json, string.concat(p, ".termsHash"));
            bool openNow = vm.parseJsonBool(json, string.concat(p, ".open"));

            // fail-closed validation
            require(treasury != address(0), _err(slug, "treasury is zero"));
            require(target > 0 && target <= type(uint128).max, _err(slug, "target"));
            require(unit > 0 && target % unit == 0, _err(slug, "unit alignment"));
            require(minC > 0 && minC % unit == 0, _err(slug, "min contribution"));
            require(termsHash != bytes32(0), _err(slug, "termsHash is zero"));
            require(
                _startsWith(uri, "ipfs://") || _startsWith(uri, "ar://") || _startsWith(uri, "https://"),
                _err(slug, "metadataURI must be ipfs://, ar:// or https://")
            );
            require(
                !_contains(uri, "REPLACE") && !_contains(uri, "PLACEHOLDER") && !_contains(uri, "example"),
                _err(slug, "metadataURI looks like a placeholder")
            );

            uint256 id = pools.createProperty(
                uint128(target), uint128(minC), uint128(maxW), uint128(unit), treasury, uri, termsHash
            );
            if (openNow) pools.openProperty(id);
            console2.log(string.concat("created ", slug, " as propertyId"), id);
        }
        vm.stopBroadcast();
    }

    function _startsWith(string memory s, string memory prefix) internal pure returns (bool) {
        bytes memory sb = bytes(s);
        bytes memory pb = bytes(prefix);
        if (sb.length < pb.length) return false;
        for (uint256 i = 0; i < pb.length; i++) {
            if (sb[i] != pb[i]) return false;
        }
        return true;
    }

    function _contains(string memory s, string memory needle) internal pure returns (bool) {
        bytes memory sb = bytes(s);
        bytes memory nb = bytes(needle);
        if (nb.length == 0 || sb.length < nb.length) return false;
        for (uint256 i = 0; i <= sb.length - nb.length; i++) {
            bool ok = true;
            for (uint256 j = 0; j < nb.length; j++) {
                if (sb[i + j] != nb[j]) {
                    ok = false;
                    break;
                }
            }
            if (ok) return true;
        }
        return false;
    }

    function _err(string memory slug, string memory msg_) internal pure returns (string memory) {
        return string.concat("config[", slug, "]: ", msg_);
    }
}
