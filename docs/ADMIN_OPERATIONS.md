# Admin Operations

All administration is onchain-role-gated; `/admin` merely submits simulated,
signed transactions from the connected wallet and shows nothing to
non-holders.

Operations: create (script/multisig), schedule, open, pause/unpause (per-pool
and global), close, cancel, metadata before open, transfer policy,
eligibility signer, refund enablement + funding.

## Role handover (mandatory before mainnet operation)

1. Verify `HABIBI_ADMIN_MULTISIG` out-of-band (two operators, checksummed).
2. `forge script script/TransferRoles.s.sol --rpc-url <rpc> --broadcast`
   — grants all four roles to the multisig, renounces all deployer roles,
   and asserts the result onchain.
3. Confirm on the explorer that the deployer holds no roles.

Never store an admin key on a server or in the frontend. Emergency stop:
`pause()` from any PAUSER_ROLE holder (see INCIDENT_RESPONSE.md).
