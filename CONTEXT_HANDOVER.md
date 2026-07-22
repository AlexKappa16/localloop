# LocalLoop — Coding Agent Handover

## Objective

Build a polished, technically credible hackathon demo of LocalLoop: a local B2B
rewards network in which an advertiser creates a campaign, nearby host
businesses help customers unlock rewards, and a verified redemption triggers a
host payout.

This is a new demo application. Do not assume an existing proof of concept,
legacy component structure, or pre-existing state model. Inspect the repository
before editing, then implement the architecture defined here and in
`HACKATHON_EPICS.md`.

The technical centerpiece is Solana integration without moving any funds from
the connected advertiser wallet:

- The advertiser wallet connects and signs a plaintext authorization only.
- Campaign funding is an explicitly simulated application ledger action.
- A server-controlled wallet records a real proof transaction on Solana devnet.
- A server-controlled devnet wallet pays faucet-issued devnet SOL to the host
  demo wallet after redemption.
- The UI displays genuine Solana Explorer receipts.

## Core demo story

Magnolia Film Lab runs the fictional campaign **"Develop the Night"** with
nearby host Camora.

```text
Magnolia connects a wallet and signs a no-cost funding authorization
→ LocalLoop marks the 0.05 SOL campaign budget as simulated funding
→ A server demo wallet records a real funding-proof memo on devnet
→ Camora approves the partner deal
→ Nino completes "3 verified visits at Camora"
→ Nino unlocks the Magnolia reward
→ Nino requests redemption at Magnolia
→ Magnolia validates the redemption
→ The server sends 0.005 faucet-issued devnet SOL to Camora’s demo wallet
→ All three views update live and display the Explorer receipt
```

The reward is:

> 10 ₾ off film development and scanning on orders over 40 ₾

`TSRE Gym` is the second, mocked host deal. It demonstrates that one advertiser
campaign can contain several host relationships with distinct terms. Only the
Camora path must work end to end.

Magnolia Film Lab and Camora (House of Camora) are real neighboring Tbilisi
businesses at 8 Egnate Ninoshvili Street. Magnolia is a film lab and analogue
photography retailer; Camora is a barbershop by day and a bar/live-music venue
by night. The partnership, campaign, reward, and transactions are fictional
demo data.

Reference context: [Magnolia Film Lab](https://magnoliafilmlab.com/),
[Magnolia’s Georgian FAQ](https://magnoliafilmlab.com/faq/), and
[Fabrika’s House of Camora event listing](https://fabrikatbilisi.com/event/deadpilot-cmr/).

## Product model: views are not permanent business types

The app has three task-oriented views:

1. Customer view: visits, reward progress, claim, and redemption request.
2. Advertiser view: campaigns, simulated budget, partner deals, validation, and
   transaction receipts.
3. Host view: incoming deals, approval, visit verification, and payout status.

Customer is an actor type. Advertiser and host are capabilities of a business,
not mutually exclusive business categories. The same business may advertise
one campaign and host a deal for another campaign.

```text
Campaign.advertiserBusinessId → business paying for customer acquisition
Deal.hostBusinessId           → business performing the host requirement
```

Every business has `capabilities: ('advertiser' | 'host')[]`. The business
console exposes an advertiser/host workspace switcher only when the selected
business supports both capabilities.

Keep two navigation concepts visually distinct:

- **Demo persona switcher:** lets judges jump between Nino, Magnolia, and
  Camora. This is presentation tooling and must be labelled as demo mode.
- **Business workspace switcher:** changes between advertiser and host tasks for
  the same business. This is product navigation.

The seeded walkthrough defaults are:

```text
Nino             → customer view
Magnolia Film Lab → advertiser workspace
Camora            → host workspace
```

## Routes

Canonical routes:

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

`/` is a polished demo launcher, not a fourth product workspace.

### Frontend-only prototype route

`/demo-preview` is a temporary, self-contained presentation prototype used to
rehearse the complete Magnolia → Camora → Nino story before backend integration.
It is not a canonical product workspace or a replacement for the three live
demo routes.

- It renders outside `DemoStateProvider` and does not call REST, SSE, wallet
  adapters, or Solana.
- Its state machine is local and resettable, seeded at Nino 1/3, campaign
  `draft`, Camora deal `proposed`, claim `locked`, and payout `not_ready`.
- Wallet connection, message signing, funding proof, and payout are visibly
  marked mock interactions. Mock receipts have no Explorer links and must never
  be presented as blockchain transactions.
- A mock business sign-in path can open a create-campaign screen where the
  advertiser enters perks, features, and deal terms, connects a mock wallet,
  and deposits a simulated SOL campaign budget before returning to the
  advertiser workspace.
- It rehearses the same ordered happy path and budget change as the final demo,
  while TSRE Gym remains a presentation-only proposed deal.
- The production demo still requires server-authoritative state, real cross-tab
  synchronization, verified wallet messages, and server-funded devnet receipts.

## Architecture

Build one TypeScript repository with two runtime layers:

```text
React + Vite frontend
        ↓ REST + Server-Sent Events
Node + Express API
        ├─ server-owned in-memory demo state
        ├─ validated domain transitions
        ├─ Ed25519 wallet-signature verification
        └─ server-only Solana devnet signer
                    ↓
              Solana devnet
```

### Frontend responsibilities

- Render the three views and demo launcher.
- Render clear English product copy.
- Connect a Wallet Standard-compatible Solana wallet.
- Request `signMessage` only; never request a transaction signature.
- Fetch canonical state from the API.
- Send user intents through REST mutations.
- Subscribe to `/api/events` with native `EventSource`.
- Refetch state after reconnecting or receiving a revision event.
- Show loading, success, empty, and recoverable error states.
- Display real devnet Explorer links returned by the server.

### Backend responsibilities

- Own the canonical demo state in memory.
- Seed and reset all demo entities.
- Validate every state transition and reject invalid or duplicate actions.
- Issue one-time wallet challenges and verify signed messages.
- Broadcast monotonically increasing state revisions through SSE.
- Submit and confirm the server-funded devnet proof transaction.
- Submit and confirm the Camora devnet payout.
- Keep all private key material outside the browser bundle.
- Serve the built frontend in production.

### Persistence and infrastructure decisions

- No database for the hackathon demo.
- No Docker or Docker Compose by default.
- No authentication or production authorization system.
- No blockchain smart contract or custom Anchor program.
- Backend restart resets in-memory state; this limitation is acceptable and must
  not be disguised as production persistence.
- Technical ambition should go into the state machine, synchronized views,
  signature verification, Solana receipts, failure handling, and polish—not
  infrastructure that the demo does not need.

## Runtime contract

Required commands:

```bash
npm install
npm run dev
npm run typecheck
npm run build
npm start
```

Use Node.js 20 or newer. The canonical script behavior is:

```json
{
  "dev": "concurrently -k \"vite\" \"tsx watch server/index.ts\"",
  "typecheck": "tsc --noEmit",
  "build": "npm run typecheck && vite build",
  "start": "tsx server/index.ts"
}
```

Equivalent scripts are acceptable only if they preserve the same one-command
development flow, full client/server typecheck, production frontend build, and
single-process start behavior. Keep `tsx` available in production if `start`
depends on it.

Development topology:

```text
Vite frontend: http://localhost:5173
Express API:   http://localhost:3001
```

Vite proxies `/api` to Express. `npm run dev` starts both processes. After
`npm run build`, Express serves the compiled frontend so deployment uses one
process.

## Target repository structure

```text
index.html
package.json
tsconfig.json
vite.config.ts
.env.example
src/
  main.tsx
  app/
    App.tsx
    router.tsx
    DemoStateProvider.tsx
  components/
  features/
    customer/
    advertiser/
    host/
  lib/
    api.ts
    events.ts
    wallet.ts
  copy/
    en.ts
  styles/
server/
  index.ts
  app.ts
  api/
  domain/
    seed.ts
    store.ts
    transitions.ts
  solana/
    client.ts
    fundingProof.ts
    payout.ts
  wallet/
    challenges.ts
    verifySignature.ts
shared/
  contracts.ts
  ids.ts
  types.ts
```

The exact number of files may change for a clear reason, but preserve these
boundaries: views, shared contracts, server domain logic, wallet verification,
and server-only Solana code.

## Canonical domain state

```text
Business capabilities: advertiser | host
Campaign status: draft | simulated_funded | live | completed
Deal status: proposed | active | completed
Claim status: locked | unlocked | redemption_requested | redeemed
Payout status: not_ready | pending | processing | paid | failed
Transaction type: funding_proof | host_payout
```

Keep claim and payout state separate. A deal does not become `paid`; its payout
record does. Internal enum values remain English code identifiers and render as
clear, human-readable English labels in the UI.

Core transition sequence:

```text
signed funding authorization
→ confirmed server-funded devnet proof
→ campaign simulated_funded
→ Camora approves deal
→ deal active and campaign live
→ three verified visits
→ claim unlocked
→ customer requests redemption
→ claim redemption_requested and payout pending
→ advertiser validates
→ claim redeemed and payout processing
→ confirmed server-funded devnet payout
→ payout paid and budget ledger reduced by 0.005
```

## Seeded data

```text
Businesses
- Magnolia Film Lab: advertiser + host; default advertiser workspace
- Camora: advertiser + host; default host workspace
- TSRE Gym: host

Campaign
- ID: magnolia-develop-the-night
- Name: "Develop the Night"
- Advertiser: Magnolia Film Lab
- Simulated budget: 0.05 SOL

Camora deal
- ID: camora-deal
- Requirement: 3 verified visits at Camora
- Reward: 10 ₾ off film development and scanning on orders over 40 ₾
- Payout: 0.005 faucet-issued devnet SOL
- Maximum redemptions: 10

TSRE Gym deal
- ID: tsre-gym-deal
- Payout: 0.007 faucet-issued devnet SOL
- Maximum redemptions: 5
- Proposed and mocked

Customer
- ID: nino
- Claim ID: LL-NINO-001
- Initial verified visits: 1 of 3
```

Budget values are a simulated ledger:

```text
paid = sum of confirmed host payouts
remaining = total simulated budget - paid
reserved = active-deal payout capacity, capped by remaining
```

TSRE Gym is proposed, so it does not reserve budget. When the Camora deal is
active, its 10 × 0.005 SOL capacity reserves the 0.05 SOL simulated budget. After
one payout, paid is 0.005 and remaining/reserved are both 0.045 SOL.

## API and live-update summary

The detailed request and response contracts live in `HACKATHON_EPICS.md` and
`shared/contracts.ts`. At minimum implement:

```text
GET  /api/health
GET  /api/state
GET  /api/events
POST /api/demo/reset
POST /api/wallet/challenge
POST /api/campaigns/:campaignId/authorize-funding
POST /api/deals/:dealId/approve
POST /api/deals/:dealId/visits
POST /api/claims/:claimId/request-redemption
POST /api/claims/:claimId/validate
```

All mutations return the new state revision and a structured error on failure.
The client must update from server responses/SSE rather than inventing
authoritative state locally.

## Solana and wallet safety contract

The connected advertiser wallet must never lose funds—not even devnet SOL.

- The frontend may call wallet connect, disconnect, and `signMessage`.
- The frontend must never call `sendTransaction`, `signTransaction`, or
  `signAllTransactions`.
- Never construct a transfer with the connected wallet as source or fee payer.
- There is no advertiser-wallet transfer fallback.
- Campaign funding is a simulated ledger action authorized by a signed message.
- Only the server demo wallet submits devnet transactions and pays fees.
- The server must refuse to start its Solana service unless the configured
  cluster is exactly `devnet`.
- The demo wallet contains faucet-issued devnet SOL only.
- The server private key must never appear in source, logs, API responses, or a
  `VITE_*` variable.
- Show `?cluster=devnet` in every Explorer link.
- Label funding as simulated and on-chain activity as devnet demo activity.
- Never describe the system as production escrow or real advertiser funding.

Funding proof memo:

```text
LocalLoop|proof|simulate-funding|campaign:magnolia-develop-the-night
```

Payout memo:

```text
LocalLoop|payout|campaign:magnolia-develop-the-night|deal:camora-deal|claim:LL-NINO-001
```

Implementation references: [Solana clusters and devnet](https://solana.com/docs/core),
[official devnet faucet](https://faucet.solana.com/), and
[Solana memo payments](https://solana.com/docs/payments/send-payments/payment-with-memo).

## Environment contract

```bash
PORT=3001
SOLANA_CLUSTER=devnet
SOLANA_RPC_URL=https://api.devnet.solana.com
DEMO_TREASURY_SECRET_KEY=server_only_base58_secret
DEMO_HOST_PUBLIC_KEY=replace_with_camora_demo_address
VITE_SOLANA_CLUSTER=devnet
VITE_SOLANA_RPC_URL=https://api.devnet.solana.com
```

Only non-secret browser configuration may use `VITE_*`. Commit `.env.example`,
never `.env` or generated keypairs.

The server starts without Solana secrets: `/api/health` reports
`solanaReady: false`, non-Solana demo flows remain usable, and funding/payout
endpoints fail with clear configuration guidance instead of fabricating
Explorer receipts. Run `npm run solana:check` to validate cluster, RPC, treasury
parse/address/balance, and host pubkey without printing the private key.

## Language and product copy

All app-owned user-facing copy must be clear, natural English: navigation,
headings, buttons, helper text, wallet guidance, statuses, loading/error/empty
states, reward terms, and demo controls.

Keep official business names, `LocalLoop`, addresses, wallet addresses,
transaction signatures, IDs, `SOL`, `devnet`, and URLs in their conventional
form. Third-party wallet dialogs and Solana Explorer are outside the app’s copy
scope.

Set `<html lang="en">`. Keep finished product terms in a central English copy
and status map rather than scattering near-duplicate wording through pages.

Canonical copy includes:

```text
Campaign: "Develop the Night"
Fund action: "Simulate campaign funding"
Verify visit: "Verify Camora visit"
Redeem request: "Request reward redemption"
Validate redemption: "Validate redemption"
Funding label: "Simulated budget"
Settlement label: "Demo settlement on Solana devnet"
Reset: "Reset demo"
Claim statuses: "Locked" → "Unlocked" → "Redemption requested" → "Redeemed"
Payout statuses: "Not ready" → "Pending" → "Processing" → "Paid"
```

## Design and brand direction

The visual direction is deliberately flexible. Industrial/editorial and
newspaper-inspired design is a strong option for the local-business story;
neobrutalist borders, blocks, or shadows can be used selectively. These are
references, not a required style recipe.

There is no prescribed primary color, paper background, accent combination,
shadow treatment, or font stack. Establish a compact set of reusable design
tokens and choose colors, type, spacing, borders, and imagery as one coherent
system. Possible ingredients include editorial hierarchy, utilitarian grids,
rules and labels, ink/paper texture, monochrome or limited-color palettes,
stamps, and selective monospace. Gradients, illustration, photography, softer
forms, texture, and motion are equally valid when purposeful.

Non-negotiable usability guardrails:

- Mobile-first at 375px and fully usable through desktop.
- Minimum 44px touch targets.
- Readable typography and accessible contrast.
- Visible keyboard focus and distinct loading, disabled, success, empty, and
  error states.
- Clear hierarchy across dense campaign, deal, claim, and transaction data.
- Consistency across all three workspaces without forcing them into identical
  layouts.

Avoid generic crypto-dashboard clichés, illegible decorative effects, and
style flourishes with no role in hierarchy or storytelling. Creative choices
do not require special approval when they stay within these guardrails.

## Coordination and documentation contract

- Create `AGENTS.md` and `CLAUDE.md` before feature work.
- `AGENTS.md` is the detailed repository rule set; `CLAUDE.md` is its concise
  mirror.
- Both must include the architecture, dual-capability business model,
  English-copy contract, flexible design direction and usability guardrails, Solana
  wallet safety rules, and required validation commands.
- Keep this file synchronized with `HACKATHON_EPICS.md`. Changes to routes,
  state, IDs, copy, design, APIs, or Solana behavior must update both documents.
- Treat `HACKATHON_EPICS.md` as the detailed implementation contract. Reconcile
  conflicts before coding rather than guessing.
- Run `npm run typecheck` and `npm run build` after meaningful integrations.
- Never commit secrets, `.env`, generated wallets, or `node_modules`.

## Final demo sequence

```text
1. Open /advertiser as Magnolia Film Lab.
2. Connect the advertiser wallet and sign the plaintext funding authorization.
3. Show that the wallet sent no transaction and the campaign has a simulated budget.
4. Open the real server-funded funding-proof transaction in Solana Explorer.
5. Open /host as Camora and approve the deal.
6. Verify Nino’s two remaining visits; show /customer updating live.
7. Request reward redemption from /customer.
8. Validate the redemption from Magnolia’s advertiser workspace.
9. Show payout processing, then Camora’s "Paid" status.
10. Open the real server-funded payout transaction in Solana Explorer.
11. Show the simulated remaining budget reduced by 0.005 SOL.
12. Use "Reset demo" and verify every view returns to seeded state.
```

## Detailed backlog

Read [HACKATHON_EPICS.md](./HACKATHON_EPICS.md) for implementation ownership,
API contracts, acceptance criteria, test cases, integration order, and fallback
behavior.
