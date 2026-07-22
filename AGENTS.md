# LocalLoop — Agent Rules

This is a **new** full-stack hackathon demo. Do not assume an existing POC,
legacy component tree, or reusable client-side domain store. Inspect the repo,
then implement against `CONTEXT_HANDOVER.md` and `HACKATHON_EPICS.md`.

Keep those two docs synchronized with any change to routes, state, IDs, copy,
design, APIs, or Solana behavior. If they conflict, reconcile before coding.

## Ownership boundaries

| Area | Path | Notes |
|------|------|--------|
| Frontend UI | `src/` | Views, components, styles, copy presentation |
| Shared contracts | `shared/` | Types, IDs, API envelopes — notify dependents before changing |
| Server domain | `server/domain/` | Authoritative state, seed, transitions |
| Server API | `server/api/` | REST + SSE |
| Wallet verify | `server/wallet/` | Challenges + Ed25519 verification |
| Solana (server-only) | `server/solana/` | Devnet funding proof + host payout |

Do not edit another active epic owner’s files without coordination.
Only LL-105 may access the server demo treasury secret.

## Architecture

```text
React + Vite frontend
        ↓ REST + Server-Sent Events
Node + Express API
        ├─ server-owned in-memory demo state
        ├─ validated domain transitions
        ├─ Ed25519 wallet-signature verification
        └─ server-only Solana devnet signer
```

- Server state is authoritative; frontend state is a projection.
- No database. No Docker by default. No production auth. No Anchor program.
- Backend restart resets in-memory state — acceptable demo limitation.

### Required scripts (Node 20+)

```bash
npm install
npm run dev          # Vite :5173 + Express :3001 via concurrently
npm run typecheck    # tsc --noEmit (client + server)
npm run build        # typecheck + vite build
npm start            # Express serves API + dist/
```

Every meaningful integration finishes with `npm run typecheck` and `npm run build`.

### Routes

Canonical:

```text
/
/customer/:customerId
/business/:businessId/advertiser
/business/:businessId/host
```

Demo aliases:

```text
/customer   → /customer/nino
/advertiser → /business/magnolia-film-lab/advertiser
/host       → /business/camora/host
```

Reject or redirect a business workspace when the business lacks that capability.

## Business model

- **Customer** is an actor type.
- **Advertiser** and **host** are capabilities of a business (`capabilities[]`),
  not mutually exclusive permanent types.
- Same business may advertise one campaign and host another.

Navigation must stay distinct:

- `DemoPersonaSwitcher` — demo tooling (Nino / Magnolia / Camora), labelled
  „დემოს რეჟიმი“.
- `BusinessWorkspaceSwitcher` — advertiser/host tasks for the same business.

## Georgian-first copy

All app-owned UI copy must be natural Georgian where appropriate. Keep
business names, `LocalLoop`, addresses, wallet addresses, signatures, IDs,
`SOL`, `devnet`, and URLs in conventional form.

- `<html lang="ka">`
- Load an explicit Georgian-capable font (Noto Sans Georgian). Never rely on
  accidental browser fallback.
- Internal enums stay English; translate at the presentation boundary via
  `src/copy/ka.ts`.

## Design default

Modern welcoming neobrutalism (local print-poster feel):

- Primary: welcoming deep green
- Background: warm off-white paper
- Accents: coral and yellow, sparingly
- Fonts: Noto Sans Georgian; Space Grotesk (Latin display); IBM Plex Mono (tech)
- Mobile-first 375px; strong borders; hard offset shadows; ≥44px touch targets

Creative alternatives (gradients, glass, glow, softer shadows, etc.) only when
the user or an approved design prompt explicitly requests them. Do not add them
as generic polish.

## Solana wallet safety (non-negotiable)

Connected advertiser wallet must never lose funds — not even devnet SOL.

- Frontend may use: connect, disconnect, `signMessage` only.
- Frontend must never call: `sendTransaction`, `signTransaction`,
  `signAllTransactions`.
- Never construct a transfer with the connected wallet as source or fee payer.
- Campaign funding is a **simulated** ledger action authorized by a signed message.
- Only the server demo wallet submits devnet txs and pays fees.
- Refuse Solana service start unless `SOLANA_CLUSTER === 'devnet'`.
- Server private key must never appear in source, logs, API responses, Git, or
  any `VITE_*` variable.
- Explorer links always include `?cluster=devnet`.
- Label funding as simulated; on-chain activity as devnet demo — never as
  production escrow or real advertiser funding.

## Secrets

Commit `.env.example` only. Never commit `.env`, generated keypairs, or
`node_modules`.

## Epic ownership (P0)

| Epic | Owner focus |
|------|-------------|
| LL-101 | Foundation, shared contracts, shell, copy, styles |
| LL-102 | Server domain, REST, SSE, DemoStateProvider |
| LL-103 | Customer + host feature views |
| LL-104 | Advertiser workspace + dual-capability UX |
| LL-105 | Wallet auth + server Solana funding proof / payout |
