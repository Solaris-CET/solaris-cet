# Gamification & Loialitate — Reguli (RO)

## Termeni

- XP = `users.points` (sursa de adevăr: `points_ledger`, cu deduplicare pe `dedupe_key`)
- Zi = UTC `YYYY-MM-DD`
- Nivel = 1–50 (derivat din XP; nu se stochează separat)

## Acordare XP (evenimente)

| Activitate | XP | Deduplicare |
|---|---:|---|
| Conectare wallet | 5 | o singură dată / user (`dedupe_key = wallet_connect`) |
| Vizită zilnică | 1 | o dată / zi (`visit:${day}`) |
| Întrebare CET AI | 1 | o dată / (zi + query hash) (`ai:${day}:${queryHash}`) |
| Mesaj chat | 1 | o dată / mesaj (`chat:${messageId}`) |
| RSVP la eveniment | 3 | o dată / eveniment (`rsvp:${eventId}`) |
| Social share | 2 | o dată / (zi + platform + url) (`share:${day}:${platform}:${url}`) |
| Referral confirmat | 10 + 10 | o dată / pereche (referrer + referred) |
| Invite confirmat | 5 + 5 | o dată / pereche (inviter + invited) |
| Roata norocului (zilnic) | 0–10 | o dată / zi (`wheel:${day}`) |
| Claim quest | bonus variabil | o dată / quest / zi (daily) sau / quest (seasonal) |

## Boost pentru “portofele vechi”

- Implementarea curentă aplică boost pe baza vechimii contului în aplicație (nu vechimea on-chain a wallet-ului):
  - ≥ 30 zile: +10% (rotunjit în jos, minim +1)
  - ≥ 180 zile: +20%
- Se aplică doar pentru: `ai`, `share`, `chat`, `rsvp`, `visit`.

## Streak-uri

- Streak-ul se actualizează la orice eveniment care acordă XP pozitiv.
- Bonus streak (o singură dată la atingerea pragului):
  - 3 zile: +1 XP
  - 7 zile: +3 XP
  - 14 zile: +5 XP
  - 30 zile: +10 XP

## Quests (misiuni)

- Quests sunt definite în DB (`quests`) și au progres în `user_quest_progress`.
- Progresul se incrementează automat pentru activitățile cu `activity` compatibil.
- Claim-ul acordă un bonus de XP (`quests.points_reward`) și marchează quest-ul ca `claimed`.
- Quests cu `requires_proof = true` intră în `pending_review` și necesită aprobare admin.

## Badge-uri

- Badge-urile sunt definite în DB (`badges`), iar acordarea este idempotentă (`user_badges` unique).
- Acordare automată curentă:
  - `wallet-connected`
  - `first-xp` (XP > 0)
  - `streak-7` (streak ≥ 7)
  - `referral-1` (cel puțin un referral)
  - `top10-weekly` (primi 10 în snapshot-ul săptămânal)

## NFT badge (TON)

- Pentru badge-uri “de top”, utilizatorul poate iniția o cerere de mint (`nft_badge_claims`, status `requested`).
- Fluxul on-chain (mint efectiv) este operat separat și se marchează ulterior ca `minted` cu `tx_hash`/`nft_address`.

## Clasament săptămânal & recompense CET

- Clasamentul săptămânal = suma `points_ledger.delta` în intervalul (luni 00:00 UTC → luni 00:00 UTC).
- Snapshot-ul se generează prin cron (`/api/cron/weekly-leaderboard`, protejat cu `CRON_SECRET`).
- Se creează `weekly_rewards` pentru primii 10 (status `pending`). Transferul on-chain CET rămâne un pas operațional separat.

## Considerații de performanță

- `points_ledger` rămâne append-only; `users.points` e denormalizare pentru citiri rapide.
- Progres quests folosește upsert cu index unic `(user_id, quest_id, day)`.
- Click tracking afiliat e agregat zilnic (`affiliate_clicks_daily`) pentru a evita write-amplification.
