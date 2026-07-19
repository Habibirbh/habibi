#!/usr/bin/env bash
# Verify HabibiPropertyPools on a Blockscout explorer.
#
# Usage:  CHAIN_ID=4663 ./scripts/verify.sh
#         CHAIN_ID=<testnet id> EXPLORER_URL=https://... ./scripts/verify.sh
#
# Reads the deployment artifact written by Deploy.s.sol and publishes source,
# compiler settings, and constructor args. If verification fails, the exact
# forge error is printed and the contract must NOT be represented as verified.
set -euo pipefail
cd "$(dirname "$0")/../contracts"

CHAIN_ID="${CHAIN_ID:?set CHAIN_ID}"
ARTIFACT="deployments/${CHAIN_ID}.json"
[ -f "$ARTIFACT" ] || { echo "no deployment artifact: $ARTIFACT"; exit 1; }

ADDRESS=$(python3 -c "import json;print(json.load(open('$ARTIFACT'))['contract'])")
DEPLOYER=$(python3 -c "import json;print(json.load(open('$ARTIFACT'))['deployer'])")

if [ "$CHAIN_ID" = "4663" ]; then
  EXPLORER_URL="${EXPLORER_URL:-https://robinhoodchain.blockscout.com}"
else
  EXPLORER_URL="${EXPLORER_URL:?set EXPLORER_URL for non-mainnet chains}"
fi

CONSTRUCTOR_ARGS=$(cast abi-encode "constructor(address)" "$DEPLOYER")

echo "verifying $ADDRESS on chain $CHAIN_ID via $EXPLORER_URL"
forge verify-contract \
  --chain-id "$CHAIN_ID" \
  --verifier blockscout \
  --verifier-url "${EXPLORER_URL}/api" \
  --constructor-args "$CONSTRUCTOR_ARGS" \
  --watch \
  "$ADDRESS" \
  src/HabibiPropertyPools.sol:HabibiPropertyPools
