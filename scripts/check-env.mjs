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

// RPC endpoint. A dedicated endpoint is strongly preferred, but Robinhood Chain
// (4663) may only expose the shared public endpoint. For a preview-mode launch
// the operator can opt into the public RPC explicitly by setting
// NEXT_PUBLIC_ACCEPT_PUBLIC_RPC=true — a deliberate, documented choice, never a
// silent fallback. Without that opt-in the strict rule stands (see below).
const ACCEPT_PUBLIC_RPC = /^(1|true|on)$/i.test(process.env.NEXT_PUBLIC_ACCEPT_PUBLIC_RPC || "");
if (!ACCEPT_PUBLIC_RPC) {
  require_("NEXT_PUBLIC_ROBINHOOD_RPC_URL", isUrl);
} else if (process.env.NEXT_PUBLIC_ROBINHOOD_RPC_URL && !isUrl(process.env.NEXT_PUBLIC_ROBINHOOD_RPC_URL)) {
  problems.push(`NEXT_PUBLIC_ROBINHOOD_RPC_URL is malformed: "${process.env.NEXT_PUBLIC_ROBINHOOD_RPC_URL}"`);
}
// The live functional path is the conditional pre-acquisition campaign/escrow
// model (HabibiCampaigns). This is the contract the property page, portfolio,
// and admin all read/write, so it is the one the production build must require.
require_("NEXT_PUBLIC_CAMPAIGNS_CONTRACT_ADDRESS", isNonZeroAddress);
// The compliance API is a CAMPAIGN-ACTIVATION requirement, not a protocol/app
// DEPLOYMENT one: the site ships in preview mode with contributions closed, and
// contributionsEnabled() fail-closes on this at runtime before any contribution
// is possible. So it must NOT block the build. If set, it must still be a
// well-formed, non-localhost URL (localhost is caught by the loop below).
if (process.env.NEXT_PUBLIC_COMPLIANCE_API_URL && !isUrl(process.env.NEXT_PUBLIC_COMPLIANCE_API_URL)) {
  problems.push(`NEXT_PUBLIC_COMPLIANCE_API_URL is malformed: "${process.env.NEXT_PUBLIC_COMPLIANCE_API_URL}"`);
}
// WalletConnect is OPTIONAL: injected/extension wallets (MetaMask, Coinbase,
// Rabby, …) work via EIP-6963 discovery without it. It only adds the WalletConnect
// mobile-QR path. Warn if absent, but do not block the build.
if (!process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID) {
  console.warn("[check-env] note: NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID unset — WalletConnect mobile QR disabled; injected wallets still work.");
}
require_("NEXT_PUBLIC_BLOCK_EXPLORER_URL", isUrl);

if (
  process.env.NEXT_PUBLIC_ROBINHOOD_RPC_URL === "https://rpc.mainnet.chain.robinhood.com" &&
  !ACCEPT_PUBLIC_RPC
) {
  problems.push(
    "NEXT_PUBLIC_ROBINHOOD_RPC_URL is the public fallback — provision a dedicated endpoint, " +
      "or set NEXT_PUBLIC_ACCEPT_PUBLIC_RPC=true to accept it for a preview-mode launch",
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

// Reject known local/anvil contract addresses leaking into production (spec §4/§5).
const ANVIL_ADDRESSES = new Set([
  "0x5fbdb2315678afecb367f032d93f642f64180aa3", // old pools local deploy
  "0x8a791620dd6260079bf849dc5567adc3f2fdc318", // campaigns local deploy
]);
for (const name of [
  "NEXT_PUBLIC_CAMPAIGNS_CONTRACT_ADDRESS",
  "NEXT_PUBLIC_PROPERTY_CONTRACT_ADDRESS",
]) {
  if (ANVIL_ADDRESSES.has((process.env[name] || "").toLowerCase())) {
    problems.push(`${name} is a local anvil deployment address, not a mainnet deployment`);
  }
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
