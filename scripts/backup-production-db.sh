#!/usr/bin/env bash

set -euo pipefail

required_commands=(pg_dump aws python3)

for cmd in "${required_commands[@]}"; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "Missing required command: $cmd" >&2
    exit 1
  fi
done

if command -v sha256sum >/dev/null 2>&1; then
  checksum_cmd=(sha256sum)
elif command -v shasum >/dev/null 2>&1; then
  checksum_cmd=(shasum -a 256)
else
  echo "Missing required command: sha256sum or shasum" >&2
  exit 1
fi

required_vars=(
  BACKUP_DATABASE_URL
  B2_BUCKET
  B2_KEY_ID
  B2_APPLICATION_KEY
  B2_ENDPOINT
)

for var_name in "${required_vars[@]}"; do
  if [[ -z "${!var_name:-}" ]]; then
    echo "Missing required environment variable: $var_name" >&2
    exit 1
  fi
done

backup_database_url="${BACKUP_DATABASE_URL//$'\r'/}"
backup_database_url="${backup_database_url//$'\n'/}"
backup_database_url="${backup_database_url//\\n/}"

retention_days="${BACKUP_RETENTION_DAYS:-30}"
backup_prefix="${BACKUP_PREFIX:-postgres/production}"
timestamp="$(date -u +"%Y-%m-%dT%H%M%SZ")"
filename="gtd-production-${timestamp}.dump"
checksum_filename="${filename}.sha256"
s3_uri="s3://${B2_BUCKET}/${backup_prefix}/${filename}"
checksum_s3_uri="s3://${B2_BUCKET}/${backup_prefix}/${checksum_filename}"

tmp_dir="$(mktemp -d)"
dump_path="${tmp_dir}/${filename}"
checksum_path="${tmp_dir}/${checksum_filename}"

cleanup() {
  rm -rf "${tmp_dir}"
}

trap cleanup EXIT

export AWS_ACCESS_KEY_ID="${B2_KEY_ID}"
export AWS_SECRET_ACCESS_KEY="${B2_APPLICATION_KEY}"
export AWS_DEFAULT_REGION="${B2_REGION:-us-east-005}"
export AWS_EC2_METADATA_DISABLED="true"
export PGAPPNAME="giving-the-distance-backup"

echo "Creating production database backup: ${filename}"
pg_dump \
  --dbname="${backup_database_url}" \
  --format=custom \
  --no-owner \
  --no-privileges \
  --file="${dump_path}"

"${checksum_cmd[@]}" "${dump_path}" | awk '{print $1}' > "${checksum_path}"

echo "Uploading backup to ${s3_uri}"
aws --endpoint-url "${B2_ENDPOINT}" s3 cp "${dump_path}" "${s3_uri}"
aws --endpoint-url "${B2_ENDPOINT}" s3 cp "${checksum_path}" "${checksum_s3_uri}"

echo "Pruning backups older than ${retention_days} days from s3://${B2_BUCKET}/${backup_prefix}/"
python3 - <<'PY' | while IFS= read -r key; do
import datetime
import json
import os
import subprocess
import sys

bucket = os.environ["B2_BUCKET"]
prefix = os.environ.get("BACKUP_PREFIX", "postgres/production")
endpoint = os.environ["B2_ENDPOINT"]
retention_days = int(os.environ.get("BACKUP_RETENTION_DAYS", "30"))
cutoff = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=retention_days)

cmd = [
    "aws",
    "--endpoint-url",
    endpoint,
    "s3api",
    "list-objects-v2",
    "--bucket",
    bucket,
    "--prefix",
    prefix + "/",
    "--output",
    "json",
]

result = subprocess.run(cmd, check=True, capture_output=True, text=True)
payload = json.loads(result.stdout or "{}")

for item in payload.get("Contents", []):
    last_modified = item.get("LastModified")
    key = item.get("Key")
    if not last_modified or not key:
        continue
    parsed = datetime.datetime.fromisoformat(last_modified.replace("Z", "+00:00"))
    if parsed < cutoff:
        print(key)
PY
  if [[ -n "${key}" ]]; then
    aws --endpoint-url "${B2_ENDPOINT}" s3 rm "s3://${B2_BUCKET}/${key}"
  fi
done

echo "Backup complete: ${s3_uri}"
