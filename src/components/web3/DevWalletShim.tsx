"use client";

import { useEffect } from "react";

/**
 * DEVELOPMENT-ONLY wallet shim.
 *
 * When running locally against anvil (which auto-unlocks its dev accounts),
 * this installs a minimal EIP-1193 provider at window.ethereum that forwards
 * every request to the local RPC. It lets the real wagmi `injected` connector
 * and the full simulate → sign → receipt flow run in a browser without an
 * extension. It is NOT a simulation of the app: transactions are real
 * transactions on the local chain.
 *
 * Isolation (spec §2): compiled out of production bundles by the NODE_ENV
 * check below and additionally gated on NEXT_PUBLIC_APP_ENV. It never
 * overrides a real wallet if one is present.
 */

const RPC = "http://127.0.0.1:8545";
// anvil dev account #2 (well-known public test key, no real value)
const DEV_ACCOUNT = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC";

export function DevWalletShim() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    if (process.env.NEXT_PUBLIC_APP_ENV === "production") return;
    const w = window as unknown as { ethereum?: unknown };
    if (w.ethereum) return; // never shadow a real wallet

    let id = 0;
    const listeners = new Map<string, Set<(...args: unknown[]) => void>>();

    async function rpc(method: string, params: unknown[] = []) {
      const res = await fetch(RPC, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: ++id, method, params }),
      });
      const json = await res.json();
      if (json.error) throw Object.assign(new Error(json.error.message), { code: json.error.code });
      return json.result;
    }

    w.ethereum = {
      isDevShim: true,
      request: async ({ method, params = [] }: { method: string; params?: unknown[] }) => {
        switch (method) {
          case "eth_requestAccounts":
          case "eth_accounts":
            return [DEV_ACCOUNT];
          case "wallet_switchEthereumChain":
          case "wallet_addEthereumChain":
            return null;
          case "personal_sign":
          case "eth_signTypedData_v4":
            throw Object.assign(new Error("Dev shim does not sign messages"), { code: 4200 });
          default:
            return rpc(method, params as unknown[]);
        }
      },
      on: (event: string, cb: (...args: unknown[]) => void) => {
        if (!listeners.has(event)) listeners.set(event, new Set());
        listeners.get(event)!.add(cb);
      },
      removeListener: (event: string, cb: (...args: unknown[]) => void) => {
        listeners.get(event)?.delete(cb);
      },
    };
  }, []);

  return null;
}
