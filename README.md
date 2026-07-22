# LocalLoop

Hackathon demo: a local B2B rewards network where an advertiser runs a campaign,
nearby host businesses unlock customer rewards, and verified redemption triggers
a host payout on Solana **devnet** — without moving funds from the connected
advertiser wallet.

## Status

Scaffolding and implementation follow the contracts in:

- [`CONTEXT_HANDOVER.md`](./CONTEXT_HANDOVER.md) — architecture, safety rules, demo story
- [`HACKATHON_EPICS.md`](./HACKATHON_EPICS.md) — epics, APIs, acceptance criteria

## Planned stack

- React + Vite frontend
- Node + Express API (in-memory demo state, SSE)
- Solana wallet `signMessage` authorization + server-funded devnet receipts

## Commands (once scaffolded)

```bash
npm install
npm run dev
npm run typecheck
npm run build
npm start
```

Requires Node.js 20+.
