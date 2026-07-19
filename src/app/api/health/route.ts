import { NextResponse } from "next/server";
import { createPublicClient, http } from "viem";
import { targetChain } from "@/lib/web3/chains";
import { habibiPropertyPoolsDeployments } from "@/lib/contracts/habibiPropertyPools";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Health endpoint (spec §29): RPC connectivity, chain id, latest block, contract availability. */
export async function GET() {
  const contract = habibiPropertyPoolsDeployments[targetChain.id]?.address
    ?? process.env.NEXT_PUBLIC_PROPERTY_CONTRACT_ADDRESS
    ?? null;
  let rpcOk = false;
  let latestBlock: string | null = null;
  let chainId: number | null = null;
  try {
    const client = createPublicClient({ chain: targetChain, transport: http() });
    chainId = await client.getChainId();
    latestBlock = (await client.getBlockNumber()).toString();
    rpcOk = chainId === targetChain.id;
  } catch {
    rpcOk = false;
  }
  return NextResponse.json(
    {
      status: rpcOk && contract ? "ok" : "degraded",
      rpc: { ok: rpcOk, chainId, expectedChainId: targetChain.id, latestBlock },
      contract: { configured: !!contract, address: contract },
    },
    { status: rpcOk ? 200 : 503 },
  );
}
