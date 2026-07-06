# Preview DB (anonimizat) + TTL

## Scop

- Mediu de preview pentru PR-uri cu date apropiate de producție, dar anonimizate.
- TTL: distrugere după 24h de inactivitate.

## Flux recomandat (Postgres)

1) Creează DB de preview (nume determinist pe PR):

```sql
create database solaris_cet_preview_pr123;
```

2) Clonează schema + date:

```bash
pg_dump "$PROD_DATABASE_URL" --format=c --no-owner --no-privileges --file /tmp/prod.dump
pg_restore --no-owner --no-privileges --dbname "$PREVIEW_DATABASE_URL" /tmp/prod.dump
```

3) Rulează anonimizare (exemple):

```sql
update users
set wallet_address = 'ANON_' || substr(md5(wallet_address), 1, 32),
    referral_code = null;

update audit_logs
set details = null;
```

## TTL (24h inactivitate)

Opțiuni:

- **Coolify Scheduled Job**: un job zilnic care șterge resursele/tag-urile de preview mai vechi de 24h.
- **GitHub Actions**: un workflow programat care cheamă API-ul Coolify și șterge preview-urile expirate.

Semnal de “inactivitate” (practic):

- ultima dată de deploy (deployment timestamp)
- ultima cerere HTTP (dacă ai acces la loguri/metrics)

