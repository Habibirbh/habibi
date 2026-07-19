import { encodeAbiParameters, isAddress, isHex } from "viem";

/**
 * Compliance eligibility client (spec §10).
 *
 * The compliance backend evaluates the user offchain and returns a
 * short-lived EIP-712 authorization signed by the configured signer. This
 * client fetches it and abi-encodes it into the `eligibilityData` argument of
 * `HabibiPropertyPools.purchase`. The contract independently verifies the
 * signature, expiry, nonce, wallet, property, and cumulative amount cap.
 *
 * FAIL-CLOSED: any error here must block the purchase — never fall back to
 * empty eligibility data when an API is configured.
 *
 * Expected response from POST {api}/authorize
 *   { "authorization": { "wallet": "0x..", "propertyId": "1",
 *       "maxContributionWei": "…", "eligibilityClass": "0x..32bytes",
 *       "nonce": "…", "expiry": "…" },
 *     "signature": "0x…" }
 */

const AUTH_TUPLE = [
  {
    type: "tuple",
    components: [
      { name: "wallet", type: "address" },
      { name: "propertyId", type: "uint256" },
      { name: "maxContributionWei", type: "uint256" },
      { name: "eligibilityClass", type: "bytes32" },
      { name: "nonce", type: "uint256" },
      { name: "expiry", type: "uint256" },
    ],
  },
  { type: "bytes" },
] as const;

export class EligibilityError extends Error {}

export async function fetchEligibilityData(
  apiUrl: string,
  wallet: `0x${string}`,
  propertyId: bigint,
  amountWei: bigint,
): Promise<`0x${string}`> {
  let res: Response;
  try {
    res = await fetch(`${apiUrl.replace(/\/$/, "")}/authorize`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        wallet,
        propertyId: propertyId.toString(),
        amountWei: amountWei.toString(),
      }),
    });
  } catch {
    throw new EligibilityError("Eligibility service unreachable.");
  }
  if (res.status === 403) {
    throw new EligibilityError("You are not currently eligible to participate in this pool.");
  }
  if (!res.ok) {
    throw new EligibilityError(`Eligibility service error (${res.status}).`);
  }

  const body = (await res.json().catch(() => null)) as {
    authorization?: {
      wallet?: string;
      propertyId?: string;
      maxContributionWei?: string;
      eligibilityClass?: string;
      nonce?: string;
      expiry?: string;
    };
    signature?: string;
  } | null;

  const a = body?.authorization;
  const sig = body?.signature;
  if (!a || !sig || !isHex(sig) || !a.wallet || !isAddress(a.wallet) || !a.eligibilityClass || !isHex(a.eligibilityClass)) {
    throw new EligibilityError("Eligibility service returned a malformed authorization.");
  }
  if (a.wallet.toLowerCase() !== wallet.toLowerCase()) {
    throw new EligibilityError("Authorization was issued for a different wallet.");
  }
  if (BigInt(a.propertyId ?? "0") !== propertyId) {
    throw new EligibilityError("Authorization was issued for a different property.");
  }
  const expiry = BigInt(a.expiry ?? "0");
  if (expiry <= BigInt(Math.floor(Date.now() / 1000))) {
    throw new EligibilityError("Authorization expired — please retry.");
  }
  if (BigInt(a.maxContributionWei ?? "0") < amountWei) {
    throw new EligibilityError(
      "Requested amount exceeds your authorized contribution limit.",
    );
  }

  return encodeAbiParameters(AUTH_TUPLE, [
    {
      wallet: a.wallet as `0x${string}`,
      propertyId,
      maxContributionWei: BigInt(a.maxContributionWei!),
      eligibilityClass: a.eligibilityClass as `0x${string}`,
      nonce: BigInt(a.nonce ?? "0"),
      expiry,
    },
    sig as `0x${string}`,
  ]);
}
