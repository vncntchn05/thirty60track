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
TRAINER_EMAIL="trainer@thirty60test.dev"
CLIENT_ID="bbbbbbbb-0000-4000-b000-000000000002"
CLIENT_EMAIL="client@thirty60test.dev"
AUTH_URL="${SUPABASE_URL}/auth/v1/admin/users"

echo "→ Checking required env vars..."
: "${SUPABASE_URL:?SUPABASE_URL is not set}"
: "${SUPABASE_SERVICE_ROLE_KEY:?SUPABASE_SERVICE_ROLE_KEY is not set}"
: "${TEST_TRAINER_PASSWORD:?TEST_TRAINER_PASSWORD is not set}"
: "${TEST_CLIENT_PASSWORD:?TEST_CLIENT_PASSWORD is not set}"

# Delete any user that has the given email (regardless of UUID).
# This handles stale users from earlier experiments with different UUIDs.
delete_by_email() {
  local email="$1"
  echo "  Searching for existing user: $email"
  local resp
  resp=$(curl -s "${AUTH_URL}?filter=${email}" \
    -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}")
  local ids
  ids=$(echo "$resp" | jq -r '.users[]?.id // empty' 2>/dev/null || true)
  if [[ -n "$ids" ]]; then
    while IFS= read -r id; do
      echo "  Deleting user id=$id"
      curl -s -o /dev/null -X DELETE "${AUTH_URL}/${id}" \
        -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
        -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" || true
    done <<< "$ids"
  else
    echo "  No existing user found."
  fi
}

echo "→ Deleting existing trainer user (if any)..."
delete_by_email "$TRAINER_EMAIL"

echo "→ Creating trainer user (Marcus Webb)..."
TRAINER_PAYLOAD=$(jq -n \
  --arg id "$TRAINER_ID" \
  --arg email "$TRAINER_EMAIL" \
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

echo "→ Deleting existing client user (if any)..."
delete_by_email "$CLIENT_EMAIL"

echo "→ Creating client user (Jordan Reyes)..."
CLIENT_PAYLOAD=$(jq -n \
  --arg id "$CLIENT_ID" \
  --arg email "$CLIENT_EMAIL" \
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
