# Indexer Architecture

## Current implementation (shipped)

Conservative polling + bounded log scans (spec §16/§17 fallback): pool state
re-reads on new blocks; history via `getLogs(PropertyPurchased)` chunked in
≤9k-block ranges from the recorded deployment block (never genesis). Onchain
reads remain the final source of truth; explorer links use tx hashes.

## Production plan (before scale)

- Alchemy webhooks (or equivalent) → `/api/webhooks/chain` with signature
  verification (`ALCHEMY_WEBHOOK_SIGNING_KEY`) and duplicate-delivery
  idempotency on (txHash, logIndex).
- Postgres tables: `property_event_index(chain_id, contract, block_number,
  block_hash, tx_hash, log_index, event_name, data, confirmed)` with unique
  (tx_hash, log_index); `webhook_deliveries`; `transaction_status`.
- Reorg handling: store block_hash; on mismatch at height H, invalidate rows
  ≥ H and rescan. Events marked confirmed after N confirmations.
- The database is a cache; disputes resolve against the chain.
