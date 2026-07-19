"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { usePublicClient, useWriteContract, useWaitForTransactionReceipt, useAccount } from "wagmi";
import { parseEther } from "viem";
import { X, Check, ArrowRight, ExternalLink, AlertTriangle } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Photo } from "@/components/ui/Photo";
import { media } from "@/lib/media";
import { poolsAbi, poolsContractAddress, complianceApiUrl } from "@/lib/web3/config";
import { fetchEligibilityData, EligibilityError } from "@/lib/web3/eligibility";
import { targetChain, explorerTxUrl } from "@/lib/web3/chains";
import { usePools } from "@/lib/web3/hooks";
import { useHabibi } from "./Web3Provider";
import { poolBySlug, PoolStatus, poolStatusLabel } from "@/lib/web3/pools";
import { eth, bpsToPercent, shortAddress } from "@/lib/web3/format";

type Step = "form" | "submitted" | "confirmed";

export function PurchaseModal({ slug, onClose }: { slug: string | null; onClose: () => void }) {
  const meta = slug ? poolBySlug(slug) : undefined;
  const contract = poolsContractAddress();
  const { address } = useAccount();
  const { balanceWei, chainOk, purchases } = useHabibi();
  const { pools, refetch } = usePools();
  const client = usePublicClient({ chainId: targetChain.id });

  const pool = pools.find((p) => p.meta.slug === slug);

  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [gasEstimate, setGasEstimate] = useState<bigint | null>(null);
  const [step, setStep] = useState<Step>("form");
  const [busy, setBusy] = useState(false);

  const { writeContractAsync, data: txHash, reset: resetWrite } = useWriteContract();
  const receipt = useWaitForTransactionReceipt({
    hash: txHash,
    chainId: targetChain.id,
    confirmations: 1,
    query: { enabled: !!txHash },
  });

  // Reset when a different pool opens (adjust-state-on-prop-change pattern).
  const [prevSlug, setPrevSlug] = useState(slug);
  if (slug !== prevSlug) {
    setPrevSlug(slug);
    setAmount("");
    setError(null);
    setGasEstimate(null);
    setStep("form");
    setBusy(false);
    resetWrite();
  }

  // Advance to confirmed only when the receipt reports success (§30). The
  // receipt is an external-system signal, so state syncs from it in an effect.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (receipt.data) {
      if (receipt.data.status === "success") {
        setStep("confirmed");
        refetch();
      } else {
        setError("Transaction reverted onchain. No funds were taken beyond gas.");
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
      return null; // unparseable
    }
  }, [amount]);

  const unitsOut =
    pool && amountWei !== null && amountWei > 0n && pool.weiPerUnit > 0n
      ? amountWei / pool.weiPerUnit
      : 0n;

  const validation = useMemo(() => {
    if (!pool || amountWei === null) return "Enter a valid ETH amount.";
    if (amountWei === 0n) return null; // untouched
    if (pool.status !== PoolStatus.Open) return `Pool is ${poolStatusLabel[pool.status]}.`;
    if (pool.purchasesPaused) return "Purchases are paused for this pool.";
    if (amountWei % pool.weiPerUnit !== 0n)
      return `Amount must be a multiple of ${eth(pool.weiPerUnit)} (one unit).`;
    if (amountWei < pool.minContributionWei)
      return `Minimum contribution is ${eth(pool.minContributionWei)}.`;
    if (pool.maxPerWalletWei > 0n && pool.userContributedWei + amountWei > pool.maxPerWalletWei)
      return `Per-wallet maximum is ${eth(pool.maxPerWalletWei)}.`;
    if (amountWei > pool.remainingWei)
      return `Exceeds remaining capacity — the pool currently accepts at most ${eth(pool.remainingWei)}.`;
    if (amountWei > balanceWei) return "Amount exceeds your wallet balance.";
    return null;
  }, [pool, amountWei, balanceWei]);

  async function submit() {
    if (!pool || !contract || !client || !address || amountWei === null || amountWei === 0n) return;
    if (validation) {
      setError(validation);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      // Eligibility authorization (fail-closed when a compliance API is
      // configured; local/test chains run with enforcement unset).
      let eligibilityData: `0x${string}` = "0x";
      const api = complianceApiUrl();
      if (api) {
        eligibilityData = await fetchEligibilityData(api, address, pool.meta.poolId, amountWei);
      }
      // Refresh remaining capacity and simulate immediately before signing (§8, §15).
      const { request } = await client.simulateContract({
        account: address,
        address: contract,
        abi: poolsAbi,
        functionName: "purchase",
        args: [pool.meta.poolId, unitsOut, eligibilityData],
        value: amountWei,
      });
      const gas = await client.estimateContractGas({
        account: address,
        address: contract,
        abi: poolsAbi,
        functionName: "purchase",
        args: [pool.meta.poolId, unitsOut, eligibilityData],
        value: amountWei,
      });
      setGasEstimate(gas);
      await writeContractAsync(request);
      setStep("submitted");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Transaction failed.";
      if (e instanceof EligibilityError) setError(msg);
      else if (/User rejected|denied/i.test(msg)) setError("Transaction rejected in wallet.");
      else if (/ExceedsRemaining/.test(msg))
        setError("The pool filled while you were submitting — refresh and try a smaller amount.");
      else if (/insufficient funds/i.test(msg)) setError("Insufficient ETH for amount plus gas.");
      else setError(msg.split("\n")[0].slice(0, 200));
      setBusy(false);
    }
  }

  const explorer = txHash ? explorerTxUrl(txHash) : null;

  return (
    <Modal open={!!slug} onClose={onClose} labelledBy="purchase-title" className="max-w-lg">
      {meta && (
        <>
          <div className="relative h-28">
            <Photo
              asset={media[meta.image]}
              sizes="512px"
              zoom={false}
              className="h-full w-full"
              overlay="bg-gradient-to-t from-charcoal via-charcoal/40 to-transparent"
            />
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="focus-lime absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-ink/50 text-surface backdrop-blur transition-colors hover:bg-ink/70"
            >
              <X className="h-4 w-4" strokeWidth={1.75} />
            </button>
            <div className="absolute bottom-3 left-4">
              <p className="text-[0.7rem] text-surface/70">{meta.location}</p>
              <h2 id="purchase-title" className="font-serif text-xl leading-tight">
                {meta.name}
              </h2>
            </div>
          </div>

          <div className="p-6">
            {!pool ? (
              <p className="text-[0.9rem] text-surface/60">Loading onchain state…</p>
            ) : step === "confirmed" ? (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-center">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-lime text-ink">
                  <Check className="h-6 w-6" strokeWidth={2.5} />
                </span>
                <h3 className="mt-4 font-serif text-2xl">Purchase confirmed onchain</h3>
                <p className="mt-2 text-[0.9rem] text-surface/65">
                  {eth(amountWei ?? 0n)} → {unitsOut.toString()} participation units in {meta.name}.
                </p>
                <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-center justify-between text-[0.78rem] text-surface/60">
                    <span>Pool now filled</span>
                    <span className="text-lime">{bpsToPercent(pool.bps)}</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-lime" style={{ width: `${pool.bps / 100}%` }} />
                  </div>
                </div>
                {explorer && (
                  <a
                    href={explorer}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="focus-lime mt-4 inline-flex items-center gap-1.5 text-[0.85rem] text-lime"
                  >
                    View on Blockscout <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
                <div className="mt-5 flex gap-3">
                  <button type="button" onClick={onClose} className="focus-lime flex-1 rounded-xl border border-white/15 py-3 text-sm font-medium text-surface hover:bg-white/5">
                    Done
                  </button>
                  <a href="/portfolio" className="focus-lime flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-lime py-3 text-sm font-medium text-ink hover:-translate-y-0.5 transition-transform">
                    View portfolio <ArrowRight className="h-4 w-4" strokeWidth={2} />
                  </a>
                </div>
              </motion.div>
            ) : step === "submitted" ? (
              <div className="text-center">
                <span className="mx-auto block h-10 w-10 animate-spin rounded-full border-2 border-white/15 border-t-lime" />
                <h3 className="mt-4 font-serif text-xl">Waiting for confirmation…</h3>
                <p className="mt-2 text-[0.85rem] text-surface/60">
                  Your transaction has been submitted to {targetChain.name}. Success is only shown
                  once the receipt confirms.
                </p>
                {explorer && (
                  <a href={explorer} target="_blank" rel="noopener noreferrer" className="focus-lime mt-3 inline-flex items-center gap-1.5 text-[0.85rem] text-lime">
                    Track on Blockscout <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            ) : (
              <>
                {/* live fill from contract accounting */}
                <div className="flex items-center justify-between text-[0.78rem] text-surface/60">
                  <span>
                    {eth(pool.totalContributedWei)} raised of {eth(pool.fundingTargetWei)}
                  </span>
                  <span className="text-lime">{bpsToPercent(pool.bps)} filled</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-lime" style={{ width: `${pool.bps / 100}%` }} />
                </div>
                <p className="mt-1.5 text-[0.7rem] text-surface/45">
                  Remaining capacity {eth(pool.remainingWei)} · {pool.participantCount} participant
                  {pool.participantCount === 1 ? "" : "s"} · status {poolStatusLabel[pool.status]}
                </p>

                {!purchases.enabled ? (
                  <p className="mt-6 flex items-start gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-[0.85rem] text-surface/70">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-lime" />
                    {purchases.reason}
                  </p>
                ) : !chainOk ? (
                  <p className="mt-6 flex items-start gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-[0.85rem] text-surface/70">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-lime" />
                    Your wallet is not on {targetChain.name} (chain {targetChain.id}). Switch
                    networks to participate.
                  </p>
                ) : (
                  <>
                    <label htmlFor="purchase-amount" className="mt-6 block text-[0.8rem] text-surface/60">
                      Contribution (multiples of {eth(pool.weiPerUnit)} = 1 unit)
                    </label>
                    <div className="mt-2 flex items-center rounded-xl border border-white/15 bg-white/[0.04] px-4 focus-within:border-lime/60">
                      <input
                        id="purchase-amount"
                        type="text"
                        inputMode="decimal"
                        value={amount}
                        onChange={(e) => {
                          setAmount(e.target.value.trim());
                          if (error) setError(null);
                        }}
                        placeholder="0.05"
                        className="w-full bg-transparent py-3 text-lg text-surface outline-none placeholder:text-surface/30"
                      />
                      <span className="pl-2 text-sm text-surface/50">ETH</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[0.72rem] text-surface/45">
                      <span>{unitsOut > 0n ? `${unitsOut} participation units` : "—"}</span>
                      <span>Fiat estimate unavailable</span>
                    </div>

                    <dl className="mt-4 space-y-1.5 border-t border-white/10 pt-4 text-[0.8rem]">
                      <Row k="Your wallet balance" v={eth(balanceWei)} />
                      <Row k="Your prior contribution" v={eth(pool.userContributedWei)} />
                      <Row k="Treasury destination" v={shortAddress(pool.treasury)} mono />
                      <Row k="Contract" v={shortAddress(contract ?? "")} mono />
                      <Row k="Network" v={`${targetChain.name} (${targetChain.id})`} />
                      {gasEstimate !== null && <Row k="Estimated gas" v={`${gasEstimate.toString()} units`} />}
                    </dl>

                    {(error ?? (amountWei !== null && amountWei > 0n ? validation : null)) && (
                      <p className="mt-3 text-[0.82rem] text-[#ff8a6b]" role="alert">
                        {error ?? validation}
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={submit}
                      disabled={busy || !amountWei || amountWei === 0n || !!validation}
                      className="focus-lime mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-lime py-3.5 text-sm font-medium text-ink transition-transform duration-300 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {busy ? "Simulating…" : "Review in wallet"}
                      {!busy && <ArrowRight className="h-4 w-4" strokeWidth={2} />}
                    </button>
                    <p className="mt-3 text-center text-[0.68rem] leading-relaxed text-surface/40">
                      Blockchain transactions are irreversible. Your ETH is forwarded to the Habibi
                      treasury in the same transaction. Units are contract-recorded fractional
                      interests, not standalone legal title; participation is subject to the
                      applicable terms and eligibility.
                    </p>
                  </>
                )}
              </>
            )}
          </div>
        </>
      )}
    </Modal>
  );
}

function Row({ k, v, mono = false }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-surface/50">{k}</dt>
      <dd className={mono ? "font-mono text-[0.75rem] text-surface/80" : "text-surface/80"}>{v}</dd>
    </div>
  );
}
