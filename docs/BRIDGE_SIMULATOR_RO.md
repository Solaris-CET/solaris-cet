# Bridge TON ↔ BSC (Simulator)

Acest repo include un simulator de bridge cross-chain pentru CET între TON și BNB Smart Chain (BSC) testnet, cu flux wrap/unwrap, istoric și un mini-explorer în UI.

## Ce face acum

- Wrap: TON CET → BSC testnet (wCET) (simulat)
- Unwrap: BSC testnet (wCET) → TON CET (simulat)
- Istoric + statusuri: created → pending → confirmed
- Taxe + limite afișate în UI (derivate din API)
- Dashboard multi-chain minimal: wCET balance (derivat din istoricul confirmat), conectare EVM wallet, indicator RPC health

## Ce NU face (încă)

- Nu mută CET real pe lanțuri diferite.
- Nu există contract EVM wCET deployat / mint/burn real.
- Nu există relayer/validator set sau fraud proofs.
- LayerZero/Wormhole nu sunt integrate pe mainnet/testnet în acest MVP (doar puncte de extensie).

## API (simulator)

- `GET /api/bridge/simulate` — listează transferurile și face auto-progresul statusurilor (pentru demo).
- `POST /api/bridge/simulate` — creează un transfer.

Auth: Bearer JWT (TonProof) la fel ca restul endpoint-urilor user.

Payload `POST`:

```json
{
  "direction": "wrap",
  "amountCET": "50",
  "evmAddress": "0xabc... (optional)"
}
```

## Limite & taxe (MVP)

- Limită per transfer: `minCET … maxCET` (returnate de API).
- Fee: `max(baseFeeCET, feeBps)` (returnate de API).
- ETA: `etaMs` (returnat de API).

Notă: wCET balance este derivat din istoricul confirmat:

- wrap confirmat: +net (după fee)
- unwrap confirmat: -amount (burn wCET)

## Riscuri (pentru bridge real)

- Custodie / relayer trust: un bridge real implică cel puțin un set de validatori/relayers și un model de securitate care trebuie auditat.
- Replay / double-mint: fără verificare strictă a evenimentelor cross-chain, se pot genera mint-uri multiple.
- Finalitate diferită: TON vs BSC au modele de finalitate și reorganizări diferite.
- Chei compromise: orice cheie de relayer/guardian compromisă poate duce la pierderi.
- UX risk: utilizatorii pot confunda simularea cu transfer real; UI trebuie să marcheze clar modul “Simulator”.

## LayerZero / Wormhole (fezabilitate)

Integrarea reală cere:

- Contracte pe TON și pe EVM (mint/burn/lock/unlock + mesaj cross-chain).
- Config de endpoint/relayer (LayerZero) sau guardians (Wormhole).
- Verificare de finalitate și verificare anti-replay (nonce, receipts).
- Observabilitate: indexare evenimente + retries + reconciliere.
- Audit extern înainte de mainnet.

Recomandare pragmatică:

- Faza 1: bridge custodial testnet (controlat, limitat, cu rate limits).
- Faza 2: bridge non-custodial (LayerZero/Wormhole) după audit + monitoring.

## Simulator pe testnet

- Conectează wallet TON (TonConnect) și autentifică-te (TonProof).
- Deschide `/app` → tab Web3.
- Conectează un wallet EVM (MetaMask sau WalletConnect v2) pentru adresa de destinație.
- Rulează wrap/unwrap, urmărește statusul în lista de transfers.

