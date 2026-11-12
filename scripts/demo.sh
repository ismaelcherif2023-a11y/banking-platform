#!/usr/bin/env bash
# Démo de bout en bout : 2 clients, 1 virement réussi, 1 virement refusé.
# Prérequis : docker compose up -d --build, puis attendre ~30 s. Nécessite curl et jq.
set -euo pipefail
A=http://localhost:8081; T=http://localhost:8082
SUFFIX=$RANDOM

register() {
  curl -sf -X POST "$A/api/auth/register" -H 'Content-Type: application/json' \
    -d "{\"fullName\":\"$1\",\"email\":\"$2\",\"password\":\"Password123!\"}"
}

echo "== Inscription d'Alice et Bob (50000 EUR offerts chacun)"
ALICE=$(register "Alice Martin" "alice$SUFFIX@demo.fr")
BOB=$(register "Bob Diallo" "bob$SUFFIX@demo.fr")
ALICE_TOKEN=$(echo "$ALICE" | jq -r .token)
BOB_ACCOUNT=$(echo "$BOB" | jq -r .accountNumber)
BOB_TOKEN=$(echo "$BOB" | jq -r .token)

echo "== Alice vire 250 EUR à Bob ($BOB_ACCOUNT)"
curl -sf -X POST "$T/api/transfers" -H "Authorization: Bearer $ALICE_TOKEN" -H 'Content-Type: application/json' \
  -d "{\"toAccount\":\"$BOB_ACCOUNT\",\"amount\":250.00,\"label\":\"Remboursement\"}" | jq '{id, status}'

echo "== Alice tente 60000 EUR (solde insuffisant)"
curl -sf -X POST "$T/api/transfers" -H "Authorization: Bearer $ALICE_TOKEN" -H 'Content-Type: application/json' \
  -d "{\"toAccount\":\"$BOB_ACCOUNT\",\"amount\":60000.00}" | jq '{id, status}'

sleep 2
echo "== Historique d'Alice (statuts mis à jour via Kafka)"
curl -sf "$T/api/transfers" -H "Authorization: Bearer $ALICE_TOKEN" | jq '.[] | {amount, status, failureReason}'

echo "== Soldes"
echo -n "Alice : "; curl -sf "$A/api/accounts/me" -H "Authorization: Bearer $ALICE_TOKEN" | jq -r .balance
echo -n "Bob   : "; curl -sf "$A/api/accounts/me" -H "Authorization: Bearer $BOB_TOKEN" | jq -r .balance
