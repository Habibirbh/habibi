"use client";

import { useConnect, useAccount, useSwitchChain, useChainId } from "wagmi";
import { Wallet, X, ShieldCheck, AlertTriangle } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { HabibiIcon } from "@/components/brand/Logo";
import { targetChain, APP_ENV } from "@/lib/web3/chains";

/**
 * Habibi-styled wallet connection (no generic kit styling). Lists available
 * EIP-1193 connectors; after connection, prompts a network switch/add if the
 * wallet is not on the target chain.
 */
export function ConnectWalletModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { connectors, connect, isPending, error } = useConnect();
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending: switching } = useSwitchChain();

  const wrongNetwork = isConnected && chainId !== targetChain.id;

  return (
    <Modal open={open} onClose={onClose} labelledBy="connect-title">
      <div className="lime-glow pointer-events-none absolute inset-x-0 top-0 h-40" />
      <div className="relative p-6 sm:p-8">
        <div className="flex items-start justify-between">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-lime/15 text-lime ring-1 ring-inset ring-lime/25">
            <Wallet className="h-5 w-5" strokeWidth={1.75} />
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="focus-lime -mr-1.5 -mt-1.5 rounded-full p-2 text-surface/60 transition-colors hover:bg-white/10 hover:text-surface"
          >
            <X className="h-5 w-5" strokeWidth={1.75} />
          </button>
        </div>

        <h2 id="connect-title" className="mt-5 font-serif text-[1.75rem] leading-tight tracking-tight">
          {wrongNetwork ? "Switch network" : "Connect your wallet"}
        </h2>

        {wrongNetwork ? (
          <>
            <p className="mt-3 flex items-start gap-2 text-[0.95rem] leading-relaxed text-surface/70">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-lime" strokeWidth={1.75} />
              Your wallet is on chain {chainId}. Habibi runs on {targetChain.name} (chain{" "}
              {targetChain.id}). Switch — or approve adding the network — to continue.
            </p>
            <button
              type="button"
              disabled={switching}
              onClick={() => switchChain({ chainId: targetChain.id })}
              className="focus-lime mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-lime py-3.5 text-sm font-medium text-ink transition-transform duration-300 hover:-translate-y-0.5 disabled:opacity-50"
            >
              {switching ? "Confirm in wallet…" : `Switch to ${targetChain.name}`}
            </button>
          </>
        ) : (
          <>
            <p className="mt-3 text-[0.95rem] leading-relaxed text-surface/70">
              Connect an EVM wallet on {targetChain.name} to participate in property pools and
              view your onchain portfolio.
            </p>
            <div className="mt-5 space-y-2">
              {connectors.map((c) => (
                <button
                  key={c.uid}
                  type="button"
                  disabled={isPending}
                  onClick={() => connect({ connector: c, chainId: targetChain.id }, { onSuccess: onClose })}
                  className="focus-lime flex w-full items-center justify-between rounded-xl border border-white/12 bg-white/[0.03] px-4 py-3.5 text-left text-[0.92rem] text-surface transition-colors hover:border-lime/40 hover:bg-white/[0.06] disabled:opacity-50"
                >
                  {c.name}
                  <span className="text-[0.7rem] text-surface/40">
                    {isPending ? "Waiting…" : "Connect"}
                  </span>
                </button>
              ))}
            </div>
            {error && (
              <p className="mt-3 text-[0.82rem] text-[#ff8a6b]" role="alert">
                {error.message.split("\n")[0]}
              </p>
            )}
            <p className="mt-4 flex items-center gap-1.5 text-xs text-surface/45">
              <ShieldCheck className="h-3.5 w-3.5 text-lime" strokeWidth={1.75} />
              Habibi never asks for your seed phrase.
              {APP_ENV !== "production" && " · Development build (local chain)."}
            </p>
          </>
        )}
      </div>

      <div className="flex items-center gap-2 border-t border-white/10 bg-white/[0.02] px-6 py-3.5 sm:px-8">
        <HabibiIcon className="h-5 w-5" onDark />
        <span className="text-xs text-surface/45">
          {targetChain.name} · chain {targetChain.id} · Habibi is not affiliated with Robinhood
        </span>
      </div>
    </Modal>
  );
}
