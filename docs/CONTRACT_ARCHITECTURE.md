# Contract Architecture

Single non-upgradeable contract: `contracts/src/HabibiPropertyPools.sol`
(ERC1155 + AccessControl + Pausable + ReentrancyGuard + EIP712). A single
contract was chosen deliberately for a smaller, auditable attack surface.

## Model

- One ERC-1155 token id per property pool.
- Fixed `weiPerUnit` conversion, immutable once opened; contributions must be
  exact unit multiples (no rounding dust, no remainder retention).
- Max supply is implied deterministically: `fundingTargetWei / weiPerUnit`
  (creation requires unit-aligned targets).
- States: Draft → Scheduled → Open → Funded/Closed/Cancelled. Purchases only
  in Open, inside the time window, not paused.
- Wallet-to-wallet transfers are blocked by the `_update` hook until the
  per-pool transfer policy is enabled by governance (spec §12: sell/transfer
  is "coming soon", never unrestricted by default).
- All ETH amounts are wei; percentages are basis points.

## Units are not title

Units are contract-recorded fractional interests mapped to offchain legal
agreements via `metadataURI` + `termsHash`. The UI must never call them deeds.

## Refunds — Model A

Purchases forward ETH to the treasury immediately, so refunds are operational,
not automatic: cancel → `enableRefunds` → treasury `fundRefunds{value}` →
participant `claimRefund` (burns units, pays recorded contribution).

## Key invariants (enforced + tested)

1. `totalContributedWei <= fundingTargetWei` (never overfunded)
2. `unitsIssued * weiPerUnit == totalContributedWei`
3. Treasury receives exactly every accepted wei, same transaction
4. Failed treasury transfer reverts the entire purchase
5. Eligibility authorizations are EIP-712-signed, nonce-replay-protected,
   expiring, wallet- and property-bound, amount-capped
6. Config fields are immutable after opening
