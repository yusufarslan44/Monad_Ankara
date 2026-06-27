#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONTRACT_DIR="$(dirname "$SCRIPT_DIR")"
SHARED_DIR="$(dirname "$CONTRACT_DIR")/shared"
CHAIN_ID=10143

echo "==> Building..."
forge build --root "$CONTRACT_DIR"

echo "==> Deploying StudentID + LendingPool to Monad testnet..."
forge script "$SCRIPT_DIR/Deploy.s.sol" \
  --rpc-url monad_testnet \
  --broadcast \
  --root "$CONTRACT_DIR"

# Broadcast dosyasından adres ve tx bilgisini çek
# Deploy.s.sol sırası: tx[0]=StudentID, tx[1]=LendingPool, tx[2]=setAdmin
BROADCAST="$CONTRACT_DIR/broadcast/Deploy.s.sol/$CHAIN_ID/run-latest.json"

SID_ADDRESS=$(jq -r '.transactions[0].contractAddress' "$BROADCAST")
POOL_ADDRESS=$(jq -r '.transactions[1].contractAddress' "$BROADCAST")
TX_HASH=$(jq -r '.transactions[0].hash' "$BROADCAST")
BLOCK=$(jq -r '.receipts[0].blockNumber' "$BROADCAST" | xargs printf '%d\n')
DEPLOYER=$(jq -r '.transactions[0].transaction.from' "$BROADCAST")
DEPLOYED_AT=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

echo "==> StudentID:   $SID_ADDRESS"
echo "==> LendingPool: $POOL_ADDRESS"

# shared/ dizinlerini oluştur
mkdir -p "$SHARED_DIR/deployments" "$SHARED_DIR/abi"

# shared/deployments/monad-testnet.json güncelle
cat > "$SHARED_DIR/deployments/monad-testnet.json" <<EOF
{
  "chainId": $CHAIN_ID,
  "deployedAt": "$DEPLOYED_AT",
  "deployer": "$DEPLOYER",
  "txHash": "$TX_HASH",
  "block": $BLOCK,
  "contracts": {
    "StudentID": "$SID_ADDRESS",
    "LendingPool": "$POOL_ADDRESS"
  }
}
EOF

# shared/abi/ güncelle
jq '.abi' "$CONTRACT_DIR/out/StudentID.sol/StudentID.json" \
  > "$SHARED_DIR/abi/StudentID.json"

jq '.abi' "$CONTRACT_DIR/out/LendingPool.sol/LendingPool.json" \
  > "$SHARED_DIR/abi/LendingPool.json"

echo "==> shared/deployments/monad-testnet.json updated"
echo "==> shared/abi/StudentID.json updated"
echo "==> shared/abi/LendingPool.json updated"
echo ""
echo "Handoff complete. Front/back arkadasin entegrasyon noktasi: shared/"
