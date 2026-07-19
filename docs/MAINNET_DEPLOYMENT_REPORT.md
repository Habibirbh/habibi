# Habibi — Mainnet Deployment Report

**Status:** ✅ Protocol deployed and verified on Robinhood Chain mainnet, in
**preview mode** — the application reads live mainnet state, and public
contributions are **closed at the contract level** (no campaign exists).

## Deployment
| Field | Value |
|---|---|
| Network / Chain ID | Robinhood Chain / **4663** |
| Contract | `HabibiCampaigns` |
| Address | [`0x10BacAB80c7568D37EFa42aC552D7CED4dfF7161`](https://robinhoodchain.blockscout.com/address/0x10BacAB80c7568D37EFa42aC552D7CED4dfF7161) |
| Deploy block | 14,215,391 |
| Blockscout verification | ✅ verified (source published) |
| Compiler | solc 0.8.24, optimizer on / 200 runs, EVM cancun |
| Constructor arg | `0x0F587C8CB459985f308B9B43200367cdF19e19Eb` (deployer; control handed off in-broadcast) |

## Roles (verified live on chain)
| Role | Address | Status |
|---|---|---|
| DEFAULT_ADMIN + all 4 roles | `0x92dd597c577490425A01216c2b6980c21e31cb61` (admin multisig) | ✅ granted |
| Deployer | `0x0F587C8CB459985f308B9B43200367cdF19e19Eb` | ✅ fully revoked |
| Eligibility signer | `0xc8151bFc36aD674D5AE373721185c6Cbb884eF2C` | ✅ set |

No single hot key retains control after deployment.

## Contribution safety (verified)
- `getCampaign(1)` reverts `CampaignNotFound(1)` — no campaign exists.
- `contribute(id, …)` reverts for every id (requires state `FundingOpen`).
- Opening a campaign requires an explicit admin-multisig transaction that supplies
  the full activation field set — see `CAMPAIGN_ACTIVATION_CHECKLIST.md`.
- There is no frontend/env/URL/localStorage switch that can enable contributions.

## Frontend wiring
- `scripts/sync-abi.mjs` recorded `habibiCampaignsDeployments[4663]` (address + deploy block).
- Production reads `NEXT_PUBLIC_CAMPAIGNS_CONTRACT_ADDRESS`.
- `check-env` now requires the campaign contract address and rejects the public
  fallback RPC and anvil addresses; the compliance API is enforced at runtime
  (campaign activation), not at build.

## Remaining for the public frontend (preview) to go up on your domain
1. Dedicated RPC endpoint for 4663 → `NEXT_PUBLIC_ROBINHOOD_RPC_URL` (the public
   fallback is rejected).
2. WalletConnect project id → `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`.
3. `NEXT_PUBLIC_CAMPAIGNS_CONTRACT_ADDRESS=0x10BacAB80c7568D37EFa42aC552D7CED4dfF7161`
4. `NEXT_PUBLIC_SITE_URL=<your domain>`, `NEXT_PUBLIC_APP_ENV=production`, `CHAIN_ID=4663`.

## Not done in this environment (must be completed by the operator)
- **Slither** static analysis (not installed here) — run and review before opening a campaign.
- Independent security **audit** of `HabibiCampaigns`.
