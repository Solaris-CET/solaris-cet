---
name: "solaris-content-i18n"
description: "Maintains copy consistency and i18n translations across locales. Invoke when editing user-facing text, claims, or adding new UI labels."
---

# Solaris Content + i18n

## Use When

- Changing marketing copy, claims, numbers, or compliance wording.
- Adding new UI labels that must exist in all locales.
- Fixing truncation/line-clamp issues from longer translations.

## Repo Rules

- Update translations in `app/src/i18n/translations.ts`.
- Avoid over-claiming; keep statements verifiable and consistent with tests.
- Prefer concise labels for nav and buttons (mobile widths).

## Verification

```bash
cd /root/solaris-cet/app
npm run verify
PW_WORKERS=1 npm run test:e2e
```

