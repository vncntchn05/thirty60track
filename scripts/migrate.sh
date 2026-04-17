#!/usr/bin/env bash
# scripts/migrate.sh — Apply pending migrations and log them to schema_migrations.
#
# Usage:
#   SUPABASE_DB_URL=postgres://... ./scripts/migrate.sh
#   SUPABASE_DB_URL=postgres://... ./scripts/migrate.sh --dry-run
#
# Migration files discovered (sorted by version):
#   supabase/migrations/NNN_name.sql
#   supabase/migration_NNN[letter]_name.sql

set -euo pipefail

DB_URL="${SUPABASE_DB_URL:?SUPABASE_DB_URL is required}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"
DRY_RUN=false

for arg in "$@"; do
  [[ "$arg" == "--dry-run" ]] && DRY_RUN=true
done

# ─── Extract version string from a migration filename ─────────────────────────
version_of() {
  local base
  base="$(basename "$1" .sql)"
  if   [[ "$base" =~ ^([0-9]+[a-z]?)_.+$ ]];            then echo "${BASH_REMATCH[1]}"
  elif [[ "$base" =~ ^migration_([0-9]+[a-z]?)_.+$ ]];  then echo "${BASH_REMATCH[1]}"
  else echo "$base"
  fi
}

# ─── Ensure tracking table exists ─────────────────────────────────────────────
psql "$DB_URL" --quiet <<'SQL'
CREATE TABLE IF NOT EXISTS schema_migrations (
  version    TEXT        PRIMARY KEY,
  name       TEXT        NOT NULL,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  checksum   TEXT,
  applied_by TEXT        DEFAULT current_user
);
SQL

# ─── Collect and sort all migration files by version ─────────────────────────
# version-sort (sort -V) handles 029 < 029b < 029c < 030 correctly.
mapfile -t SORTED_FILES < <(
  {
    find "$REPO_ROOT/supabase/migrations" -maxdepth 1 -name '*.sql' 2>/dev/null || true
    find "$REPO_ROOT/supabase"            -maxdepth 1 -name 'migration_*.sql' 2>/dev/null || true
  } | while IFS= read -r f; do
    echo "$(version_of "$f") $f"
  done | sort -k1,1V | awk '{print $2}'
)

echo ""
echo "thirty60track — Migration Runner"
echo "================================"
[[ "$DRY_RUN" == "true" ]] && echo "(dry-run mode — no changes will be made)"
echo ""

APPLIED_COUNT=0
SKIPPED_COUNT=0

for FILE in "${SORTED_FILES[@]}"; do
  VERSION="$(version_of "$FILE")"
  NAME="$(basename "$FILE" .sql)"
  CHECKSUM="$(sha256sum "$FILE" | awk '{print $1}')"

  ALREADY=$(psql "$DB_URL" --tuples-only --no-align \
    -c "SELECT COUNT(*) FROM schema_migrations WHERE version = '$VERSION';")

  if [[ "$ALREADY" -gt 0 ]]; then
    printf "  [skip]  %s — %s\n" "$VERSION" "$NAME"
    (( SKIPPED_COUNT++ )) || true
    continue
  fi

  if [[ "$DRY_RUN" == "true" ]]; then
    printf "  [would] %s — %s\n" "$VERSION" "$NAME"
    (( APPLIED_COUNT++ )) || true
    continue
  fi

  printf "  [apply] %s — %s ... " "$VERSION" "$NAME"
  if psql "$DB_URL" --quiet -f "$FILE"; then
    psql "$DB_URL" --quiet \
      -c "INSERT INTO schema_migrations (version, name, checksum)
          VALUES ('$VERSION', '$NAME', '$CHECKSUM')
          ON CONFLICT (version) DO NOTHING;"
    echo "done"
    (( APPLIED_COUNT++ )) || true
  else
    echo "FAILED"
    exit 1
  fi
done

echo ""
if [[ "$DRY_RUN" == "true" ]]; then
  echo "Dry-run complete — would apply: $APPLIED_COUNT  already applied: $SKIPPED_COUNT"
else
  echo "Done — applied: $APPLIED_COUNT  skipped: $SKIPPED_COUNT"
fi
echo ""
