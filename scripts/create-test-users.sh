#!/usr/bin/env bash
# ============================================================
# Creates the two CI/CD test auth users via the Supabase Admin API.
# Run this BEFORE seed_cicd.sql so the trainer UUID exists in
# auth.users (and the handle_new_user trigger can fire).
#
# Required env vars:
#   SUPABASE_URL          — https://[ref].supabase.co
#   SUPABASE_SERVICE_ROLE_KEY — service_role secret key
# ============================================================
set -euo pipefail

TRAINER_ID="aaaaaaaa-0000-4000-a000-000000000001"
CLIENT_ID="bbbbbbbb-0000-4000-b000-000000000002"

AUTH_URL="${SUPABASE_URL}/auth/v1/admin/users"
AUTH_HEADER_KEY="apikey: ${SUPABASE_SERVICE_ROLE_KEY}"
AUTH_HEADER_BEARER="Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}"

echo "→ Deleting existing test users (if any)..."
curl -sf -X DELETE "${AUTH_URL}/${TRAINER_ID}" \
  -H "${AUTH_HEADER_KEY}" -H "${AUTH_HEADER_BEARER}" || true
curl -sf -X DELETE "${AUTH_URL}/${CLIENT_ID}" \
  -H "${AUTH_HEADER_KEY}" -H "${AUTH_HEADER_BEARER}" || true

echo "→ Creating trainer user (Marcus Webb)..."
curl -sf -X POST "${AUTH_URL}" \
  -H "${AUTH_HEADER_KEY}" \
  -H "${AUTH_HEADER_BEARER}" \
  -H "Content-Type: application/json" \
  -d "{
    \"id\": \"${TRAINER_ID}\",
    \"email\": \"trainer@thirty60test.dev\",
    \"password\": \"Thirty60Trainer#1\",
    \"email_confirm\": true,
    \"user_metadata\": {\"full_name\": \"Marcus Webb\"}
  }" > /dev/null

echo "→ Creating client user (Jordan Reyes)..."
curl -sf -X POST "${AUTH_URL}" \
  -H "${AUTH_HEADER_KEY}" \
  -H "${AUTH_HEADER_BEARER}" \
  -H "Content-Type: application/json" \
  -d "{
    \"id\": \"${CLIENT_ID}\",
    \"email\": \"client@thirty60test.dev\",
    \"password\": \"Thirty60Client#1\",
    \"email_confirm\": true,
    \"user_metadata\": {\"role\": \"client\", \"full_name\": \"Jordan Reyes\"}
  }" > /dev/null

echo "✓ Test auth users ready."
