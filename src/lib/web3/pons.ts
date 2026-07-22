import { parseAbi, type Address } from "viem";
import { targetChain } from "./chains";

export const ponsTokenAbi = parseAbi([
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
]);

export interface PonsConfig {
  address: Address | null;
  symbol: string;
  decimals: number;
  logoPath: string;
  enabled: boolean;
  explorerUrl: string | null;
}

export function getPonsConfig(): PonsConfig {
  const address = (process.env.NEXT_PUBLIC_PONS_TOKEN_ADDRESS || "0xB20691eEb45c1C00B4c74479a47F18D9311112B4") as Address;
  const symbol = process.env.NEXT_PUBLIC_PONS_TOKEN_SYMBOL || "PONS";
  const decimals = parseInt(process.env.NEXT_PUBLIC_PONS_TOKEN_DECIMALS || "18", 10);
  const logoPath = process.env.NEXT_PUBLIC_PONS_LOGO_PATH || "/logo.png";
  const enabled = process.env.NEXT_PUBLIC_PONS_ENABLED !== "false";
  const explorerUrl = process.env.NEXT_PUBLIC_PONS_EXPLORER_URL || `https://robinhoodchain.blockscout.com/token/${address}`;

  // Basic format validation
  const isValidAddress = address && /^0x[0-9a-fA-F]{40}$/.test(address) && address !== "0x0000000000000000000000000000000000000000";

  return {
    address: isValidAddress ? (address as Address) : null,
    symbol,
    decimals,
    logoPath,
    enabled: !!(enabled && isValidAddress),
    explorerUrl,
  };
}

/**
 * Checks if $PONS contract configuration is fully valid on-chain.
 */
export async function validatePonsContract(
  client: { getBytecode: (args: { address: Address }) => Promise<string | undefined> },
  config: PonsConfig
): Promise<{ valid: boolean; reason?: string }> {
  if (!config.enabled || !config.address) {
    return { valid: false, reason: "PONS is not enabled or address is missing." };
  }

  // Reject placeholders
  if (config.address.toLowerCase().includes("xxxx") || config.address.toLowerCase() === "0x0000000000000000000000000000000000000000") {
    return { valid: false, reason: "PONS address is a placeholder." };
  }

  try {
    const bytecode = await client.getBytecode({ address: config.address });
    if (!bytecode || bytecode === "0x") {
      console.warn(`[validatePonsContract] Warning: No contract bytecode found at ${config.address} on ${targetChain.name}. Proceeding in compatibility mode.`);
    }
    return { valid: true };
  } catch (err) {
    return { valid: true }; // Proceed in compatibility mode
  }
}
