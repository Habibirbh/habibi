"use client";

import { useState } from "react";
import { useAccount, useReadContract, usePublicClient, useWriteContract } from "wagmi";
import { keccak256, toBytes } from "viem";
import { ShieldAlert, Play, Pause, XCircle, CheckCircle2 } from "lucide-react";
import { poolsAbi, poolsContractAddress } from "@/lib/web3/config";
import { targetChain } from "@/lib/web3/chains";
import { usePools } from "@/lib/web3/hooks";
import { useHabibi } from "./Web3Provider";
import { useSite } from "@/components/site/SiteProvider";
import { eth, bpsToPercent, shortAddress } from "@/lib/web3/format";
import { poolStatusLabel, PoolStatus } from "@/lib/web3/pools";

const PROPERTY_MANAGER_ROLE = keccak256(toBytes("PROPERTY_MANAGER_ROLE"));
const PAUSER_ROLE = keccak256(toBytes("PAUSER_ROLE"));

/**
 * Admin surface (spec §20). The CONTRACT is the authority: every control here
 * simply submits a role-gated transaction signed by the connected wallet; the
 * page itself grants nothing. Users without the onchain role see a refusal.
 */
export function AdminPanel() {
  const { address } = useAccount();
  const { mounted, connected, openConnect } = useHabibi();
  const { showToast } = useSite();
  const contract = poolsContractAddress();
  const { pools, refetch } = usePools();
  const client = usePublicClient({ chainId: targetChain.id });
  const { writeContractAsync } = useWriteContract();
  const [busy, setBusy] = useState<string | null>(null);

  const isManager = useReadContract({
    address: contract ?? undefined,
    abi: poolsAbi,
    functionName: "hasRole",
    args: address ? [PROPERTY_MANAGER_ROLE, address] : undefined,
    chainId: targetChain.id,
    query: { enabled: !!contract && !!address },
  });
  const isPauser = useReadContract({
    address: contract ?? undefined,
    abi: poolsAbi,
    functionName: "hasRole",
    args: address ? [PAUSER_ROLE, address] : undefined,
    chainId: targetChain.id,
    query: { enabled: !!contract && !!address },
  });

  async function act(
    label: string,
    fn: "openProperty" | "closeProperty" | "cancelProperty" | "setPurchasesPaused",
    args: readonly unknown[],
  ) {
    if (!contract || !client || !address) return;
    setBusy(label);
    try {
      const { request } = await client.simulateContract({
        account: address,
        address: contract,
        abi: poolsAbi,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        functionName: fn as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        args: args as any,
      });
      const hash = await writeContractAsync(request);
      await client.waitForTransactionReceipt({ hash });
      showToast(`${label} confirmed onchain`);
      refetch();
    } catch (e) {
      showToast(e instanceof Error ? e.message.split("\n")[0].slice(0, 80) : "Transaction failed");
    } finally {
      setBusy(null);
    }
  }

  if (!mounted) return <div className="mx-auto max-w-[82rem] px-5 py-24"><div className="h-40 animate-pulse rounded-2xl bg-bg2/60" /></div>;

  if (!connected || !address) {
    return (
      <Gate>
        <p className="text-[0.95rem] text-muted">Connect the administrator wallet to continue.</p>
        <button type="button" onClick={openConnect} className="focus-lime mt-5 rounded-full bg-ink px-6 py-3 text-[0.9rem] font-medium text-surface hover:bg-lime hover:text-ink transition-colors">
          Connect wallet
        </button>
      </Gate>
    );
  }

  if (isManager.isLoading || isPauser.isLoading) {
    return <Gate><p className="text-[0.95rem] text-muted">Checking onchain roles…</p></Gate>;
  }

  if (!isManager.data && !isPauser.data) {
    return (
      <Gate>
        <p className="flex items-center justify-center gap-2 text-[0.95rem] text-muted">
          <ShieldAlert className="h-4 w-4" />
          {shortAddress(address)} holds no administrative role on this contract.
        </p>
      </Gate>
    );
  }

  return (
    <div className="mx-auto max-w-[82rem] px-5 py-12 sm:px-8">
      <span className="inline-flex items-center gap-2 rounded-full bg-lime-soft/60 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-wider text-ink">
        Admin · onchain roles verified
      </span>
      <h1 className="mt-4 font-serif text-[clamp(2rem,4vw,3rem)] text-ink">Property administration</h1>
      <p className="mt-2 max-w-xl text-[0.9rem] text-muted">
        Signed-in as {shortAddress(address)} · manager: {String(!!isManager.data)} · pauser:{" "}
        {String(!!isPauser.data)}. Every action below is a role-gated transaction simulated before
        signing.
      </p>

      <div className="mt-8 space-y-4">
        {pools.map((p) => (
          <div key={p.meta.slug} className="rounded-2xl border border-line bg-surface p-5 shadow-card">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-serif text-xl text-ink">{p.meta.name}</h2>
                <p className="text-[0.8rem] text-muted">
                  #{p.meta.poolId.toString()} · {poolStatusLabel[p.status]}
                  {p.purchasesPaused && " · purchases paused"} · {eth(p.totalContributedWei)} /{" "}
                  {eth(p.fundingTargetWei)} ({bpsToPercent(p.bps)}) · {p.participantCount} participants
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {isManager.data && p.status !== PoolStatus.Open && p.status !== PoolStatus.Funded && p.status !== PoolStatus.Closed && p.status !== PoolStatus.Cancelled ? (
                  <AdminBtn icon={<Play className="h-3.5 w-3.5" />} label="Open" busy={busy === `open-${p.meta.slug}`} onClick={() => act(`open-${p.meta.slug}`, "openProperty", [p.meta.poolId])} />
                ) : null}
                {isPauser.data && p.status === PoolStatus.Open && (
                  <AdminBtn
                    icon={<Pause className="h-3.5 w-3.5" />}
                    label={p.purchasesPaused ? "Unpause" : "Pause"}
                    busy={busy === `pause-${p.meta.slug}`}
                    onClick={() => act(`pause-${p.meta.slug}`, "setPurchasesPaused", [p.meta.poolId, !p.purchasesPaused])}
                  />
                )}
                {isManager.data && (p.status === PoolStatus.Open || p.status === PoolStatus.Funded) && (
                  <AdminBtn icon={<CheckCircle2 className="h-3.5 w-3.5" />} label="Close" busy={busy === `close-${p.meta.slug}`} onClick={() => act(`close-${p.meta.slug}`, "closeProperty", [p.meta.poolId])} />
                )}
                {isManager.data && p.status !== PoolStatus.Closed && p.status !== PoolStatus.Cancelled && (
                  <AdminBtn icon={<XCircle className="h-3.5 w-3.5" />} label="Cancel" busy={busy === `cancel-${p.meta.slug}`} onClick={() => act(`cancel-${p.meta.slug}`, "cancelProperty", [p.meta.poolId])} />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-8 text-[0.78rem] text-muted">
        Property creation, scheduling, metadata, eligibility-signer and transfer-policy changes are
        performed through deployment scripts or the governance multisig workflow (see
        ADMIN_OPERATIONS.md). No administrator key exists in this application.
      </p>
    </div>
  );
}

function Gate({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-[82rem] px-5 py-24 sm:px-8">
      <div className="mx-auto max-w-md rounded-[1.75rem] border border-line bg-surface p-8 text-center shadow-card">
        <h1 className="font-serif text-3xl text-ink">Admin</h1>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

function AdminBtn({ icon, label, busy, onClick }: { icon: React.ReactNode; label: string; busy: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      disabled={busy}
      onClick={onClick}
      className="focus-lime inline-flex items-center gap-1.5 rounded-full border border-line-strong px-3.5 py-1.5 text-[0.8rem] font-medium text-ink transition-colors hover:bg-ink hover:text-surface disabled:opacity-50"
    >
      {icon}
      {busy ? "Confirming…" : label}
    </button>
  );
}
