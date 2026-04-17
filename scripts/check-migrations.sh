#!/usr/bin/env bash
# scripts/check-migrations.sh — Report which migrations have been applied.
#
# Usage:
#   SUPABASE_DB_URL=postgres://... ./scripts/check-migrations.sh
#
# Exits 0 always; purely informational (no schema changes made).

set -euo pipefail

DB_URL="${SUPABASE_DB_URL:?SUPABASE_DB_URL is required}"

echo ""
echo "thirty60track — Migration Status"
echo "================================"
echo ""

# Check that the tracking table exists at all
TABLE_EXISTS=$(psql "$DB_URL" --tuples-only --no-align -c \
  "SELECT COUNT(*) FROM information_schema.tables
   WHERE table_schema = 'public' AND table_name = 'schema_migrations';")

if [[ "$TABLE_EXISTS" -eq 0 ]]; then
  echo "  schema_migrations table not found — run scripts/migrate.sh first."
  echo ""
  exit 0
fi

psql "$DB_URL" \
  --no-align \
  --field-separator ' | ' \
  -c "SELECT
        version,
        name,
        to_char(applied_at, 'YYYY-MM-DD HH24:MI:SS UTC') AS applied_at,
        applied_by
      FROM schema_migrations
      ORDER BY version;"

echo ""
TOTAL=$(psql "$DB_URL" --tuples-only --no-align \
  -c "SELECT COUNT(*) FROM schema_migrations;")
echo "Total applied migrations: $TOTAL"
echo ""
