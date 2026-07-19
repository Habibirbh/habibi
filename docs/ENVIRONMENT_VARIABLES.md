# Environment Variables

See `.env.example` for the authoritative list with comments.

Public (NEXT_PUBLIC_*): app env, chain id, RPC URL, explorer URL,
WalletConnect project id, contract address, compliance API URL. These are
compiled into the client bundle — never place secrets here.

Secret (server/CI only): DEPLOYER_PRIVATE_KEY, HABIBI_TREASURY_ADDRESS
(address, not key — but kept server-side to avoid tampering),
HABIBI_ADMIN_MULTISIG, COMPLIANCE_SIGNER_ADDRESS, BLOCKSCOUT_API_KEY,
ALCHEMY_WEBHOOK_SIGNING_KEY, DATABASE_URL, MAINNET_DEPLOY_CONFIRMED.

Rules: never commit `.env*`; never log values; production deploys must fail
on placeholder/empty required values; the treasury private key never exists
anywhere in this system.
