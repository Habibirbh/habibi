import { defineChain } from "viem";
import { foundry } from "viem/chains";

/**
 * Robinhood Chain mainnet — the single reusable chain definition.
 * RPC: production endpoint from NEXT_PUBLIC_ROBINHOOD_RPC_URL; the public
 * endpoint is a FALLBACK only.
 *
 * Habibi is an independent application built on this network and is not
 * affiliated with, endorsed by, or partnered with Robinhood.
 */
export const robinhoodChain = defineChain({
  id: 4663,
  name: "Robinhood Chain",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: {
      http: [
        process.env.NEXT_PUBLIC_ROBINHOOD_RPC_URL ??
          "https://rpc.mainnet.chain.robinhood.com",
      ],
    },
  },
  blockExplorers: {
    default: {
      name: "Blockscout",
      url:
        process.env.NEXT_PUBLIC_BLOCK_EXPLORER_URL ??
        "https://robinhoodchain.blockscout.com",
    },
  },
});

/** Local Foundry/anvil chain for development. */
export const localChain = foundry;

export const APP_ENV =
  process.env.NEXT_PUBLIC_APP_ENV === "production" ? "production" : "development";

/**
 * The chain the app targets. Development targets the local anvil chain;
 * production targets Robinhood Chain (4663).
 */
export const targetChain = APP_ENV === "production" ? robinhoodChain : localChain;

export function explorerTxUrl(hash: string): string | null {
  const base = targetChain.blockExplorers?.default?.url;
  return base ? `${base}/tx/${hash}` : null;
}

export function explorerAddressUrl(address: string): string | null {
  const base = targetChain.blockExplorers?.default?.url;
  return base ? `${base}/address/${address}` : null;
}
