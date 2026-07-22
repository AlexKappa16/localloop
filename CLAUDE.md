# LocalLoop — Concise Agent Rules

New full-stack demo (not a POC refactor). Follow `CONTEXT_HANDOVER.md` +
`HACKATHON_EPICS.md`. Keep them in sync. Reconcile conflicts before coding.

## Boundaries

- `src/` UI · `shared/` contracts · `server/domain/` state · `server/api/` REST/SSE
- `server/wallet/` verify · `server/solana/` server-only (LL-105 only for secrets)
- Do not edit another owner’s files without coordination.
- Server state is authoritative; client is a projection. No DB / Docker / prod auth.

## Commands

```bash
npm run dev | typecheck | build | start   # Node 20+
```

Finish meaningful work with typecheck + build.

## Routes

`/` · `/customer/:id` · `/business/:id/advertiser|host`  
Aliases: `/customer`→nino · `/advertiser`→magnolia advertiser · `/host`→camora host  
Enforce business capabilities on workspace routes.

## Model

Advertiser/host = business capabilities, not fixed types.  
Keep demo persona switcher ≠ business workspace switcher.

## Copy & design

English UI; `lang="en"`; centralize finished UI terms in `src/copy/en.ts`.
Visual direction is open: industrial/editorial/newspaper and neobrutalist cues
are options, not mandates. No required green palette, paper background, hard
shadows, or font stack. Keep the system coherent and tokenized; preserve mobile
responsiveness, readable contrast, visible focus/states, and ≥44px targets.

## Solana safety

`signMessage` only on connected wallet — never send/sign transactions.  
Funding = simulated ledger. Server demo wallet only on **devnet**.  
No secrets in `VITE_*`, Git, logs, or API. Explorer: `?cluster=devnet`.
