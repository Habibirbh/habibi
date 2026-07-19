"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { usePublicClient, useWriteContract, useWaitForTransactionReceipt, useAccount } from "wagmi";
import { parseEther } from "viem";
import { AlertTriangle, Check, ArrowRight, ExternalLink, MapPin, ShieldCheck, ArrowLeft } from "lucide-react";
import { Photo } from "@/components/ui/Photo";
import { media } from "@/lib/media";
import { useHabibi } from "./Web3Provider";
import { useCampaign } from "@/lib/web3/useCampaigns";
import {
  campaignBySlug,
  campaignsAbi,
  campaignsContractAddress,
  contributionsEnabled,
  campaignStateLabel,
  CampaignState,
} from "@/lib/web3/campaigns";
import { complianceApiUrl } from "@/lib/web3/config";
import { fetchEligibilityData, EligibilityError } from "@/lib/web3/eligibility";
import { targetChain, explorerTxUrl, explorerAddressUrl } from "@/lib/web3/chains";
import { eth, bpsToPercent, shortAddress } from "@/lib/web3/format";

const CONDITIONAL_NOTICE =
  "This property has not yet been acquired. Contributions are conditional and remain subject to funding, due diligence, seller availability, acquisition closing, eligibility requirements, and the applicable participation terms.";

export function PropertyDetail({ slug }: { slug: string }) {
  const meta = campaignBySlug(slug);
  const { campaign, configured, isLoading } = useCampaign(meta);

  if (!meta) {
    const title = slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    return (
      <div className="mx-auto max-w-[82rem] px-5 py-20 sm:px-8">
        <Link href="/#properties" className="focus-lime nav-underline mb-6 inline-flex items-center gap-2 text-[0.85rem] text-muted">
          <ArrowLeft className="h-4 w-4" /> All properties
        </Link>
        <div className="rounded-[1.75rem] border border-line bg-surface p-8 shadow-card">
          <span className="rounded-full bg-sand/40 px-3 py-1 text-[0.72rem] font-medium text-ink/70">Representative concept</span>
          <h1 className="mt-4 font-serif text-3xl text-ink">{title}</h1>
          <p className="mt-3 max-w-xl text-[0.95rem] leading-relaxed text-muted">
            This is a representative concept. A live conditional acquisition campaign is not currently configured for this
            property, so contributions are not available. When a campaign is prepared, this page will show its onchain
            funding status, escrow terms, and refund conditions.
          </p>
        </div>
      </div>
    );
  }

  const bps = campaign?.bps ?? 0;

  return (
    <div className="mx-auto max-w-[82rem] px-5 py-8 sm:px-8 sm:py-12">
      <Link href="/#properties" className="focus-lime nav-underline mb-6 inline-flex items-center gap-2 text-[0.85rem] text-muted">
        <ArrowLeft className="h-4 w-4" /> All properties
      </Link>

      {/* Hero — representative imagery, clearly labelled */}
      <div className="relative overflow-hidden rounded-[1.75rem] shadow-card">
        <Photo asset={media[meta.image]} sizes="100vw" zoom={false} className="aspect-[16/8] w-full" overlay="bg-gradient-to-t from-ink/70 via-ink/10 to-transparent" />
        <span className="absolute left-4 top-4 rounded-full bg-ink/70 px-3 py-1 text-[0.68rem] font-medium text-surface backdrop-blur">
          {meta.mediaRightsStatus}
        </span>
        <div className="absolute inset-x-5 bottom-5 text-surface">
          <div className="flex items-center gap-1.5 text-[0.8rem] text-surface/80">
            <MapPin className="h-4 w-4" strokeWidth={1.75} /> {meta.location}
          </div>
          <h1 className="mt-1 max-w-3xl font-serif text-[clamp(1.8rem,4vw,2.8rem)] leading-tight">{meta.name}</h1>
        </div>
      </div>

      {/* Conditional notice — prominent */}
      <div className="mt-5 flex items-start gap-3 rounded-2xl border border-[#e0a33d]/40 bg-[#e0a33d]/[0.08] px-5 py-4">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[#b07a1a]" strokeWidth={1.75} />
        <p className="text-[0.9rem] leading-relaxed text-ink/80">{CONDITIONAL_NOTICE}</p>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        {/* LEFT — property & campaign information */}
        <div className="space-y-8">
          <section>
            <div className="flex flex-wrap items-center gap-3">
              <StatusPill state={campaign?.state ?? CampaignState.None} configured={configured} />
              <span className="text-[0.85rem] text-muted">
                {campaign ? `${campaign.participantCount} participant${campaign.participantCount === 1 ? "" : "s"}` : "—"}
              </span>
            </div>
            <p className="mt-4 max-w-2xl text-pretty text-[1rem] leading-relaxed text-muted">{meta.summary}</p>
          </section>

          {/* funding progress from onchain accounting */}
          <section className="rounded-2xl border border-line bg-surface p-5 shadow-card">
            <h2 className="text-[0.95rem] font-semibold text-ink">Funding progress</h2>
            {campaign ? (
              <>
                <div className="mt-3 flex items-center justify-between text-[0.85rem] text-muted">
                  <span>
                    <span className="font-medium text-ink">{eth(campaign.totalCommittedWei)}</span> committed of{" "}
                    {eth(campaign.fundingTargetWei)} target
                  </span>
                  <span className="font-medium text-ink">{bpsToPercent(bps)}</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-ink/[0.08]">
                  <div className="h-full rounded-full bg-lime transition-all duration-500" style={{ width: `${bps / 100}%` }} />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-4 text-[0.82rem] sm:grid-cols-4">
                  <Field k="Min. threshold" v={eth(campaign.minThresholdWei)} />
                  <Field k="Remaining" v={eth(campaign.remainingWei)} />
                  <Field k="Min. contribution" v={eth(campaign.minContributionWei)} />
                  <Field k="In escrow" v={eth(campaign.escrowWei)} />
                </div>
              </>
            ) : (
              <p className="mt-3 text-[0.85rem] text-muted">{isLoading ? "Reading onchain state…" : "Preview — campaign not yet configured on this network."}</p>
            )}
          </section>

          {/* property facts (objective attributes) */}
          <section>
            <h2 className="text-[0.95rem] font-semibold text-ink">Property details</h2>
            <div className="mt-3 grid grid-cols-2 gap-x-8 gap-y-3 rounded-2xl border border-line bg-surface p-5 sm:grid-cols-3">
              {meta.facts.map((f) => (
                <div key={f.label}>
                  <p className="text-[0.66rem] uppercase tracking-wider text-muted">{f.label}</p>
                  <p className="mt-0.5 text-[0.9rem] font-medium text-ink">{f.value}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {meta.amenities.map((a) => (
                <span key={a} className="rounded-full border border-line bg-surface px-3 py-1.5 text-[0.8rem] text-ink/75">
                  {a}
                </span>
              ))}
            </div>
          </section>

          {/* proposed economics */}
          <InfoGrid
            title="Proposed acquisition"
            rows={[
              ["Indicative reference price", meta.indicativePrice],
              ["Final acquisition price", meta.proposedAcquisitionPrice],
              ["Acquisition costs budget", meta.acquisitionCostsBudget],
              ["Contingency / reserve", meta.contingency],
              ["Acquisition structure", meta.acquisitionStructure],
              ["Proposed SPV", meta.proposedSPV],
              ["Platform fee", campaign ? (campaign.feeBps > 0 ? `${(campaign.feeBps / 100).toFixed(2)}%` : "None") : "—"],
            ]}
          />

          <ListBlock title="Acquisition conditions" items={meta.acquisitionConditions} />
          <ListBlock title="Refund conditions" items={meta.refundConditions} />
          <ListBlock title="Risk factors" items={meta.riskFactors} tone="muted" />

          {/* documents */}
          <section>
            <h2 className="text-[0.95rem] font-semibold text-ink">Documents</h2>
            <ul className="mt-3 divide-y divide-line rounded-2xl border border-line bg-surface">
              {meta.documents.map((d) => (
                <li key={d.label} className="flex items-center justify-between px-5 py-3 text-[0.88rem]">
                  <span className="text-ink/80">{d.label}</span>
                  <span className="rounded-full bg-sand/40 px-2.5 py-0.5 text-[0.68rem] font-medium text-ink/60">{d.status}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* onchain references */}
          {configured && campaign && (
            <section className="rounded-2xl border border-line bg-bg2/50 p-5 text-[0.82rem]">
              <h2 className="text-[0.95rem] font-semibold text-ink">Onchain</h2>
              <div className="mt-3 space-y-1.5">
                <RefRow label="Escrow contract" address={campaignsContractAddress()} />
                <div className="flex items-center justify-between">
                  <span className="text-muted">Network</span>
                  <span className="text-ink/80">{targetChain.name} · chain {targetChain.id}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted">Transfer policy</span>
                  <span className="text-ink/80">{campaign.transfersEnabled ? "Enabled" : "Restricted (default)"}</span>
                </div>
              </div>
            </section>
          )}
        </div>

        {/* RIGHT — contribution panel */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <ContributionPanel slug={slug} />
        </div>
      </div>

      <p className="mt-10 text-center text-[0.75rem] leading-relaxed text-muted">
        Habibi is not affiliated with, endorsed by, or authorized by any developer or seller named as an acquisition
        target. Participation units are contract-recorded conditional interests, not registered land title.
      </p>
    </div>
  );
}

/* --------------------------- contribution panel --------------------------- */

type Step = "form" | "submitted" | "confirmed";

function ContributionPanel({ slug }: { slug: string }) {
  const meta = campaignBySlug(slug);
  const contract = campaignsContractAddress();
  const { address } = useAccount();
  const { mounted, connected, chainOk, balanceWei, openConnect } = useHabibi();
  const { campaign, refetch } = useCampaign(meta);
  const client = usePublicClient({ chainId: targetChain.id });
  const gate = contributionsEnabled();

  const [amount, setAmount] = useState("");
  const [ack, setAck] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState<Step>("form");

  const { writeContractAsync, data: txHash } = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash: txHash, chainId: targetChain.id, confirmations: 1, query: { enabled: !!txHash } });

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (receipt.data) {
      if (receipt.data.status === "success") {
        setStep("confirmed");
        refetch();
      } else {
        setError("Transaction reverted onchain. Your funds were not committed.");
        setStep("form");
        setBusy(false);
      }
    }
  }, [receipt.data, refetch]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const amountWei = useMemo(() => {
    try {
      return amount ? parseEther(amount) : 0n;
    } catch {
      return null;
    }
  }, [amount]);

  const units = campaign && amountWei && amountWei > 0n && campaign.weiPerUnit > 0n ? amountWei / campaign.weiPerUnit : 0n;

  const isOpen = campaign?.state === CampaignState.FundingOpen;

  const validation = useMemo(() => {
    if (!campaign || amountWei === null) return "Enter a valid ETH amount.";
    if (amountWei === 0n) return null;
    if (!isOpen) return `Funding is ${campaignStateLabel[campaign.state]}.`;
    if (amountWei % campaign.weiPerUnit !== 0n) return `Must be a multiple of ${eth(campaign.weiPerUnit)}.`;
    if (amountWei < campaign.minContributionWei) return `Minimum is ${eth(campaign.minContributionWei)}.`;
    if (campaign.maxPerWalletWei > 0n && campaign.userContributedWei + amountWei > campaign.maxPerWalletWei)
      return `Per-wallet maximum is ${eth(campaign.maxPerWalletWei)}.`;
    if (amountWei > campaign.remainingWei) return `Exceeds remaining capacity (${eth(campaign.remainingWei)}).`;
    if (amountWei > balanceWei) return "Exceeds your wallet balance.";
    return null;
  }, [campaign, amountWei, isOpen, balanceWei]);

  async function submit() {
    if (!campaign || !contract || !client || !address || !meta || amountWei === null || amountWei === 0n) return;
    if (validation) return setError(validation);
    if (!ack) return setError("Please acknowledge the conditional terms.");
    setBusy(true);
    setError(null);
    try {
      let eligibilityData: `0x${string}` = "0x";
      const api = complianceApiUrl();
      if (api) eligibilityData = await fetchEligibilityData(api, address, meta.campaignId, amountWei);
      const { request } = await client.simulateContract({
        account: address,
        address: contract,
        abi: campaignsAbi,
        functionName: "contribute",
        args: [meta.campaignId, units, eligibilityData],
        value: amountWei,
      });
      await writeContractAsync(request);
      setStep("submitted");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Transaction failed.";
      if (e instanceof EligibilityError) setError(msg);
      else if (/User rejected|denied/i.test(msg)) setError("Transaction rejected in wallet.");
      else if (/ExceedsCapacity/.test(msg)) setError("Filled while submitting — try a smaller amount.");
      else setError(msg.split("\n")[0].slice(0, 160));
      setBusy(false);
    }
  }

  const explorer = txHash ? explorerTxUrl(txHash) : null;

  return (
    <div className="rounded-2xl border border-line bg-surface p-6 shadow-float">
      {step === "confirmed" ? (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-lime text-ink">
            <Check className="h-6 w-6" strokeWidth={2.5} />
          </span>
          <h3 className="mt-4 font-serif text-2xl text-ink">Contribution confirmed</h3>
          <p className="mt-2 text-[0.9rem] leading-relaxed text-muted">
            Your contribution is held under the campaign&rsquo;s escrow conditions. Property acquisition and final
            participation issuance remain pending.
          </p>
          {explorer && (
            <a href={explorer} target="_blank" rel="noopener noreferrer" className="focus-lime mt-4 inline-flex items-center gap-1.5 text-[0.85rem] text-ink">
              View on Blockscout <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
          <Link href="/portfolio" className="focus-lime mt-5 flex w-full items-center justify-center gap-1.5 rounded-xl bg-ink py-3 text-sm font-medium text-surface hover:bg-lime hover:text-ink transition-colors">
            View portfolio <ArrowRight className="h-4 w-4" strokeWidth={2} />
          </Link>
        </motion.div>
      ) : step === "submitted" ? (
        <div className="text-center">
          <span className="mx-auto block h-10 w-10 animate-spin rounded-full border-2 border-line border-t-ink" />
          <h3 className="mt-4 font-serif text-xl text-ink">Confirming…</h3>
          <p className="mt-2 text-[0.85rem] text-muted">Awaiting the transaction receipt on {targetChain.name}.</p>
          {explorer && (
            <a href={explorer} target="_blank" rel="noopener noreferrer" className="focus-lime mt-3 inline-flex items-center gap-1.5 text-[0.85rem] text-ink">
              Track on Blockscout <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      ) : (
        <>
          <h3 className="font-serif text-xl text-ink">Contribute</h3>
          <p className="mt-1 text-[0.82rem] text-muted">
            You are making a conditional contribution toward a proposed acquisition. You do not receive completed
            property ownership at this stage.
          </p>

          {!gate.enabled ? (
            <div className="mt-5 flex items-start gap-2 rounded-xl border border-line bg-bg2/50 p-4 text-[0.85rem] text-muted">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#b07a1a]" />
              {gate.reason} Onchain contributions are disabled until this is configured.
            </div>
          ) : !mounted || !connected ? (
            <button onClick={openConnect} className="focus-lime mt-5 w-full rounded-xl bg-ink py-3.5 text-sm font-medium text-surface hover:bg-lime hover:text-ink transition-colors">
              Connect wallet
            </button>
          ) : !chainOk ? (
            <div className="mt-5 rounded-xl border border-line bg-bg2/50 p-4 text-[0.85rem] text-muted">
              Switch your wallet to {targetChain.name} (chain {targetChain.id}) to contribute.
            </div>
          ) : (
            <>
              <label htmlFor="contrib" className="mt-5 block text-[0.8rem] text-muted">
                Amount {campaign ? `(multiples of ${eth(campaign.weiPerUnit)})` : ""}
              </label>
              <div className="mt-2 flex items-center rounded-xl border border-line-strong bg-white px-4 focus-within:border-ink/40">
                <input
                  id="contrib"
                  type="text"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value.trim());
                    if (error) setError(null);
                  }}
                  placeholder="0.05"
                  className="w-full bg-transparent py-3 text-lg text-ink outline-none placeholder:text-muted/40"
                />
                <span className="pl-2 text-sm text-muted">ETH</span>
              </div>
              <p className="mt-1.5 text-[0.72rem] text-muted">{units > 0n ? `${units} proposed participation units` : "—"}</p>

              <dl className="mt-4 space-y-1.5 border-t border-line pt-4 text-[0.8rem]">
                <Field2 k="Your wallet" v={eth(balanceWei)} />
                {campaign && <Field2 k="Deadline" v={campaign.closingTime > 0n ? new Date(Number(campaign.closingTime) * 1000).toUTCString().slice(5, 16) : "—"} />}
                <Field2 k="Escrow" v={shortAddress(contract ?? "")} mono />
              </dl>

              <label className="mt-4 flex cursor-pointer items-start gap-2.5 text-[0.78rem] leading-relaxed text-ink/75">
                <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#10110f]" />
                I understand this is a conditional contribution held in escrow, that the property is not yet acquired, that
                I do not receive ownership now, and that refunds apply under the stated conditions.
              </label>

              {error && <p className="mt-3 text-[0.82rem] text-[#b4442f]" role="alert">{error}</p>}

              <button
                onClick={submit}
                disabled={busy || !amountWei || amountWei === 0n || !!validation || !ack}
                className="focus-lime mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-ink py-3.5 text-sm font-medium text-surface transition-colors hover:bg-lime hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy ? "Simulating…" : "Review in wallet"}
                {!busy && <ArrowRight className="h-4 w-4" strokeWidth={2} />}
              </button>
              <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[0.68rem] text-muted">
                <ShieldCheck className="h-3.5 w-3.5 text-lime" /> Funds held in escrow · refundable under stated conditions
              </p>
            </>
          )}
        </>
      )}
    </div>
  );
}

/* --------------------------- small bits --------------------------- */

function StatusPill({ state, configured }: { state: CampaignState; configured: boolean }) {
  if (!configured) return <span className="rounded-full bg-sand/40 px-3 py-1 text-[0.72rem] font-medium text-ink/70">Preview</span>;
  const open = state === CampaignState.FundingOpen;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[0.72rem] font-medium ${open ? "bg-lime text-ink" : "bg-ink/[0.06] text-ink/70"}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${open ? "bg-ink pulse-dot" : "bg-stone"}`} />
      {campaignStateLabel[state]}
    </span>
  );
}

function Field({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <p className="text-[0.66rem] uppercase tracking-wider text-muted">{k}</p>
      <p className="mt-0.5 font-medium text-ink">{v}</p>
    </div>
  );
}
function Field2({ k, v, mono = false }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted">{k}</dt>
      <dd className={mono ? "font-mono text-[0.75rem] text-ink/80" : "text-ink/80"}>{v}</dd>
    </div>
  );
}
function InfoGrid({ title, rows }: { title: string; rows: [string, string][] }) {
  return (
    <section>
      <h2 className="text-[0.95rem] font-semibold text-ink">{title}</h2>
      <div className="mt-3 grid gap-x-8 gap-y-3 rounded-2xl border border-line bg-surface p-5 sm:grid-cols-2">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-center justify-between gap-4 text-[0.85rem]">
            <span className="text-muted">{k}</span>
            <span className="text-right font-medium text-ink">{v}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
function ListBlock({ title, items, tone }: { title: string; items: string[]; tone?: "muted" }) {
  return (
    <section>
      <h2 className="text-[0.95rem] font-semibold text-ink">{title}</h2>
      <ul className="mt-3 space-y-2">
        {items.map((it) => (
          <li key={it} className={`flex gap-2.5 text-[0.88rem] leading-relaxed ${tone === "muted" ? "text-muted" : "text-ink/80"}`}>
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-lime" />
            {it}
          </li>
        ))}
      </ul>
    </section>
  );
}
function RefRow({ label, address }: { label: string; address: string | null }) {
  const url = address ? explorerAddressUrl(address) : null;
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted">{label}</span>
      <span className="flex items-center gap-1.5">
        <span className="font-mono text-[0.75rem] text-ink/80">{address ? shortAddress(address) : "—"}</span>
        {url && (
          <a href={url} target="_blank" rel="noopener noreferrer" aria-label="On explorer" className="focus-lime text-muted hover:text-ink">
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </span>
    </div>
  );
}
