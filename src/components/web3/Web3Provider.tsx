"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { WagmiProvider, useAccount, useBalance, useDisconnect, useChainId, usePublicClient, useReadContract } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { wagmiConfig, purchasesEnabled } from "@/lib/web3/config";
import { targetChain } from "@/lib/web3/chains";
import { ConnectWalletModal } from "./ConnectWalletModal";
import { DevWalletShim } from "./DevWalletShim";
import { getPonsConfig, ponsTokenAbi } from "@/lib/web3/pons";

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
  pons: {
    enabled: boolean;
    valid: boolean;
    reason?: string;
    balance: bigint;
    symbol: string;
    decimals: number;
    logoPath: string;
    address: `0x${string}` | null;
  };
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
  const [ponsValid, setPonsValid] = useState(false);
  const [ponsReason, setPonsReason] = useState<string | undefined>("Initializing...");

  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { disconnect } = useDisconnect();
  const publicClient = usePublicClient({ chainId: targetChain.id });

  const ponsConfig = getPonsConfig();

  const balance = useBalance({
    address,
    chainId: targetChain.id,
    query: { enabled: !!address, refetchInterval: 12_000 },
  });

  const ponsBalance = useReadContract({
    address: ponsConfig.address || undefined,
    abi: ponsTokenAbi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: targetChain.id,
    query: { enabled: !!address && !!ponsConfig.address && ponsConfig.enabled, refetchInterval: 12_000 },
  });

  // eslint-disable-next-line react-hooks/set-state-in-effect -- standard mount gate
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    async function checkPons() {
      if (!ponsConfig.enabled || !ponsConfig.address) {
        setPonsValid(false);
        setPonsReason("PONS is not enabled in configuration.");
        return;
      }
      if (!publicClient) {
        setPonsValid(false);
        setPonsReason("RPC client not initialized.");
        return;
      }
      try {
        const bytecode = await publicClient.getBytecode({ address: ponsConfig.address });
        if (!bytecode || bytecode === "0x") {
          setPonsValid(false);
          setPonsReason(`No bytecode at $PONS address ${ponsConfig.address}.`);
        } else {
          setPonsValid(true);
          setPonsReason(undefined);
        }
      } catch (err) {
        setPonsValid(false);
        setPonsReason(`Failed to query PONS contract: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    if (mounted) {
      checkPons();
    }
  }, [mounted, publicClient, ponsConfig.address, ponsConfig.enabled]);

  const chainOk = isConnected && chainId === targetChain.id;

  const openConnect = useCallback(() => setConnectOpen(true), []);

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
    pons: {
      enabled: ponsConfig.enabled,
      valid: ponsValid,
      reason: ponsReason,
      balance: (ponsBalance.data as bigint | undefined) ?? 0n,
      symbol: ponsConfig.symbol,
      decimals: ponsConfig.decimals,
      logoPath: ponsConfig.logoPath,
      address: ponsConfig.address,
    },
  };

  return (
    <Ctx.Provider value={value}>
      {children}
      <ConnectWalletModal open={connectOpen} onClose={() => setConnectOpen(false)} />
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
