# Treasury Accounting

Two values, never conflated:

1. **Contract-attributed inflows** — `totalForwardedWei` and per-pool
   `totalContributedWei`, updated atomically inside `purchase()`. This is the
   platform's accounting truth and the ONLY input to pool progress.
2. **Live treasury balance** — `eth_getBalance(treasury)`. The treasury can
   receive or send unrelated funds, pay expenses, or fund refunds, so this
   number can diverge in either direction and is displayed with that notice.

Pool progress = contract totals / target (basis points, bigint math).
Attributed inflows can also be independently re-derived from
`PropertyPurchased` events (txHash + logIndex as idempotency key).

Every purchase forwards `msg.value` to the pool's configured treasury in the
same transaction; a failed transfer reverts the purchase, so contract
accounting can never exceed what the treasury actually received from
purchases.
