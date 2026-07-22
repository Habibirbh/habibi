"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { usePublicClient, useWriteContract, useWaitForTransactionReceipt, useAccount, useReadContract } from "wagmi";
import { parseEther } from "viem";
import { AlertTriangle, Check, ArrowRight, ExternalLink, MapPin, ShieldCheck, ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { Photo } from "@/components/ui/Photo";
import { Modal } from "@/components/ui/Modal";
import { media } from "@/lib/media";
import { useHabibi } from "./Web3Provider";
import { useCampaign, useContributionHistory } from "@/lib/web3/useCampaigns";
import {
  campaignBySlug,
  campaignsAbi,
  campaignsContractAddress,
  contributionsEnabled,
  criticalCampaignConfig,
  campaignStateLabel,
  CampaignState,
} from "@/lib/web3/campaigns";
import { PropertyIntelligenceSection } from "@/components/intelligence/PropertyIntelligenceSection";
import { complianceApiUrl } from "@/lib/web3/config";
import { fetchEligibilityData, EligibilityError } from "@/lib/web3/eligibility";
import { targetChain, explorerTxUrl, explorerAddressUrl } from "@/lib/web3/chains";
import { eth, bpsToPercent, shortAddress } from "@/lib/web3/format";
import { getPonsConfig, ponsTokenAbi } from "@/lib/web3/pons";

const CONDITIONAL_NOTICE =
  "This property has not yet been acquired. Contributions are conditional and remain subject to funding, due diligence, seller availability, acquisition closing, eligibility requirements, and the applicable participation terms.";

export function PropertyDetail({ slug }: { slug: string }) {
  const meta = campaignBySlug(slug);
  const { campaign, configured, isLoading } = useCampaign(meta);
  const [activeImgIdx, setActiveImgIdx] = useState(0);

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
      <div className="relative overflow-hidden rounded-[1.75rem] shadow-card group">
        <div className="aspect-[16/8] w-full relative">
          {(() => {
            const images = meta.config.approvedImages.length > 0
              ? meta.config.approvedImages.map((src) => ({ src, alt: meta.name, tone: "#2b3138" }))
              : [media[meta.image]];

            const nextImage = (e: React.MouseEvent) => {
              e.preventDefault();
              setActiveImgIdx((prev) => (prev + 1) % images.length);
            };
            const prevImage = (e: React.MouseEvent) => {
              e.preventDefault();
              setActiveImgIdx((prev) => (prev - 1 + images.length) % images.length);
            };

            return (
              <>
                {images.map((img, idx) => (
                  <motion.div
                    key={img.src}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: idx === activeImgIdx ? 1 : 0 }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0"
                    style={{ pointerEvents: idx === activeImgIdx ? "auto" : "none" }}
                  >
                    <Photo asset={img} sizes="100vw" zoom={false} className="h-full w-full" overlay="bg-gradient-to-t from-ink/70 via-ink/10 to-transparent" />
                  </motion.div>
                ))}

                {images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-surface/30 backdrop-blur-md border border-line/30 flex items-center justify-center text-surface hover:bg-surface/50 hover:text-ink transition-all duration-300 opacity-0 group-hover:opacity-100 z-20 cursor-pointer"
                      aria-label="Previous image"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-surface/30 backdrop-blur-md border border-line/30 flex items-center justify-center text-surface hover:bg-surface/50 hover:text-ink transition-all duration-300 opacity-0 group-hover:opacity-100 z-20 cursor-pointer"
                      aria-label="Next image"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>

                    <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
                      {images.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={(e) => {
                            e.preventDefault();
                            setActiveImgIdx(idx);
                          }}
                          className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${idx === activeImgIdx ? "w-6 bg-lime" : "w-2 bg-surface/50"}`}
                          aria-label={`Go to slide ${idx + 1}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            );
          })()}
        </div>
        <span className="absolute left-4 top-4 rounded-full bg-ink/70 px-3 py-1 text-[0.68rem] font-medium text-surface backdrop-blur z-20">
          {meta.mediaRightsStatus}
        </span>
        <div className="absolute inset-x-5 bottom-5 text-surface z-20">
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

          {/* onchain activity */}
          {configured && <TxHistory campaignId={meta.campaignId} />}

          {/* Habibi Intelligence Section */}
          <PropertyIntelligenceSection propertySlug={meta.slug} />
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
  const { mounted, connected, chainOk, balanceWei, openConnect, pons } = useHabibi();
  const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
  const { campaign, refetch } = useCampaign(meta);
  const client = usePublicClient({ chainId: targetChain.id });
  const gate = contributionsEnabled();
  const ponsConfig = getPonsConfig();
  console.log("DEBUG PONS CONFIG:", ponsConfig, "campaign:", campaign);

  const [assetType, setAssetType] = useState<"ETH" | "PONS">("ETH");
  const [amount, setAmount] = useState("");
  const [ack, setAck] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState<Step>("form");
  const [reviewOpen, setReviewOpen] = useState(false);
  const [gasEstimate, setGasEstimate] = useState<bigint | null>(null);
  const [demoTxHash, setDemoTxHash] = useState<`0x${string}` | null>(null);
  const [demoAllowance, setDemoAllowance] = useState(0n);

  const balanceWeiToUse = assetType === "ETH"
    ? (isDemo ? parseEther("100") : balanceWei)
    : (isDemo ? parseEther("50000") : pons.balance);

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: ponsConfig.address || undefined,
    abi: ponsTokenAbi,
    functionName: "allowance",
    args: address && contract ? [address, contract] : undefined,
    query: { enabled: !!address && !!contract && !!ponsConfig.address && ponsConfig.enabled && assetType === "PONS", refetchInterval: 5_000 },
  });

  const { writeContractAsync, data: txHash } = useWriteContract();
  const { writeContractAsync: approveTokenAsync } = useWriteContract();

  const finalTxHash = isDemo ? demoTxHash : txHash;
  const receipt = useWaitForTransactionReceipt({ hash: txHash, chainId: targetChain.id, confirmations: 1, query: { enabled: !!txHash } });

  // Default asset type based on campaign config
  useEffect(() => {
    if (campaign) {
      if (campaign.acceptedAsset && ponsConfig.address && campaign.acceptedAsset.toLowerCase() === ponsConfig.address.toLowerCase()) {
        setAssetType("PONS");
      } else {
        setAssetType("ETH");
      }
    }
  }, [campaign, ponsConfig.address]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (receipt.data) {
      if (receipt.data.status === "success") {
        setStep("confirmed");
        setReviewOpen(false);
        refetch();
      } else {
        setError("Transaction reverted onchain. Your funds were not committed.");
        setStep("form");
        setBusy(false);
      }
    }
  }, [receipt.data, refetch]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const formatAsset = (val: bigint) => {
    if (assetType === "ETH") return eth(val);
    const dec = ponsConfig.decimals;
    return `${(Number(val) / 10**dec).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })} ${ponsConfig.symbol}`;
  };

  const amountWei = useMemo(() => {
    try {
      return amount ? parseEther(amount) : 0n;
    } catch {
      return null;
    }
  }, [amount]);

  const units = campaign && amountWei && amountWei > 0n && campaign.weiPerUnit > 0n ? amountWei / campaign.weiPerUnit : 0n;

  const isOpen = campaign?.state === CampaignState.FundingOpen;
  const critical = campaign ? criticalCampaignConfig(campaign) : { valid: false, reason: "Loading…" };

  const validation = useMemo(() => {
    if (!campaign || amountWei === null) return `Enter a valid ${assetType} amount.`;
    if (amountWei === 0n) return null;
    if (!isOpen) return `Funding is ${campaignStateLabel[campaign.state]}.`;
    const isCampaignPons = campaign.acceptedAsset.toLowerCase() !== "0x0000000000000000000000000000000000000000";
    if (assetType === "PONS" && !isCampaignPons) {
      return `This campaign only accepts ETH contributions onchain.`;
    }
    if (assetType === "ETH" && isCampaignPons) {
      return `This campaign only accepts ${ponsConfig.symbol} contributions onchain.`;
    }
    if (amountWei % campaign.weiPerUnit !== 0n) return `Must be a multiple of ${formatAsset(campaign.weiPerUnit)}.`;
    if (amountWei < campaign.minContributionWei) return `Minimum is ${formatAsset(campaign.minContributionWei)}.`;
    if (campaign.maxPerWalletWei > 0n && campaign.userContributedWei + amountWei > campaign.maxPerWalletWei)
      return `Per-wallet maximum is ${formatAsset(campaign.maxPerWalletWei)}.`;
    if (amountWei > campaign.remainingWei) return `Exceeds remaining capacity (${formatAsset(campaign.remainingWei)}).`;
    if (amountWei > balanceWeiToUse) return "Exceeds your wallet balance.";
    if (assetType === "PONS" && !pons.valid) return `PONS configuration is invalid: ${pons.reason || "unknown error"}`;
    return null;
  }, [campaign, amountWei, isOpen, balanceWeiToUse, assetType, pons.valid, pons.reason, ponsConfig.symbol]);

  const currentAllowance = isDemo ? demoAllowance : (allowance ?? 0n);
  const needsApproval = assetType === "PONS" && amountWei !== null && currentAllowance < amountWei;

  async function handleApprove() {
    if (!ponsConfig.address || !contract || !amountWei) return;
    setBusy(true);
    setError(null);
    if (isDemo) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setDemoAllowance(1000000000000000000000000n);
      setBusy(false);
      return;
    }
    try {
      const tx = await approveTokenAsync({
        address: ponsConfig.address,
        abi: ponsTokenAbi,
        functionName: "approve",
        args: [contract, amountWei],
      });
      await client?.waitForTransactionReceipt({ hash: tx });
      refetchAllowance();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Approval failed.");
    } finally {
      setBusy(false);
    }
  }

  // Step 1: validate + estimate gas, then open the transaction review modal.
  async function openReview() {
    if (!campaign || !contract || !client || !address || !meta || amountWei === null || amountWei === 0n) return;
    if (validation) return setError(validation);
    setError(null);
    setGasEstimate(null);
    setReviewOpen(true);
    if (isDemo) {
      setGasEstimate(120000n);
      return;
    }
    try {
      const gas = await client.estimateContractGas({
        account: address,
        address: contract,
        abi: campaignsAbi,
        functionName: "contribute",
        args: assetType === "ETH"
          ? [meta.campaignId, units, "0x"]
          : [meta.campaignId, amountWei, units, "0x"],
        value: assetType === "ETH" ? amountWei : 0n,
      });
      setGasEstimate(gas);
    } catch {
      /* estimate best-effort; confirmation still simulates */
    }
  }

  // Step 2: from the review modal — simulate immediately before signing, sign,
  // and wait for the confirmed receipt (§3). Never mark success early (§5).
  async function confirm() {
    if (!campaign || !contract || !client || !address || !meta || amountWei === null || amountWei === 0n) return;
    if (validation) return setError(validation);
    if (!ack) return setError("Please acknowledge the terms.");
    setBusy(true);
    setError(null);
    if (isDemo) {
      try {
        setStep("submitted");
        await new Promise((resolve) => setTimeout(resolve, 2000));
        const mockHash = ("0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")) as `0x${string}`;
        setDemoTxHash(mockHash);

        // Update localStorage
        const current = localStorage.getItem(`demo_contrib_${meta.slug}_${address}`);
        const nextVal = (current ? BigInt(current) : 0n) + amountWei;
        localStorage.setItem(`demo_contrib_${meta.slug}_${address}`, nextVal.toString());

        setStep("confirmed");
        setReviewOpen(false);
        refetch();
        setBusy(false);
      } catch {
        setError("Failed to simulate contribution.");
        setBusy(false);
      }
      return;
    }
    try {
      let eligibilityData: `0x${string}` = "0x";
      const api = complianceApiUrl();
      if (api) eligibilityData = await fetchEligibilityData(api, address, meta.campaignId, amountWei);
      const { request } = await client.simulateContract({
        account: address,
        address: contract,
        abi: campaignsAbi,
        functionName: "contribute",
        args: assetType === "ETH"
          ? [meta.campaignId, units, eligibilityData]
          : [meta.campaignId, amountWei, units, eligibilityData],
        value: assetType === "ETH" ? amountWei : 0n,
      });
      await writeContractAsync(request);
      setStep("submitted");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Transaction failed.";
      if (e instanceof EligibilityError) setError(msg);
      else if (/User rejected|denied/i.test(msg)) setError("Transaction rejected in wallet.");
      else if (/ExceedsCapacity/.test(msg)) setError("Filled while submitting — try a smaller amount.");
      else if (/insufficient funds/i.test(msg)) setError(`Insufficient ${assetType} for amount plus gas.`);
      else setError(msg.split("\n")[0].slice(0, 160));
      setBusy(false);
    }
  }

  const explorer = finalTxHash ? explorerTxUrl(finalTxHash) : null;

  return (
    <div className="rounded-2xl border border-line bg-surface p-6 shadow-float">
      {step === "confirmed" ? (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-lime text-ink">
            <Check className="h-6 w-6" strokeWidth={2.5} />
          </span>
          <h3 className="mt-4 font-serif text-2xl text-ink">Contribution confirmed</h3>
          <p className="mt-2 text-[0.9rem] leading-relaxed text-muted">
            Your contribution has been recorded onchain and remains subject to the campaign&rsquo;s escrow, funding and
            acquisition conditions.
          </p>
          <dl className="mx-auto mt-4 max-w-xs space-y-1.5 rounded-xl border border-line bg-bg2/40 p-4 text-left text-[0.82rem]">
            <Field2 k={`${assetType} contributed`} v={formatAsset(amountWei ?? 0n)} />
            <Field2 k="Proposed units" v={units.toString()} />
            {campaign && <Field2 k="Funding now" v={bpsToPercent(campaign.bps)} />}
            {finalTxHash && <Field2 k="Tx" v={shortAddress(finalTxHash)} mono />}
          </dl>
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
          <p className="mt-1 text-[0.82rem] text-muted mb-4">
            You are making a conditional contribution toward a proposed acquisition. You do not receive completed
            property ownership at this stage.
          </p>

          {ponsConfig.enabled && campaign && (
            <div className="mb-4 flex gap-2 rounded-xl bg-bg2 p-1 border border-line">
              <button
                type="button"
                onClick={() => setAssetType("ETH")}
                className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  assetType === "ETH"
                    ? "bg-surface text-ink shadow-sm font-semibold"
                    : "text-muted hover:text-ink disabled:opacity-30"
                }`}
              >
                ETH
              </button>
              <button
                type="button"
                onClick={() => setAssetType("PONS")}
                disabled={!ponsConfig.address}
                className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  assetType === "PONS"
                    ? "bg-surface text-ink shadow-sm font-semibold"
                    : "text-muted hover:text-ink disabled:opacity-30"
                }`}
              >
                {ponsConfig.symbol}
              </button>
            </div>
          )}

          {!gate.enabled ? (
            <div className="mt-5 flex items-start gap-2 rounded-xl border border-line bg-bg2/50 p-4 text-[0.85rem] text-muted">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#b07a1a]" />
              {gate.reason} Onchain contributions are disabled until this is configured.
            </div>
          ) : campaign && !critical.valid ? (
            <div className="mt-5 flex items-start gap-2 rounded-xl border border-line bg-bg2/50 p-4 text-[0.85rem] text-muted">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#b07a1a]" />
              {critical.reason} Contributions are disabled.
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
                Amount {campaign ? `(multiples of ${formatAsset(campaign.weiPerUnit)})` : ""}
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
                <span className="pl-2 text-sm text-muted">{assetType}</span>
              </div>
              <p className="mt-1.5 text-[0.72rem] text-muted">{units > 0n ? `${units} proposed participation units` : "—"}</p>

              <dl className="mt-4 space-y-1.5 border-t border-line pt-4 text-[0.8rem]">
                <Field2 k="Your wallet" v={formatAsset(balanceWeiToUse)} />
                {campaign && <Field2 k="Deadline" v={campaign.closingTime > 0n ? new Date(Number(campaign.closingTime) * 1000).toUTCString().slice(5, 16) : "—"} />}
                <Field2 k="Escrow" v={shortAddress(contract ?? "")} mono />
              </dl>

              {(validation && amount && amountWei !== 0n) ? (
                <p className="mt-3 text-[0.82rem] text-[#b4442f]" role="alert">{validation}</p>
              ) : error ? (
                <p className="mt-3 text-[0.82rem] text-[#b4442f]" role="alert">{error}</p>
              ) : null}

              {needsApproval ? (
                <button
                  onClick={handleApprove}
                  disabled={busy || !amountWei || amountWei === 0n || !!validation}
                  className="focus-lime mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-ink py-3.5 text-sm font-medium text-surface transition-colors hover:bg-lime hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {busy ? "Approving..." : `Approve ${ponsConfig.symbol}`}
                  <ArrowRight className="h-4 w-4" strokeWidth={2} />
                </button>
              ) : (
                <button
                  onClick={openReview}
                  disabled={busy || !amountWei || amountWei === 0n || !!validation}
                  className="focus-lime mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-ink py-3.5 text-sm font-medium text-surface transition-colors hover:bg-lime hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Contribute to campaign
                  <ArrowRight className="h-4 w-4" strokeWidth={2} />
                </button>
              )}
              <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[0.68rem] text-muted">
                <ShieldCheck className="h-3.5 w-3.5 text-lime" /> Funds held in escrow · refundable under stated conditions
              </p>
            </>
          )}
        </>
      )}

      {/* Transaction review modal (§3) */}
      {campaign && meta && (
        <Modal open={reviewOpen} onClose={() => !busy && setReviewOpen(false)} labelledBy="review-title" className="max-w-md">
          <div className="p-6">
            <h3 id="review-title" className="font-serif text-xl text-surface">Review contribution</h3>
            <p className="mt-1 text-[0.8rem] text-surface/55">Confirm the details before signing in your wallet.</p>
            <dl className="mt-5 space-y-2 text-[0.85rem]">
              <RField k="Campaign" v={meta.name} />
              <RField k="Contribution" v={formatAsset(amountWei ?? 0n)} />
              <RField k="Proposed units" v={units.toString()} />
              <RField k="Escrow" v={shortAddress(contract ?? "")} mono />
              <RField k="Deadline" v={campaign.closingTime > 0n ? new Date(Number(campaign.closingTime) * 1000).toUTCString().slice(5, 22) + " UTC" : "—"} />
              <RField k="Remaining capacity" v={formatAsset(campaign.remainingWei)} />
              <RField k="Estimated gas" v={gasEstimate !== null ? `${gasEstimate.toString()} units` : "estimating…"} />
            </dl>
            <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-[0.76rem] leading-relaxed text-surface/60">
              <p className="font-medium text-surface/80">Refund conditions</p>
              <ul className="mt-1.5 space-y-1">
                {meta.refundConditions.map((r) => (
                  <li key={r} className="flex gap-1.5"><span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-lime" />{r}</li>
                ))}
              </ul>
            </div>
            <label className="mt-4 flex cursor-pointer items-start gap-2.5 text-[0.78rem] leading-relaxed text-surface/75">
              <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#c8ff18]" />
              I understand this is a conditional contribution held in escrow, that the property is not yet acquired, that I
              do not receive ownership now, and that refunds apply under the stated conditions.
            </label>
            {error && <p className="mt-3 text-[0.82rem] text-[#ff8a6b]" role="alert">{error}</p>}
            <div className="mt-5 flex gap-3">
              <button onClick={() => !busy && setReviewOpen(false)} disabled={busy} className="focus-lime flex-1 rounded-xl border border-white/15 py-3 text-sm font-medium text-surface hover:bg-white/5 disabled:opacity-50">
                Cancel
              </button>
              <button onClick={confirm} disabled={busy || !ack} className="focus-lime flex-1 rounded-xl bg-lime py-3 text-sm font-semibold text-ink hover:bg-[#b5e612] disabled:opacity-50 disabled:cursor-not-allowed">
                {busy ? "Signing…" : "Confirm"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function TxHistory({ campaignId }: { campaignId: bigint }) {
  const history = useContributionHistory({ campaignId });
  return (
    <section>
      <h2 className="text-[0.95rem] font-semibold text-ink">Onchain activity</h2>
      {history.isLoading ? (
        <p className="mt-3 text-[0.85rem] text-muted">Reading contribution events…</p>
      ) : !history.data || history.data.length === 0 ? (
        <p className="mt-3 rounded-2xl border border-dashed border-line-strong p-5 text-[0.85rem] text-muted">
          No contributions recorded onchain yet.
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-line rounded-2xl border border-line bg-surface">
          {history.data.slice(0, 12).map((t) => {
            const url = explorerTxUrl(t.txHash);
            return (
              <li key={`${t.txHash}-${t.logIndex}`} className="flex items-center justify-between gap-3 px-5 py-3 text-[0.84rem]">
                <span className="min-w-0">
                  <span className="block text-ink/80">{eth(t.amountWei)}</span>
                  <span className="block truncate font-mono text-[0.7rem] text-muted">
                    {shortAddress(t.contributor)} · block {t.blockNumber.toString()}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-3">
                  <span className="text-muted">{t.proposedUnits.toString()} units</span>
                  {url && (
                    <a href={url} target="_blank" rel="noopener noreferrer" aria-label="Transaction on Blockscout" className="focus-lime text-muted hover:text-ink">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function RField({ k, v, mono = false }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-surface/50">{k}</dt>
      <dd className={mono ? "font-mono text-[0.78rem] text-surface/85" : "text-right text-surface/85"}>{v}</dd>
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
