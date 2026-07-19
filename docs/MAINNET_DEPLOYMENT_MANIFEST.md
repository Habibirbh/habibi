# Habibi — Robinhood Chain Mainnet Deployment Manifest

**Posture:** Deploy protocol + application to mainnet, **campaigns closed** (no public
contributions). Generated pre-broadcast for review. The broadcast is run by the
operator in their own terminal with their own key — not automated.

## Network
| Field | Value |
|---|---|
| Network | Robinhood Chain |
| Chain ID | **4663** (verified live) |
| RPC (read) | https://rpc.mainnet.chain.robinhood.com *(public fallback — provision a dedicated endpoint for the frontend build)* |
| Explorer | https://robinhoodchain.blockscout.com |
| Current block (at manifest time) | 14,197,927 |
| Gas price | ~0.0556 gwei |

## Roles (three distinct keys — verified distinct, both non-deployer are EOAs)
| Role | Address | After deploy |
|---|---|---|
| Deployer | `0x0F587C8CB459985f308B9B43200367cdF19e19Eb` | **all roles revoked** |
| Admin (governance) | `0x92dd597c577490425A01216c2b6980c21e31cb61` | holds DEFAULT_ADMIN + all 4 roles |
| Compliance signer | `0xc8151bFc36aD674D5AE373721185c6Cbb884eF2C` | set as EIP-712 eligibility signer |

Deployer balance: **0.0262 ETH** (ample; see cost below).

## Contract
| Field | Value |
|---|---|
| Contract | `HabibiCampaigns` (single protocol contract: registry + per-campaign escrow + ERC-1155 participation units + EIP-712 eligibility + roles + pause + refunds + acquisition finalization) |
| Constructor arg | `admin = 0x0F58…19Eb` (deployer; control is handed to the multisig in the same broadcast) |
| Creation bytecode | 23,164 bytes |
| Deployed runtime | 21,603 bytes (under the 24,576 EIP-170 limit) |
| Compiler | solc 0.8.24, optimizer **on / 200 runs**, EVM **cancun**, no via-IR |
| EIP-712 domain | name `HabibiCampaigns`, version `1` |

## Gas / cost
| Field | Value |
|---|---|
| Creation gas (estimated live) | 4,957,853 |
| + role handoff (5 grants + 5 revokes + setEligibilitySigner) | ~0.5M gas |
| Total (approx) | ~5.5M gas |
| Estimated total cost | ~0.0003 ETH (≈ 1% of the deployer balance) |

## Broadcast transactions (in one `forge script` run, all signed by the deployer)
1. `CREATE HabibiCampaigns(0x0F58…19Eb)`
2. `setEligibilitySigner(0xc815…eF2C)`
3–7. `grantRole(<DEFAULT_ADMIN, CAMPAIGN_MANAGER, PAUSER, ELIGIBILITY_MANAGER, ACQUISITION_AUTHORIZER>, 0x92dd…cb61)`
8–12. `revokeRole(<CAMPAIGN_MANAGER, PAUSER, ELIGIBILITY_MANAGER, ACQUISITION_AUTHORIZER, DEFAULT_ADMIN>, 0x0F58…19Eb)` (DEFAULT_ADMIN last)

## Initial state (confirms contributions are closed)
- **No campaigns created** → no campaign can be in `FundingOpen`.
- `contribute()` reverts with `NotFundingOpen` for any id.
- Opening a campaign is a separate, explicit admin transaction gated by the full activation field set.

## Test / validation status (run locally at manifest time)
| Check | Result |
|---|---|
| Solidity unit + fuzz + invariant | ✅ 56/56 |
| `forge fmt --check` | ✅ |
| `forge build` | ✅ |
| Mainnet role-handoff simulation (local 4663) | ✅ multisig holds control, deployer revoked |
| tsc / ESLint / vitest (8) / Next build (16 routes) | ✅ |
| **Slither** | ❌ not run — not installed in the build environment; run before mainnet |
| On-chain gas/balance/estimate | ✅ read live from RPC (above) |

## Explicit confirmation required
Deploying is irreversible and hands permanent control to `0x92dd…cb61`. Confirm:
- [ ] The admin address `0x92dd…cb61` is correct and you control it.
- [ ] Slither has been run and reviewed (or you accept deploying without it).
- [ ] You accept the public fallback RPC for the deploy (frontend needs a dedicated one).
