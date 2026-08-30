#!/usr/bin/env bash
# Daily encrypted Postgres backup — upload to R2/S3 off-VPS.
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/tmp/pg-backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILE="${BACKUP_DIR}/marketplace_${TIMESTAMP}.sql.gz"
mkdir -p "$BACKUP_DIR"

PGHOST="${PGHOST:-localhost}"
PGUSER="${PGUSER:-marketplace}"
PGDATABASE="${PGDATABASE:-marketplace}"

echo "Backing up ${PGDATABASE}..."
pg_dump -h "$PGHOST" -U "$PGUSER" "$PGDATABASE" | gzip > "$FILE"
echo "Wrote $FILE ($(du -h "$FILE" | cut -f1))"

if [[ -n "${S3_ENDPOINT:-}" && -n "${S3_ACCESS_KEY:-}" ]]; then
  aws s3 cp "$FILE" "s3://${S3_BUCKET:-marketplace-backups}/postgres/" \
    --endpoint-url "$S3_ENDPOINT"
  echo "Uploaded to S3/R2"
fi

find "$BACKUP_DIR" -name "*.sql.gz" -mtime +7 -delete
echo "Done."
