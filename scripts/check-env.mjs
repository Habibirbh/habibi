// Production environment validation (spec §22: "Reject placeholder values
// during production deployment"). Runs before every build; in development it
// is a no-op. A production build FAILS unless every required public variable
// is present, well-formed, and not a placeholder — so "insert real values and
// deploy" works, and anything less refuses to ship.
import { readFileSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

// minimal .env parser (no dependency): later files do NOT override earlier env
function loadEnvFile(name) {
  const p = path.join(root, name);
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]] === undefined) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
}
[".env.local", ".env.production", ".env"].forEach(loadEnvFile);

if (process.env.NEXT_PUBLIC_APP_ENV !== "production") {
  console.log("[check-env] development build — production checks skipped");
  process.exit(0);
}

const PLACEHOLDER = /REPLACE|PLACEHOLDER|CHANGEME|YOUR_|example|xxxx/i;
const problems = [];

function require_(name, validate) {
  const v = process.env[name];
  if (!v || v.trim() === "") return problems.push(`${name} is missing`);
  if (PLACEHOLDER.test(v)) return problems.push(`${name} looks like a placeholder: "${v}"`);
  if (validate && !validate(v)) return problems.push(`${name} is malformed: "${v}"`);
}

const isAddress = (v) => /^0x[0-9a-fA-F]{40}$/.test(v);
const isNonZeroAddress = (v) => isAddress(v) && !/^0x0{40}$/.test(v);
const isUrl = (v) => /^https:\/\/.+/.test(v);
const isLocalhost = (v) => /localhost|127\.0\.0\.1|0\.0\.0\.0|:8545/i.test(v || "");

require_("NEXT_PUBLIC_ROBINHOOD_RPC_URL", isUrl);
require_("NEXT_PUBLIC_PROPERTY_CONTRACT_ADDRESS", isNonZeroAddress);
require_("NEXT_PUBLIC_COMPLIANCE_API_URL", isUrl);
require_("NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID");
require_("NEXT_PUBLIC_BLOCK_EXPLORER_URL", isUrl);

if (process.env.NEXT_PUBLIC_ROBINHOOD_RPC_URL === "https://rpc.mainnet.chain.robinhood.com") {
  problems.push(
    "NEXT_PUBLIC_ROBINHOOD_RPC_URL is the public fallback — provision a production RPC endpoint",
  );
}

// Fail closed on localhost endpoints leaking into production (spec §4).
for (const name of [
  "NEXT_PUBLIC_ROBINHOOD_RPC_URL",
  "NEXT_PUBLIC_COMPLIANCE_API_URL",
  "NEXT_PUBLIC_SITE_URL",
  "RH_MAINNET_RPC_URL",
]) {
  if (isLocalhost(process.env[name])) problems.push(`${name} points at localhost in production`);
}

// The configured chain id must be Robinhood Chain mainnet (never a testnet id).
const chainId = process.env.CHAIN_ID ?? process.env.NEXT_PUBLIC_ROBINHOOD_CHAIN_ID;
if (chainId && chainId !== "4663") {
  problems.push(`CHAIN_ID must be 4663 for production; got "${chainId}"`);
}

// Reject the known local/test contract address and demo-mode flags (spec §4/§5).
if ((process.env.NEXT_PUBLIC_PROPERTY_CONTRACT_ADDRESS || "").toLowerCase() ===
    "0x5fbdb2315678afecb367f032d93f642f64180aa3") {
  problems.push("NEXT_PUBLIC_PROPERTY_CONTRACT_ADDRESS is the local anvil deployment address");
}
if (/^(1|true|on)$/i.test(process.env.NEXT_PUBLIC_DEMO_MODE || "")) {
  problems.push("NEXT_PUBLIC_DEMO_MODE must not be enabled in production");
}

if (problems.length) {
  console.error("[check-env] PRODUCTION BUILD REFUSED:\n  - " + problems.join("\n  - "));
  console.error(
    "\nA production build also presumes the DEPLOYMENT_GUIDE.md mainnet checklist " +
      "(audit, verified treasury/multisig/signer, real property parameters) is complete.",
  );
  process.exit(1);
}
console.log("[check-env] production environment OK");
