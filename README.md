# LocalLoop

Hackathon demo: a local B2B rewards network where an advertiser runs a campaign,
nearby host businesses unlock customer rewards, and verified redemption triggers
a host payout on Solana **devnet** — without moving funds from the connected
advertiser wallet.

## Quick start

```bash
cp .env.example .env   # fill server-only Solana secrets later (LL-105)
npm install
npm run dev
```

- Frontend: http://localhost:5173  
- API: http://localhost:3001  

```bash
npm run typecheck
npm run build
npm start              # serves API + dist/
```

Requires Node.js 20+.

## Docs for agents

- [`AGENTS.md`](./AGENTS.md) — detailed repository rules
- [`CLAUDE.md`](./CLAUDE.md) — concise mirror
- [`CONTEXT_HANDOVER.md`](./CONTEXT_HANDOVER.md) — architecture & demo story
- [`HACKATHON_EPICS.md`](./HACKATHON_EPICS.md) — epics & acceptance criteria

## Scaffold status (LL-101)

Foundation is in place: shared contracts, Express API stubs, React routes,
shell components, Georgian copy, and design tokens. Domain transitions (LL-102),
feature polish (LL-103/104), and Solana wallet flow (LL-105) come next.
