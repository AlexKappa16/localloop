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
  "Demo mode".
- `BusinessWorkspaceSwitcher` — advertiser/host tasks for the same business.

## English copy

All app-owned UI copy must be clear, natural English. Keep business names,
`LocalLoop`, addresses, wallet addresses, signatures, IDs, `SOL`, `devnet`, and
URLs in their conventional form.

- Set `<html lang="en">`.
- Keep user-facing terminology centralized in `src/copy/en.ts`; do not expose
  raw enum values as finished UI copy.
- Prefer direct, concise language. Clearly distinguish simulated funding from
  real server-funded devnet activity.

## Design direction

The visual system is intentionally open. An industrial/editorial or newspaper
character is a useful direction, and neobrutalist details may be mixed in, but
none of those references is a mandatory house style.

- No prescribed primary color, background, accent palette, border treatment,
  shadow style, or font family. Choose a small, coherent tokenized system that
  supports the concept and remains consistent across all three workspaces.
- Editorial typography, restrained monochrome palettes, ink/paper cues,
  utilitarian grids, rules, labels, stamps, and selective monospace are welcome
  options—not requirements.
- Gradients, texture, softer forms, illustration, motion, and other treatments
  are allowed when they strengthen hierarchy and the product story.

Guardrails: mobile-first at 375px, responsive on desktop, ≥44px touch targets,
accessible contrast, visible focus, readable typography, and explicit loading,
disabled, success, empty, and error states. Avoid visual effects that reduce
legibility, generic crypto-dashboard clichés, and decoration without a clear
role. Treat creative direction as a design decision, not a compliance checklist.

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
