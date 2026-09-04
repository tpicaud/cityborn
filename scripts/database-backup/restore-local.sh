#!/usr/bin/env bash

set -euo pipefail

umask 077

if [[ "$#" -ne 2 ]]; then
  echo "Usage: $0 <archive.tar.gz> <cityborn_restore_YYYYMMDD_HHMMSS>" >&2
  exit 1
fi

archive_path="$1"
target_database="$2"
checksum_path="$archive_path.sha256"

if [[ ! "$target_database" =~ ^cityborn_restore_[0-9]{8}_[0-9]{6}$ ]]; then
  echo "Target database name must use the cityborn_restore_YYYYMMDD_HHMMSS format" >&2
  exit 1
fi

if [[ ! -s "$archive_path" ]]; then
  echo "Backup archive does not exist or is empty" >&2
  exit 1
fi

if [[ ! -s "$checksum_path" ]]; then
  echo "Backup checksum does not exist or is empty" >&2
  exit 1
fi

if ! command -v docker > /dev/null 2>&1; then
  echo "docker is required" >&2
  exit 1
fi

archive_directory="$(cd "$(dirname "$archive_path")" && pwd)"
archive_name="$(basename "$archive_path")"
repository_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
compose_file="$repository_root/apps/backend/docker-compose.resources.yml"
restore_directory="$(mktemp -d /tmp/cityborn-database-restore.XXXXXX)"
trap 'rm -r -- "$restore_directory"' EXIT

if command -v sha256sum > /dev/null 2>&1; then
  (
    cd "$archive_directory"
    sha256sum --check "$archive_name.sha256"
  )
elif command -v shasum > /dev/null 2>&1; then
  (
    cd "$archive_directory"
    shasum -a 256 --check "$archive_name.sha256"
  )
else
  echo "sha256sum or shasum is required" >&2
  exit 1
fi

expected_entries="$(printf '%s\n' data.sql roles.sql schema.sql)"
actual_entries="$(tar -tzf "$archive_path" | sort)"
if [[ "$actual_entries" != "$expected_entries" ]]; then
  echo "Backup archive contains unexpected files" >&2
  exit 1
fi

tar -xzf "$archive_path" -C "$restore_directory"
chmod 600 "$restore_directory/roles.sql" "$restore_directory/schema.sql" "$restore_directory/data.sql"

if ! awk '
  /^COPY "(auth|storage)"\./ {
    platform_copy = 1
    next
  }
  platform_copy && /^\\\.$/ {
    platform_copy = 0
    next
  }
  platform_copy {
    platform_row_found = 1
  }
  END {
    exit platform_row_found ? 1 : 0
  }
' "$restore_directory/data.sql"; then
  echo "Local restore cannot skip non-empty Supabase Auth or Storage data" >&2
  exit 1
fi

awk '
  /^COPY "(auth|storage)"\./ {
    platform_copy = 1
    next
  }
  platform_copy && /^\\\.$/ {
    platform_copy = 0
    next
  }
  platform_copy {
    next
  }
  /^SELECT pg_catalog\.setval/ && /"(auth|storage)"\./ {
    next
  }
  {
    print
  }
' "$restore_directory/data.sql" \
  > "$restore_directory/data.application.sql"

sed 's/^SET transaction_timeout/-- &/' \
  "$restore_directory/data.application.sql" \
  > "$restore_directory/data.restore.sql"

sed \
  -e 's/^CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";/-- &/' \
  -e 's/^ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";/-- &/' \
  "$restore_directory/schema.sql" \
  > "$restore_directory/schema.restore.sql"

chmod 600 \
  "$restore_directory/schema.restore.sql" \
  "$restore_directory/data.application.sql" \
  "$restore_directory/data.restore.sql"

if docker compose -f "$compose_file" exec -T postgis \
  psql -X -U postgres -d postgres -Atqc \
  "SELECT 1 FROM pg_catalog.pg_database WHERE datname = '$target_database';" \
  | grep -q '^1$'; then
  echo "Target database already exists" >&2
  exit 1
fi

docker compose -f "$compose_file" exec -T postgis \
  psql \
    -X \
    --set ON_ERROR_STOP=1 \
    -U postgres \
    -d postgres \
    --command 'DO $do$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '\''anon'\'') THEN
    CREATE ROLE anon NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '\''authenticated'\'') THEN
    CREATE ROLE authenticated NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '\''authenticator'\'') THEN
    CREATE ROLE authenticator NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '\''service_role'\'') THEN
    CREATE ROLE service_role NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '\''supabase_admin'\'') THEN
    CREATE ROLE supabase_admin NOLOGIN;
  END IF;
END
$do$;'

docker compose -f "$compose_file" exec -T postgis \
  createdb -U postgres "$target_database"

docker compose -f "$compose_file" exec -T postgis \
  psql \
    -X \
    --set ON_ERROR_STOP=1 \
    -U postgres \
    -d "$target_database" \
    --command 'CREATE SCHEMA IF NOT EXISTS extensions AUTHORIZATION postgres;' \
    --command 'CREATE SCHEMA IF NOT EXISTS tiger AUTHORIZATION postgres;' \
    --command 'CREATE SCHEMA IF NOT EXISTS topology AUTHORIZATION postgres;'

{
  cat "$restore_directory/roles.sql"
  cat "$restore_directory/schema.restore.sql"
  echo 'SET session_replication_role = replica;'
  cat "$restore_directory/data.restore.sql"
} | docker compose -f "$compose_file" exec -T postgis \
  psql \
    -X \
    --single-transaction \
    --set ON_ERROR_STOP=1 \
    -U postgres \
    -d "$target_database"

application_table_count="$(
  docker compose -f "$compose_file" exec -T postgis \
    psql -X -U postgres -d "$target_database" -Atqc \
    "SELECT count(*) FROM pg_catalog.pg_tables WHERE schemaname = 'public' AND tablename <> 'spatial_ref_sys';"
)"

if [[ "$application_table_count" -eq 0 ]]; then
  echo "Restored database does not contain application tables" >&2
  exit 1
fi

printf 'Restore completed: %s application tables in %s\n' \
  "$application_table_count" \
  "$target_database"
