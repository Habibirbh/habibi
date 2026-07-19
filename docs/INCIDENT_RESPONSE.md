# Incident Response

## Immediate actions

- Suspected contract issue: PAUSER calls `pause()` (global) — blocks all
  purchases. Per-pool: `setPurchasesPaused(id, true)`.
- RPC outage: frontend degrades to error states (no fake data); check
  `/api/health`; rotate `NEXT_PUBLIC_ROBINHOOD_RPC_URL` to a standby.
- Compliance signer compromise: `setEligibilitySigner(newSigner)` via
  ELIGIBILITY_MANAGER_ROLE; old authorizations expire naturally.
- Treasury address compromise: pools' treasury is immutable per pool once
  open → pause affected pools, cancel + enable refunds where the approved
  legal process requires it.

## Communication

Publish the incident, affected pools, pause status, and explorer links.
Never announce recovery before onchain state confirms it.

## Post-incident

Re-run the invariant suite against a fork of the incident block; document
timeline; rotate any potentially exposed operational keys.
