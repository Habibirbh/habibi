# Security Model

## Contract

- Checks-effects-interactions ordering; `nonReentrant` on all ETH paths
- Custom errors; explicit events for every state change
- No tx.origin, no delegatecall, no arbitrary external calls, no owner
  withdrawal route (contract custodies nothing outside refund pools)
- Non-upgradeable (deliberate: no upgrade authority to compromise)
- OpenZeppelin v5 audited building blocks
- uint128 accounting bounded by validated targets; documented safe casts

## Roles

DEFAULT_ADMIN_ROLE, PROPERTY_MANAGER_ROLE, PAUSER_ROLE,
ELIGIBILITY_MANAGER_ROLE. The deployer must hand over to the governance
multisig via `script/TransferRoles.s.sol` and renounce (verified onchain by
the script). The frontend never treats any local flag as authorization.

## Eligibility

EIP-712 `EligibilityAuthorization` signed by the compliance backend:
wallet + propertyId + cumulative max + class + nonce + expiry. Replay-safe
(per-wallet nonces), expiring, amount-capped. `eligibilitySigner == address(0)`
(enforcement off) is permitted ONLY on local/test chains; production must set
a signer before opening pools, and the frontend independently hard-disables
mainnet purchases until the compliance API is configured.

## Keys

- Treasury key: never touches this codebase. Multisig/custody recommended.
- Deployer key: env-only (`DEPLOYER_PRIVATE_KEY`), CI secret, roles renounced
  after handover.
- No key material, seed phrases, or signed eligibility payloads in logs.

## Known gaps before mainnet

- No independent audit yet (mainnet gate).
- Slither/static analysis run required in CI (gate item).
- WalletConnect project id not configured.
- Compliance backend not integrated (purchases disabled in production).
