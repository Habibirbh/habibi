# Eligibility Integration

The compliance backend (not in this repo) evaluates a user offchain and
returns a short-lived signed authorization; nothing personal goes onchain.

Flow:
1. Frontend requests authorization from `NEXT_PUBLIC_COMPLIANCE_API_URL`
   for (wallet, propertyId, intended amount).
2. Backend returns `EligibilityAuthorization { wallet, propertyId,
   maxContributionWei, eligibilityClass, nonce, expiry }` + EIP-712 signature
   from `COMPLIANCE_SIGNER_ADDRESS`.
3. Frontend abi-encodes (auth, signature) into `purchase()`'s
   `eligibilityData`.
4. Contract verifies domain-separated signature, expiry, per-wallet nonce,
   and cumulative amount cap, then burns the nonce.

Until this backend exists: mainnet purchase submission is disabled
(`purchasesEnabled()` in `src/lib/web3/config.ts`) — eligibility is never
bypassed in production. Local chains may run with the signer unset.
