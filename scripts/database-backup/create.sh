#!/usr/bin/env bash

set -euo pipefail

umask 077

required_names=(DATABASE_URL BACKUP_OUTPUT_DIR BACKUP_TIMESTAMP)
for name in "${required_names[@]}"; do
  if [[ -z "${!name:-}" ]]; then
    echo "$name is required" >&2
    exit 1
  fi
done

if [[ ! "$BACKUP_TIMESTAMP" =~ ^[0-9]{8}T[0-9]{6}Z$ ]]; then
  echo "BACKUP_TIMESTAMP must use the YYYYMMDDTHHMMSSZ format" >&2
  exit 1
fi

if [[ "$DATABASE_URL" != postgresql://* && "$DATABASE_URL" != postgres://* ]]; then
  echo "DATABASE_URL must be a PostgreSQL connection string" >&2
  exit 1
fi

if ! command -v supabase > /dev/null 2>&1; then
  echo "supabase CLI is required" >&2
  exit 1
fi

mkdir -p "$BACKUP_OUTPUT_DIR"
chmod 700 "$BACKUP_OUTPUT_DIR"

working_dir="$(mktemp -d "$BACKUP_OUTPUT_DIR/database-backup.XXXXXX")"
trap 'rm -r -- "$working_dir"' EXIT

roles_path="$working_dir/roles.sql"
schema_path="$working_dir/schema.sql"
data_path="$working_dir/data.sql"
archive_name="cityborn-postgres-${BACKUP_TIMESTAMP}.tar.gz"
archive_path="$BACKUP_OUTPUT_DIR/$archive_name"
checksum_path="$archive_path.sha256"

supabase db dump \
  --db-url "$DATABASE_URL" \
  --file "$roles_path" \
  --role-only

supabase db dump \
  --db-url "$DATABASE_URL" \
  --file "$schema_path"

supabase db dump \
  --db-url "$DATABASE_URL" \
  --file "$data_path" \
  --data-only \
  --use-copy

for sql_path in "$roles_path" "$schema_path" "$data_path"; do
  if [[ ! -s "$sql_path" ]]; then
    echo "$(basename "$sql_path") is empty" >&2
    exit 1
  fi
done

if ! grep -q '^CREATE TABLE' "$schema_path"; then
  echo "schema.sql does not contain any table" >&2
  exit 1
fi

if ! grep -q '^COPY ' "$data_path"; then
  echo "data.sql does not contain any table data section" >&2
  exit 1
fi

tar -C "$working_dir" -czf "$archive_path" roles.sql schema.sql data.sql
chmod 600 "$archive_path"

(
  cd "$BACKUP_OUTPUT_DIR"
  sha256sum "$archive_name" > "$archive_name.sha256"
)

chmod 600 "$checksum_path"

expected_entries="$(printf '%s\n' data.sql roles.sql schema.sql)"
actual_entries="$(tar -tzf "$archive_path" | sort)"
if [[ "$actual_entries" != "$expected_entries" ]]; then
  echo "Backup archive contains unexpected files" >&2
  exit 1
fi

(
  cd "$BACKUP_OUTPUT_DIR"
  sha256sum --check "$archive_name.sha256"
)

printf 'Backup created: %s\n' "$archive_path"
