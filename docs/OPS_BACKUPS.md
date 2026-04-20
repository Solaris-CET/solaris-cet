# Backups — Postgres (Coolify)

## Goal

- Produce daily encrypted backups with retention.
- Make restore drills repeatable.
- Avoid downtime surprises by validating backups.

## Assumptions

- Your Postgres is reachable from the app network (Coolify internal DNS).
- You can run a scheduled command (Coolify cron) in a dedicated “backup job” service/container.

## Minimal backup (daily)

1) Create a lightweight backup service (Coolify) using an image that has `pg_dump`.

- Image: `postgres:16-alpine`
- Environment variables:
  - `PGHOST` (internal host)
  - `PGPORT` (default `5432`)
  - `PGDATABASE`
  - `PGUSER`
  - `PGPASSWORD`
  - `BACKUP_BUCKET` (S3-compatible, optional)
  - `BACKUP_PASSPHRASE` (for client-side encryption)

2) Schedule daily dump.

Example command (single-file custom format):

```bash
set -euo pipefail

TS=$(date -u +%Y-%m-%dT%H-%M-%SZ)
OUT="/tmp/solaris-cet-${TS}.dump"

pg_dump --format=c --no-owner --no-privileges --file "$OUT"

if [ -n "${BACKUP_PASSPHRASE:-}" ]; then
  apk add --no-cache openssl >/dev/null
  openssl enc -aes-256-gcm -salt -pbkdf2 -iter 250000 -in "$OUT" -out "${OUT}.enc" -pass env:BACKUP_PASSPHRASE
  rm -f "$OUT"
  OUT="${OUT}.enc"
fi

echo "Backup ready: $OUT"
```

3) Upload (recommended).

- Prefer an object store (S3/R2/Backblaze/MinIO).
- Use signed credentials scoped only to the backup prefix.

## Retention

- Keep at least 14 daily backups + 6 weekly + 12 monthly.
- Enforce retention in the bucket lifecycle policy (preferred).

## Restore drill (monthly)

1) Spin up a temporary Postgres (isolated).
2) Restore the latest backup:

```bash
pg_restore --clean --if-exists --no-owner --no-privileges --dbname "$PGDATABASE" /path/to/latest.dump
```

3) Run smoke checks:

- `SELECT 1;`
- any critical tables exist
- app can start with restored DB

## Safety rules

- Never store plaintext `PGPASSWORD` in repo.
- Always encrypt backups at rest (bucket encryption) and preferably client-side (`openssl` step above).
- Test restores; “a backup you never restored” is not a backup.

