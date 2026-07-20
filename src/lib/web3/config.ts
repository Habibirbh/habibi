import { http, createConfig } from "wagmi";
import { injected, coinbaseWallet, walletConnect } from "wagmi/connectors";
import { robinhoodChain, localChain, targetChain, APP_ENV } from "./chains";
import {
  habibiPropertyPoolsAbi,
  habibiPropertyPoolsDeployments,
} from "@/lib/contracts/habibiPropertyPools";

/**
 * Wallet connectors.
 *
 * Browser-extension wallets (MetaMask, Robinhood Wallet, Rabby, Phantom,
 * Binance, etc.) are surfaced automatically via EIP-6963 multi-injected
 * provider discovery (enabled below) — each announces itself as its own named
 * connector, so no wallet-specific SDK connector is needed. We intentionally
 * do NOT use the `metaMask()` SDK connector: it pulls in the MetaMask SDK
 * (`@metamask/connect-evm`) which fails to resolve under the Next bundler and
 * is redundant with EIP-6963 discovery.
 *
 *  - injected(): generic EIP-1193 fallback (and the dev-chain shim in local dev)
 *  - coinbaseWallet(): adds Coinbase's mobile QR path
 *  - walletConnect(): activates only when a project id is configured
 */
function connectors() {
  const list = [
    injected({ shimDisconnect: true }),
    coinbaseWallet({ appName: "Habibi" }),
  ];
  const wcId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
  if (wcId) {
    list.push(
      walletConnect({ projectId: wcId, metadata: { name: "Habibi", description: "Fractional access to curated UAE real estate", url: "https://habibi.example", icons: [] } }),
    );
  }
  return list;
}

export const wagmiConfig = createConfig({
  chains: APP_ENV === "production" ? [robinhoodChain] : [localChain, robinhoodChain],
  connectors: connectors(),
  // Surface installed extension wallets (MetaMask, Rabby, Phantom, …) as their
  // own named connectors without any wallet-specific SDK.
  multiInjectedProviderDiscovery: true,
  transports: {
    [robinhoodChain.id]: http(),
    [localChain.id]: http("http://127.0.0.1:8545"),
  },
  ssr: true,
});

export const poolsAbi = habibiPropertyPoolsAbi;

/**
 * Contract address resolution.
 * Production: NEXT_PUBLIC_PROPERTY_CONTRACT_ADDRESS (a verified deployment) is
 * REQUIRED — there is no fallback, and purchase UI stays disabled without it.
 * Development: the local deployment artifact.
 */
export function poolsContractAddress(): `0x${string}` | null {
  return habibiPropertyPoolsDeployments[targetChain.id]?.address ?? null;
}

export function poolsDeployBlock(): bigint {
  return BigInt(habibiPropertyPoolsDeployments[targetChain.id]?.deployBlock ?? 0);
}

/**
 * Compliance / eligibility integration.
 * Production purchases are HARD-DISABLED until the compliance API is
 * configured (spec §10): we never bypass eligibility on mainnet.
 */
export function complianceApiUrl(): string | null {
  return process.env.NEXT_PUBLIC_COMPLIANCE_API_URL ?? null;
}

export function purchasesEnabled(): { enabled: boolean; reason?: string } {
  if (!poolsContractAddress()) {
    return { enabled: false, reason: "Contract address not configured." };
  }
  if (APP_ENV === "production" && !complianceApiUrl()) {
    return {
      enabled: false,
      reason:
        "Participation is not yet open: eligibility verification is not configured for this deployment.",
    };
  }
  return { enabled: true };
}
