# Deployment Guide

## Local (working today)

```bash
anvil                                                   # chain 31337
cd contracts
export DEPLOYER_PRIVATE_KEY=<anvil dev key>
export HABIBI_TREASURY_ADDRESS=<anvil account>
forge script script/Deploy.s.sol --rpc-url http://127.0.0.1:8545 --broadcast
export POOLS_CONTRACT_ADDRESS=<printed address>
forge script script/CreateLocalProperties.s.sol --rpc-url http://127.0.0.1:8545 --broadcast
node ../scripts/sync-abi.mjs
```

## Robinhood Chain testnet

Same flow with the testnet RPC once its parameters are confirmed from
official Robinhood Chain documentation — do not guess chain ids or URLs.
`CreateLocalProperties` (test fixtures) refuses mainnet but may be used on a
testnet.

## Mainnet (4663) — GATED, DO NOT RUN

`Deploy.s.sol` refuses chain 4663 unless
`MAINNET_DEPLOY_CONFIRMED=I_HAVE_COMPLETED_THE_MAINNET_CHECKLIST` is set.
Setting that variable is a human act of sign-off on ALL of the following:

- [ ] Independent smart-contract audit completed (or explicit written
      authorization to proceed without one)
- [ ] Slither/static analysis clean; full test suite green
- [ ] Production RPC URL provisioned (not the public fallback)
- [ ] `HABIBI_TREASURY_ADDRESS` — verified, checksummed, multisig/custody
- [ ] `HABIBI_ADMIN_MULTISIG` — verified, checksummed
- [ ] `COMPLIANCE_SIGNER_ADDRESS` + live compliance API
- [ ] WalletConnect project id
- [ ] Final property parameters from real, documented property economics
      (never the test fixtures)
- [ ] Approved metadata URIs + legal terms hashes per property
- [ ] Deployer wallet funded and verified; deployment gas estimated
- [ ] Deployment simulated (`forge script` without `--broadcast`)
- [ ] Role transfer to multisig planned immediately post-deploy
      (`TransferRoles.s.sol`), then deployer roles verified renounced
- [ ] Contract verification on Blockscout planned
      (`forge verify-contract --verifier blockscout
       --verifier-url https://robinhoodchain.blockscout.com/api`)

Also note: real property listings, offering documents, and jurisdiction
approvals are prerequisites for OPENING pools to the public — a deployed
contract with no legal offering behind it must keep pools in Draft.

## Production property creation

Real pools are created from a reviewed JSON config, never hardcoded:

```bash
cp contracts/config/properties.example.json contracts/config/properties.json
# fill with real, legally reviewed values (real treasury, real metadata CIDs,
# real terms hashes) — the example file fails validation by design
PROPERTIES_CONFIG_PATH=config/properties.json \
POOLS_CONTRACT_ADDRESS=0x... DEPLOYER_PRIVATE_KEY=... \
forge script script/CreateProperties.s.sol --rpc-url <rpc> --broadcast
```

Validation is fail-closed: zero treasury, placeholder URIs, non-content-
addressed URIs, zero terms hashes, and unit-misaligned targets are rejected.
On chain 4663 the mainnet sentinel is additionally required and the example
config is refused.

## Environment validation

`npm run build` runs `scripts/check-env.mjs`: a production build refuses to
compile if any required public variable is missing, malformed, a placeholder,
or the public fallback RPC.

## Verification

`CHAIN_ID=<id> ./scripts/verify.sh` reads the deployment artifact and
publishes source, compiler settings (0.8.24, optimizer 10k runs, cancun),
constructor args, and ABI to Blockscout. If verification fails, the exact
error is surfaced — never label an unverified contract as verified.

## Artifacts

Every deployment writes `contracts/deployments/<chainId>.json`
(chain id, address, deployer, block). `scripts/sync-abi.mjs` propagates
these to the frontend; commit the artifacts.
