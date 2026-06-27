#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONTRACT_DIR="$(dirname "$SCRIPT_DIR")"
SHARED_DIR="$(dirname "$CONTRACT_DIR")/shared"
CHAIN_ID=10143

echo "==> Building..."
forge build --root "$CONTRACT_DIR"

echo "==> Deploying Counter to Monad testnet..."
forge script "$SCRIPT_DIR/Deploy.s.sol" \
  --rpc-url monad_testnet \
  --broadcast \
  --root "$CONTRACT_DIR"

# Broadcast dosyasından adres ve tx bilgisini çek
BROADCAST="$CONTRACT_DIR/broadcast/Deploy.s.sol/$CHAIN_ID/run-latest.json"

ADDRESS=$(jq -r '.transactions[0].contractAddress' "$BROADCAST")
TX_HASH=$(jq -r '.transactions[0].hash' "$BROADCAST")
BLOCK=$(jq -r '.receipts[0].blockNumber' "$BROADCAST" | xargs printf '%d\n')
DEPLOYER=$(jq -r '.transactions[0].transaction.from' "$BROADCAST")
DEPLOYED_AT=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

echo "==> Contract deployed at: $ADDRESS"

# shared/ dizinlerini oluştur
mkdir -p "$SHARED_DIR/deployments" "$SHARED_DIR/abi"

# shared/deployments/monad-testnet.json güncelle
cat > "$SHARED_DIR/deployments/monad-testnet.json" <<EOF
{
  "contract": "Counter",
  "address": "$ADDRESS",
  "chainId": $CHAIN_ID,
  "txHash": "$TX_HASH",
  "block": $BLOCK,
  "deployedAt": "$DEPLOYED_AT",
  "deployer": "$DEPLOYER"
}
EOF

# shared/abi/Counter.json güncelle (out/ klasöründen)
jq '.abi' "$CONTRACT_DIR/out/Counter.sol/Counter.json" \
  > "$SHARED_DIR/abi/Counter.json"

echo "==> shared/deployments/monad-testnet.json updated"
echo "==> shared/abi/Counter.json updated"
echo ""
echo "Handoff complete. Front/back arkadasin entegrasyon noktasi: shared/"
