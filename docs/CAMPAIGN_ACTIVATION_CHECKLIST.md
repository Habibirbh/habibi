# Campaign Activation Checklist

Deploying the protocol (done) is **A**. Opening a specific campaign to accept
real ETH is **B**. This checklist is **B** — everything that must be true before
the admin multisig sends `openCampaign`. Until then the app stays in preview mode.

## Legal / offering prerequisites (off-chain, must exist first)
- [ ] SPV / legal entity that will hold the acquired property — real identifier.
- [ ] Offering terms document (final) — published at a content-addressed URI; hash recorded on-chain.
- [ ] Risk disclosure document — published; URI recorded.
- [ ] Regulatory posture confirmed for a fractional real-estate offering in the target jurisdiction(s).
- [ ] Custodian / escrow-of-record arrangement for the acquisition.
- [ ] Executed or committed acquisition agreement with the seller (for the acquisition-authorization step).
- [ ] Independent security audit of `HabibiCampaigns` completed and issues resolved.
- [ ] Slither run and reviewed.

## Compliance integration (off-chain service)
- [ ] KYC/AML provider live behind `NEXT_PUBLIC_COMPLIANCE_API_URL`.
- [ ] That service signs EIP-712 eligibility with the key for `0xc8151bFc36aD674D5AE373721185c6Cbb884eF2C`.
- [ ] `NEXT_PUBLIC_OPERATOR_AUTHORIZATION_READY=true` set only once the above are genuinely in place.

## On-chain campaign creation (admin multisig → `createCampaign`, then `scheduleCampaign`, then `openCampaign`)
Required fields (a campaign cannot enter `FundingOpen` without them):
- [ ] fundingTarget
- [ ] minimum funding threshold
- [ ] minimum contribution
- [ ] maximum contribution per wallet
- [ ] wei-per-unit
- [ ] opening timestamp
- [ ] closing timestamp
- [ ] excess-funds policy
- [ ] property metadata URI (content-addressed)
- [ ] terms hash
- [ ] eligibility signer set (already: `0xc815…eF2C`)

## Property page (already built, preview)
- [ ] Replace representative imagery with licensed property media (currently labelled "Representative imagery — final property materials pending").
- [ ] Confirm the "Proposed Acquisition" framing and documents reflect the real offering.

## Order of operations to open
1. Complete every box above.
2. Admin multisig: `createCampaign(...)` → `scheduleCampaign(...)`.
3. Final review of the created campaign's on-chain parameters.
4. Admin multisig: `openCampaign(id)` — contributions become possible.
5. Frontend: set `NEXT_PUBLIC_OPERATOR_AUTHORIZATION_READY=true` and `NEXT_PUBLIC_COMPLIANCE_API_URL`.
