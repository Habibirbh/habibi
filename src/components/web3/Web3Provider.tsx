"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { WagmiProvider, useAccount, useBalance, useDisconnect, useChainId } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { wagmiConfig, purchasesEnabled } from "@/lib/web3/config";
import { targetChain } from "@/lib/web3/chains";
import { ConnectWalletModal } from "./ConnectWalletModal";
import { PurchaseModal } from "./PurchaseModal";
import { DevWalletShim } from "./DevWalletShim";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 5_000, retry: 2 } },
});

interface HabibiWeb3ContextValue {
  /** True after client mount — SSR renders the disconnected shell. */
  mounted: boolean;
  connected: boolean;
  address: `0x${string}` | null;
  balanceWei: bigint;
  /** Connected wallet is on the target chain (purchases require this). */
  chainOk: boolean;
  connectedChainId: number | null;
  purchases: { enabled: boolean; reason?: string };
  openConnect: () => void;
  disconnect: () => void;
  openPurchase: (slug: string) => void;
}

const Ctx = createContext<HabibiWeb3ContextValue | null>(null);

export function useHabibi() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useHabibi must be used within Web3Provider");
  return ctx;
}

function InnerProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [connectOpen, setConnectOpen] = useState(false);
  const [purchaseSlug, setPurchaseSlug] = useState<string | null>(null);

  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { disconnect } = useDisconnect();
  const balance = useBalance({
    address,
    chainId: targetChain.id,
    query: { enabled: !!address, refetchInterval: 12_000 },
  });

  // eslint-disable-next-line react-hooks/set-state-in-effect -- standard mount gate
  useEffect(() => setMounted(true), []);

  const chainOk = isConnected && chainId === targetChain.id;

  const openConnect = useCallback(() => setConnectOpen(true), []);
  const openPurchase = useCallback(
    (slug: string) => {
      if (!isConnected) {
        setConnectOpen(true);
        return;
      }
      setPurchaseSlug(slug);
    },
    [isConnected],
  );

  const value: HabibiWeb3ContextValue = {
    mounted,
    connected: mounted && isConnected,
    address: mounted && address ? address : null,
    balanceWei: balance.data?.value ?? 0n,
    chainOk: mounted && chainOk,
    connectedChainId: mounted ? chainId : null,
    purchases: purchasesEnabled(),
    openConnect,
    disconnect: () => disconnect(),
    openPurchase,
  };

  return (
    <Ctx.Provider value={value}>
      {children}
      <ConnectWalletModal open={connectOpen} onClose={() => setConnectOpen(false)} />
      <PurchaseModal slug={purchaseSlug} onClose={() => setPurchaseSlug(null)} />
    </Ctx.Provider>
  );
}

export function Web3Provider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <DevWalletShim />
        <InnerProvider>{children}</InnerProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
