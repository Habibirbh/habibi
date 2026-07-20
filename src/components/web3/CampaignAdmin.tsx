"use client";

import { useState } from "react";
import { useAccount, useReadContracts, usePublicClient, useWriteContract } from "wagmi";
import { keccak256, toBytes, parseEther } from "viem";
import { ShieldAlert, Play, Pause, XCircle, RefreshCw, FileCheck2, Banknote, CheckCircle2, Plus } from "lucide-react";
import { campaignsAbi, campaignsContractAddress, campaignRegistry, CampaignState, campaignStateLabel } from "@/lib/web3/campaigns";
import { targetChain } from "@/lib/web3/chains";
import { useUserCampaigns, type OnchainCampaign } from "@/lib/web3/useCampaigns";
import { useHabibi } from "./Web3Provider";
import { useSite } from "@/components/site/SiteProvider";
import { eth, bpsToPercent, shortAddress } from "@/lib/web3/format";

const CAMPAIGN_MANAGER_ROLE = keccak256(toBytes("CAMPAIGN_MANAGER_ROLE"));
const PAUSER_ROLE = keccak256(toBytes("PAUSER_ROLE"));
const ACQUISITION_AUTHORIZER_ROLE = keccak256(toBytes("ACQUISITION_AUTHORIZER_ROLE"));

/**
 * Admin surface (spec §9). The CONTRACT is the authority — every control here
 * submits a simulated, role-gated transaction signed by the connected wallet.
 * A wallet without the onchain role sees a refusal; there is no local isAdmin.
 */
export function CampaignAdmin() {
  const { address } = useAccount();
  const { mounted, connected, openConnect } = useHabibi();
  const { showToast } = useSite();
  const contract = campaignsContractAddress();
  const client = usePublicClient({ chainId: targetChain.id });
  const { positions, refetch } = useUserCampaigns();
  const { writeContractAsync } = useWriteContract();
  const [busy, setBusy] = useState<string | null>(null);

  const roles = useReadContracts({
    contracts:
      contract && address
        ? [
            { address: contract, abi: campaignsAbi, functionName: "hasRole", args: [CAMPAIGN_MANAGER_ROLE, address], chainId: targetChain.id },
            { address: contract, abi: campaignsAbi, functionName: "hasRole", args: [PAUSER_ROLE, address], chainId: targetChain.id },
            { address: contract, abi: campaignsAbi, functionName: "hasRole", args: [ACQUISITION_AUTHORIZER_ROLE, address], chainId: targetChain.id },
          ]
        : [],
    query: { enabled: !!contract && !!address },
  });
  const isManager = roles.data?.[0]?.result as boolean | undefined;
  const isPauser = roles.data?.[1]?.result as boolean | undefined;
  const isAuthorizer = roles.data?.[2]?.result as boolean | undefined;

  async function run(label: string, fn: string, args: readonly unknown[]) {
    if (!contract || !client || !address) return;
    setBusy(label);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { request } = await client.simulateContract({ account: address, address: contract, abi: campaignsAbi, functionName: fn as any, args: args as any });
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

  if (!mounted) return <Skeleton />;
  if (!connected || !address)
    return <Gate><p className="text-[0.95rem] text-muted">Connect the administrator wallet to continue.</p><button onClick={openConnect} className="focus-lime mt-5 rounded-full bg-ink px-6 py-3 text-[0.9rem] font-medium text-surface hover:bg-lime hover:text-ink transition-colors">Connect wallet</button></Gate>;
  if (roles.isLoading) return <Gate><p className="text-[0.95rem] text-muted">Checking onchain roles…</p></Gate>;
  if (!isManager && !isPauser && !isAuthorizer)
    return <Gate><p className="flex items-center justify-center gap-2 text-[0.95rem] text-muted"><ShieldAlert className="h-4 w-4" />{shortAddress(address)} holds no admin role on this contract.</p></Gate>;

  return (
    <div className="mx-auto max-w-[82rem] px-5 py-12 sm:px-8">
      <span className="inline-flex items-center gap-2 rounded-full bg-lime-soft/60 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-wider text-ink">Admin · onchain roles verified</span>
      <h1 className="mt-4 font-serif text-[clamp(2rem,4vw,3rem)] text-ink">Campaign administration</h1>
      <p className="mt-2 max-w-xl text-[0.9rem] text-muted">
        {shortAddress(address)} · manager {String(!!isManager)} · pauser {String(!!isPauser)} · authorizer {String(!!isAuthorizer)}. Every action is simulated before signing.
      </p>

      <div className="mt-8 space-y-4">
        {positions.map((p) => (
          <AdminCampaignRow key={p.meta.slug} p={p} busy={busy} run={run} roles={{ isManager: !!isManager, isPauser: !!isPauser, isAuthorizer: !!isAuthorizer }} />
        ))}
      </div>

      {isManager && <CreateCampaignForm busy={busy} run={run} />}

      <p className="mt-8 text-[0.78rem] text-muted">
        Adding approved property images, updating metadata, and scheduling are performed via the campaign config +
        deployment scripts or governance workflow. No administrator key exists in this application.
      </p>
    </div>
  );
}

function AdminCampaignRow({
  p, busy, run, roles,
}: {
  p: OnchainCampaign;
  busy: string | null;
  run: (l: string, fn: string, a: readonly unknown[]) => Promise<void>;
  roles: { isManager: boolean; isPauser: boolean; isAuthorizer: boolean };
}) {
  const id = p.meta.campaignId;
  const s = p.state;
  const [showAuth, setShowAuth] = useState(false);

  return (
    <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-xl text-ink">{p.meta.name}</h2>
          <p className="text-[0.8rem] text-muted">
            #{id.toString()} · {campaignStateLabel[s]} · {eth(p.totalCommittedWei)} / {eth(p.fundingTargetWei)} ({bpsToPercent(p.bps)}) · {p.participantCount} participants · escrow {eth(p.escrowWei)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {roles.isManager && s === CampaignState.Draft && <Btn icon={<Play className="h-3.5 w-3.5" />} label="Schedule" busy={busy === `schedule-${id}`} onClick={() => run(`schedule-${id}`, "scheduleCampaign", [id, 0n, BigInt(Math.floor(Date.now() / 1000) + 86400 * 30)])} />}
          {roles.isManager && s === CampaignState.Scheduled && <Btn icon={<Play className="h-3.5 w-3.5" />} label="Open" busy={busy === `open-${id}`} onClick={() => run(`open-${id}`, "openCampaign", [id])} />}
          {roles.isPauser && s === CampaignState.FundingOpen && <Btn icon={<Pause className="h-3.5 w-3.5" />} label="Pause all" busy={busy === `pause-${id}`} onClick={() => run(`pause-${id}`, "pause", [])} />}
          {roles.isManager && s === CampaignState.FundingOpen && <Btn icon={<RefreshCw className="h-3.5 w-3.5" />} label="Close funding" busy={busy === `close-${id}`} onClick={() => run(`close-${id}`, "closeFunding", [id])} />}
          {roles.isManager && (s === CampaignState.FundingOpen || s === CampaignState.FundingSuccessful || s === CampaignState.Scheduled || s === CampaignState.AcquisitionPending) && <Btn icon={<XCircle className="h-3.5 w-3.5" />} label="Cancel" busy={busy === `cancel-${id}`} onClick={() => run(`cancel-${id}`, "cancelCampaign", [id, keccak256(toBytes("admin-cancel"))])} />}
          {roles.isManager && s === CampaignState.Cancelled && <Btn icon={<RefreshCw className="h-3.5 w-3.5" />} label="Enable refunds" busy={busy === `refunds-${id}`} onClick={() => run(`refunds-${id}`, "enableRefunds", [id])} />}
          {roles.isAuthorizer && s === CampaignState.FundingSuccessful && <Btn icon={<FileCheck2 className="h-3.5 w-3.5" />} label="Authorize acquisition" busy={false} onClick={() => setShowAuth((v) => !v)} />}
          {roles.isAuthorizer && s === CampaignState.AcquisitionPending && <Btn icon={<Banknote className="h-3.5 w-3.5" />} label="Release funds" busy={busy === `release-${id}`} onClick={() => run(`release-${id}`, "releaseAcquisitionFunds", [id, keccak256(toBytes("evidence"))])} />}
          {roles.isManager && s === CampaignState.Acquired && <Btn icon={<CheckCircle2 className="h-3.5 w-3.5" />} label="Finalize interests" busy={busy === `finalize-${id}`} onClick={() => run(`finalize-${id}`, "finalizeInterests", [id])} />}
        </div>
      </div>
      {showAuth && <AuthorizeForm p={p} busy={busy} run={run} onDone={() => setShowAuth(false)} />}
    </div>
  );
}

function AuthorizeForm({ p, busy, run, onDone }: { p: OnchainCampaign; busy: string | null; run: (l: string, fn: string, a: readonly unknown[]) => Promise<void>; onDone: () => void }) {
  const id = p.meta.campaignId;
  const [price, setPrice] = useState("");
  const [dest, setDest] = useState("");
  const [agreement, setAgreement] = useState("acquisition-agreement-ref");
  const [spv, setSpv] = useState("spv-ref");
  const [closing, setClosing] = useState("closing-doc-ref");
  const [err, setErr] = useState<string | null>(null);

  async function submit() {
    try {
      if (!/^0x[0-9a-fA-F]{40}$/.test(dest)) throw new Error("Enter a valid payment destination address.");
      const priceWei = parseEther(price || "0");
      if (priceWei <= 0n || priceWei > p.totalCommittedWei) throw new Error("Price must be > 0 and ≤ committed funds.");
      const auth = {
        campaignId: id,
        finalAcquisitionPrice: priceWei,
        approvedPaymentDestination: dest as `0x${string}`,
        acquisitionAgreementHash: keccak256(toBytes(agreement)),
        SPVIdentifier: keccak256(toBytes(spv)),
        closingDocumentHash: keccak256(toBytes(closing)),
        authorizationExpiry: BigInt(Math.floor(Date.now() / 1000) + 3600),
        authorizationNonce: BigInt(Date.now()),
      };
      await run(`authorize-${id}`, "authorizeAcquisition", [auth, "0x"]);
      onDone();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Invalid input");
    }
  }

  return (
    <div className="mt-4 rounded-xl border border-line bg-bg2/40 p-4">
      <p className="text-[0.82rem] font-medium text-ink">Acquisition authorization</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Final price (ETH)" className="rounded-lg border border-line-strong bg-white px-3 py-2 text-[0.85rem] outline-none" />
        <input value={dest} onChange={(e) => setDest(e.target.value)} placeholder="Approved payment destination (0x…)" className="rounded-lg border border-line-strong bg-white px-3 py-2 font-mono text-[0.8rem] outline-none" />
        <input value={agreement} onChange={(e) => setAgreement(e.target.value)} placeholder="Acquisition agreement ref" className="rounded-lg border border-line-strong bg-white px-3 py-2 text-[0.85rem] outline-none" />
        <input value={spv} onChange={(e) => setSpv(e.target.value)} placeholder="SPV identifier ref" className="rounded-lg border border-line-strong bg-white px-3 py-2 text-[0.85rem] outline-none" />
        <input value={closing} onChange={(e) => setClosing(e.target.value)} placeholder="Closing document ref" className="rounded-lg border border-line-strong bg-white px-3 py-2 text-[0.85rem] outline-none sm:col-span-2" />
      </div>
      <p className="mt-2 text-[0.72rem] text-muted">Text refs are hashed to bytes32 onchain — no confidential documents are stored on chain.</p>
      {err && <p className="mt-2 text-[0.8rem] text-[#b4442f]">{err}</p>}
      <button onClick={submit} disabled={busy !== null} className="focus-lime mt-3 rounded-full bg-ink px-4 py-2 text-[0.82rem] font-medium text-surface hover:bg-lime hover:text-ink transition-colors disabled:opacity-50">
        {busy === `authorize-${id}` ? "Confirming…" : "Submit authorization"}
      </button>
    </div>
  );
}

function CreateCampaignForm({ busy, run }: { busy: string | null; run: (l: string, fn: string, a: readonly unknown[]) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState("40");
  const [threshold, setThreshold] = useState("24");
  const [minC, setMinC] = useState("0.05");
  const [unit, setUnit] = useState("0.05");
  const [err, setErr] = useState<string | null>(null);

  async function submit() {
    try {
      const t = parseEther(target), th = parseEther(threshold), m = parseEther(minC), u = parseEther(unit);
      if (u <= 0n || t % u !== 0n) throw new Error("Target must be a multiple of unit.");
      if (m <= 0n || m % u !== 0n) throw new Error("Min must be a multiple of unit.");
      if (th <= 0n || th > t || th % u !== 0n) throw new Error("Invalid threshold.");
      await run("create", "createCampaign", [t, th, m, 0n, u, 0, "0x0000000000000000000000000000000000000000", 0, "habibi://campaign/new", keccak256(toBytes("terms-new"))]);
      setOpen(false);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Invalid");
    }
  }

  return (
    <div className="mt-8 rounded-2xl border border-line bg-surface p-5 shadow-card">
      <button onClick={() => setOpen((v) => !v)} className="focus-lime inline-flex items-center gap-2 text-[0.9rem] font-medium text-ink">
        <Plus className="h-4 w-4" /> Create campaign
      </button>
      {open && (
        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          <Labelled l="Target (ETH)"><input value={target} onChange={(e) => setTarget(e.target.value)} className="w-full rounded-lg border border-line-strong bg-white px-3 py-2 text-[0.85rem] outline-none" /></Labelled>
          <Labelled l="Threshold (ETH)"><input value={threshold} onChange={(e) => setThreshold(e.target.value)} className="w-full rounded-lg border border-line-strong bg-white px-3 py-2 text-[0.85rem] outline-none" /></Labelled>
          <Labelled l="Min (ETH)"><input value={minC} onChange={(e) => setMinC(e.target.value)} className="w-full rounded-lg border border-line-strong bg-white px-3 py-2 text-[0.85rem] outline-none" /></Labelled>
          <Labelled l="Unit (ETH)"><input value={unit} onChange={(e) => setUnit(e.target.value)} className="w-full rounded-lg border border-line-strong bg-white px-3 py-2 text-[0.85rem] outline-none" /></Labelled>
          {err && <p className="text-[0.8rem] text-[#b4442f] sm:col-span-4">{err}</p>}
          <button onClick={submit} disabled={busy !== null} className="focus-lime rounded-full bg-ink px-4 py-2 text-[0.82rem] font-medium text-surface hover:bg-lime hover:text-ink transition-colors disabled:opacity-50 sm:col-span-1">
            {busy === "create" ? "Confirming…" : "Create (Draft)"}
          </button>
        </div>
      )}
      <p className="mt-2 text-[0.72rem] text-muted">Created in Draft. Schedule + open via the campaign controls once metadata/terms are finalized. {campaignRegistry.length} campaign(s) registered in the frontend.</p>
    </div>
  );
}

function Labelled({ l, children }: { l: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1 block text-[0.7rem] uppercase tracking-wider text-muted">{l}</span>{children}</label>;
}
function Btn({ icon, label, busy, onClick }: { icon: React.ReactNode; label: string; busy: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} disabled={busy} className="focus-lime inline-flex items-center gap-1.5 rounded-full border border-line-strong px-3.5 py-1.5 text-[0.8rem] font-medium text-ink transition-colors hover:bg-ink hover:text-surface disabled:opacity-50">
      {icon}{busy ? "Confirming…" : label}
    </button>
  );
}
function Gate({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-[82rem] px-5 py-24 sm:px-8"><div className="mx-auto max-w-md rounded-[1.75rem] border border-line bg-surface p-8 text-center shadow-card"><h1 className="font-serif text-3xl text-ink">Admin</h1><div className="mt-4">{children}</div></div></div>;
}
function Skeleton() {
  return <div className="mx-auto max-w-[82rem] px-5 py-24 sm:px-8"><div className="h-40 animate-pulse rounded-2xl bg-bg2/60" /></div>;
}
