---
name: "solaris-db-data"
description: "Manages Postgres/Drizzle schema, migrations, and safe data handling. Invoke when adding tables, changing auth/audit/GDPR flows, or touching DATABASE_URL."
---

# Solaris DB + Data (Postgres/Drizzle)

## Use When

- Updating `app/db/schema.ts` or anything using `getDb()`.
- Adding audit logs, user data deletion, or new user-related flows.
- Creating migrations and applying them in dev/prod.

## Repo Commands

```bash
cd /root/solaris-cet/app
npm run db:generate
npm run db:push
npm run db:studio
```

## Safety Rules

- Never log secrets or full DB rows containing sensitive fields.
- For GDPR deletion, verify authorization (token wallet must match user).
- Prefer additive migrations; avoid destructive changes unless planned.

