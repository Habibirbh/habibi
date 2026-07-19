# Habibi — Onchain Implementation

## Status

**Implemented and verified end-to-end on a local chain (anvil, 31337).
NOT deployed to Robinhood Chain mainnet (4663).** The mainnet gate in
`DEPLOYMENT_GUIDE.md` is intentionally unmet: no audit, no treasury multisig,
no admin multisig, no compliance signer, and no verified real property
parameters exist yet. Purchases are additionally hard-disabled in production
builds until the compliance API is configured.

## How it works

- **Wallet connection** — wagmi + viem. Injected (Robinhood Wallet, MetaMask,
  Rabby), Coinbase Wallet, and WalletConnect (when a project id is set). The
  connected wallet's chain id is the source of truth; purchases require chain
  4663 in production (31337 in development). Wrong-network users get a
  switch/add-network flow (`ConnectWalletModal`).
- **Purchases** — `HabibiPropertyPools.purchase(propertyId, minUnitsOut,
  eligibilityData)` is payable and atomic: validate → account → mint ERC-1155
  units → forward ETH to treasury → emit `PropertyPurchased`. Treasury
  transfer failure reverts everything. The frontend simulates the call and
  estimates gas before prompting a signature, and reports success only after
  the receipt confirms (`PurchaseModal`).
- **Pool progress** — `totalContributedWei * 10_000 / fundingTargetWei`,
  bigint arithmetic end-to-end, contract accounting only — never wallet
  balances.
- **Treasury** — `/treasury` shows contract-attributed inflows
  (`totalForwardedWei` + per-pool totals + verified events) separately from
  the live wallet balance (`eth_getBalance`), which can include unrelated
  funds.
- **Portfolio** — `/portfolio` reconstructs holdings entirely from
  `contributedWei`, `balanceOf`, and `PropertyPurchased` logs scanned from the
  recorded deployment block. No localStorage ownership. No fabricated
  valuations ("Current valuation unavailable").
- **Admin** — `/admin` checks `hasRole` onchain and submits simulated,
  role-gated transactions. The contract is the authority; no local admin flag,
  no server-held keys.

## Commands

```bash
# contracts
cd contracts
forge build && forge test               # 38 tests: unit, fuzz, invariant
anvil                                    # local chain
forge script script/Deploy.s.sol --rpc-url http://127.0.0.1:8545 --broadcast
forge script script/CreateLocalProperties.s.sol --rpc-url ... --broadcast
node ../scripts/sync-abi.mjs             # sync ABI + addresses to frontend

# app
npm run dev / build / lint
curl localhost:3000/api/health           # RPC + contract health
```

## Pausing the platform

`pause()` (global) or `setPurchasesPaused(id, true)` (per-pool), PAUSER_ROLE.
See `ADMIN_OPERATIONS.md` for role rotation and `INCIDENT_RESPONSE.md`.
