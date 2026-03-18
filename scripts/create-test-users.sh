#!/usr/bin/env bash
# ============================================================
# Creates (or updates) the two CI/CD test auth users via the
# Supabase Admin API.  Run BEFORE seed_cicd.sql.
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

# Upsert a user: if an account with this email already exists, update its
# password (via PUT /:id).  Otherwise create it fresh (via POST /).
# Uses the fixed UUID as the canonical ID.
upsert_user() {
  local fixed_id="$1"
  local email="$2"
  local password="$3"
  local metadata="$4"   # JSON object string, e.g. '{"full_name":"Marcus Webb"}'

  echo "  Searching for existing user: $email"
  local list_resp
  list_resp=$(curl -s "${AUTH_URL}?filter=${email}" \
    -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}")

  local existing_id
  existing_id=$(echo "$list_resp" | jq -r '.users[0].id // empty' 2>/dev/null || true)

  if [[ -n "$existing_id" ]]; then
    echo "  Found existing user id=$existing_id — updating password..."
    local update_payload
    update_payload=$(jq -n \
      --arg password "$password" \
      --argjson meta "$metadata" \
      '{password: $password, user_metadata: $meta, email_confirm: true}')

    local resp
    resp=$(curl -s -w "\n%{http_code}" -X PUT "${AUTH_URL}/${existing_id}" \
      -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
      -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
      -H "Content-Type: application/json" \
      -d "$update_payload")
    local http body
    http=$(echo "$resp" | tail -1)
    body=$(echo "$resp" | head -n -1)
    echo "  PUT HTTP $http — $body"
    if [[ "$http" -lt 200 || "$http" -ge 300 ]]; then
      echo "ERROR: Failed to update user $email" >&2; exit 1
    fi
  else
    echo "  No existing user — creating with id=$fixed_id..."
    local create_payload
    create_payload=$(jq -n \
      --arg id "$fixed_id" \
      --arg email "$email" \
      --arg password "$password" \
      --argjson meta "$metadata" \
      '{id: $id, email: $email, password: $password, email_confirm: true,
        user_metadata: $meta}')

    local resp
    resp=$(curl -s -w "\n%{http_code}" -X POST "${AUTH_URL}" \
      -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
      -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
      -H "Content-Type: application/json" \
      -d "$create_payload")
    local http body
    http=$(echo "$resp" | tail -1)
    body=$(echo "$resp" | head -n -1)
    echo "  POST HTTP $http — $body"
    if [[ "$http" -lt 200 || "$http" -ge 300 ]]; then
      echo "ERROR: Failed to create user $email" >&2; exit 1
    fi
  fi
}

echo "→ Upserting trainer user (Marcus Webb)..."
upsert_user "$TRAINER_ID" "$TRAINER_EMAIL" "$TEST_TRAINER_PASSWORD" \
  '{"full_name":"Marcus Webb"}'

echo "→ Upserting client user (Jordan Reyes)..."
upsert_user "$CLIENT_ID" "$CLIENT_EMAIL" "$TEST_CLIENT_PASSWORD" \
  '{"role":"client","full_name":"Jordan Reyes"}'

echo "✓ Test auth users ready."
