#!/usr/bin/env bash
# ============================================================
# Creates the two CI/CD test auth users via the Supabase Admin API.
# Run BEFORE seed_cicd.sql.
#
# Required env vars:
#   SUPABASE_URL              — https://[ref].supabase.co
#   SUPABASE_SERVICE_ROLE_KEY — service_role secret key
#   TEST_TRAINER_PASSWORD     — password to set for trainer account
#   TEST_CLIENT_PASSWORD      — password to set for client account
# ============================================================
set -euo pipefail

TRAINER_ID="aaaaaaaa-0000-4000-a000-000000000001"
CLIENT_ID="bbbbbbbb-0000-4000-b000-000000000002"
AUTH_URL="${SUPABASE_URL}/auth/v1/admin/users"

echo "→ Checking required env vars..."
: "${SUPABASE_URL:?SUPABASE_URL is not set}"
: "${SUPABASE_SERVICE_ROLE_KEY:?SUPABASE_SERVICE_ROLE_KEY is not set}"
: "${TEST_TRAINER_PASSWORD:?TEST_TRAINER_PASSWORD is not set}"
: "${TEST_CLIENT_PASSWORD:?TEST_CLIENT_PASSWORD is not set}"

echo "→ Deleting existing test users (if any)..."
curl -s -o /dev/null -X DELETE "${AUTH_URL}/${TRAINER_ID}" \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" || true
curl -s -o /dev/null -X DELETE "${AUTH_URL}/${CLIENT_ID}" \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" || true

echo "→ Creating trainer user (Marcus Webb)..."
TRAINER_PAYLOAD=$(jq -n \
  --arg id "$TRAINER_ID" \
  --arg email "trainer@thirty60test.dev" \
  --arg password "$TEST_TRAINER_PASSWORD" \
  '{id: $id, email: $email, password: $password, email_confirm: true,
    user_metadata: {full_name: "Marcus Webb"}}')

TRAINER_RESP=$(curl -s -w "\n%{http_code}" -X POST "${AUTH_URL}" \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d "$TRAINER_PAYLOAD")
TRAINER_HTTP=$(echo "$TRAINER_RESP" | tail -1)
TRAINER_BODY=$(echo "$TRAINER_RESP" | head -n -1)
echo "  HTTP $TRAINER_HTTP — ${TRAINER_BODY}"
if [[ "$TRAINER_HTTP" -lt 200 || "$TRAINER_HTTP" -ge 300 ]]; then
  echo "ERROR: Failed to create trainer user" >&2; exit 1
fi

echo "→ Creating client user (Jordan Reyes)..."
CLIENT_PAYLOAD=$(jq -n \
  --arg id "$CLIENT_ID" \
  --arg email "client@thirty60test.dev" \
  --arg password "$TEST_CLIENT_PASSWORD" \
  '{id: $id, email: $email, password: $password, email_confirm: true,
    user_metadata: {role: "client", full_name: "Jordan Reyes"}}')

CLIENT_RESP=$(curl -s -w "\n%{http_code}" -X POST "${AUTH_URL}" \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d "$CLIENT_PAYLOAD")
CLIENT_HTTP=$(echo "$CLIENT_RESP" | tail -1)
CLIENT_BODY=$(echo "$CLIENT_RESP" | head -n -1)
echo "  HTTP $CLIENT_HTTP — ${CLIENT_BODY}"
if [[ "$CLIENT_HTTP" -lt 200 || "$CLIENT_HTTP" -ge 300 ]]; then
  echo "ERROR: Failed to create client user" >&2; exit 1
fi

echo "✓ Test auth users created."
