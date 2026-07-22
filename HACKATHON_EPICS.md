# LocalLoop — Hackathon Implementation Epics

## 1. Shared implementation contract

### Product outcome

Build a new, polished LocalLoop demo application that proves three things:

1. A local advertiser can run one campaign through multiple host businesses.
2. Customer, advertiser, and host views share one validated workflow and update
   live across browser tabs.
3. Solana can provide wallet authorization and auditable devnet receipts without
   taking funds from the connected advertiser wallet.

Do not assume an existing proof of concept, legacy component tree, or reusable
state model. Inspect the repository before editing and build toward the
architecture in this document.

### Canonical demo story

**Magnolia Film Lab** creates the fictional campaign **"Develop the Night"**
with nearby host **Camora**.

```text
Magnolia connects a wallet and signs a no-cost funding authorization
→ LocalLoop marks 0.05 SOL as a simulated campaign budget
→ The server records a real funding-proof memo on Solana devnet
→ Camora approves the deal
→ Nino completes "3 verified visits at Camora"
→ Nino unlocks the Magnolia reward
→ Nino requests redemption
→ Magnolia validates the redemption
→ The server pays 0.005 faucet-issued devnet SOL to Camora’s demo wallet
→ Every view updates live and exposes the Explorer receipt
```

Reward:

> 10 ₾ off film development and scanning on orders over 40 ₾

`TSRE Gym` is a second, proposed mock deal that proves one campaign can contain
multiple host relationships. Only the Camora path must work end to end.

Magnolia and Camora are real Tbilisi businesses at 8 Egnate Ninoshvili Street,
but the partnership, campaign, reward, and transactions are fictional demo
data. Reference context: [Magnolia Film Lab](https://magnoliafilmlab.com/),
[Magnolia’s Georgian FAQ](https://magnoliafilmlab.com/faq/), and
[Fabrika’s House of Camora event listing](https://fabrikatbilisi.com/event/deadpilot-cmr/).

### Definition of P0 success

The demo is complete only when all of the following are true:

- `/customer`, `/advertiser`, and `/host` open the correct seeded personas.
- The three views can be opened in separate tabs and update from the same server
  state without manual refresh.
- A business is modeled with advertiser/host capabilities rather than one fixed
  business type.
- The connected advertiser wallet signs a message but never signs or sends a
  transaction.
- The server records a real funding-proof transaction on devnet.
- The complete Camora visit, claim, redemption, and payout state machine works.
- The server sends a real faucet-funded devnet payout to the Camora demo wallet.
- Funding-proof and payout transactions open on Solana Explorer with
  `?cluster=devnet`.
- All app-owned UI copy is clear, natural English.
- Reset restores every view to the seeded state.
- `npm run typecheck` and `npm run build` succeed.

## 2. Technical architecture

### Runtime topology

Use a single TypeScript repository with two runtime layers:

```text
React + Vite frontend
        ↓ REST + Server-Sent Events
Node + Express API
        ├─ server-owned in-memory state
        ├─ validated domain transitions
        ├─ wallet message verification
        └─ server-only Solana devnet signer
                    ↓
              Solana devnet
```

Development:

```text
http://localhost:5173  Vite frontend
http://localhost:3001  Express API
```

Vite proxies `/api` to Express. `npm run dev` starts both processes. In a
production build, Express serves the compiled frontend from `dist/` so the demo
deploys as one process.

Required scripts:

```bash
npm install
npm run dev
npm run typecheck
npm run build
npm start
```

Use Node.js 20 or newer. Canonical package-script behavior:

```json
{
  "dev": "concurrently -k \"vite\" \"tsx watch server/index.ts\"",
  "typecheck": "tsc --noEmit",
  "build": "npm run typecheck && vite build",
  "start": "tsx server/index.ts"
}
```

Equivalent scripts are acceptable only if they keep one-command development,
typecheck both browser and server code, produce the frontend bundle, and start
the API as one production process that serves that bundle. Keep `tsx` available
in production if `start` depends on it.

### Infrastructure decisions

- No database.
- No Docker or Docker Compose by default.
- No production authentication.
- No custom Solana/Anchor program.
- No USDC or token-account setup.
- No real advertiser funding.
- No client-side authoritative domain state.

The backend uses a resettable in-memory store. A server restart returns the app
to its seed state. This is an explicit demo limitation, not production
persistence.

### Preferred dependencies

Use a minimal, coherent stack:

```text
Frontend: React, React Router, TypeScript, Vite
Wallet: @solana/wallet-adapter-react, its UI package, and Wallet Standard-compatible adapters
Backend: Express, TypeScript, tsx
Solana: @solana/web3.js
Signature verification: tweetnacl + bs58
Dev orchestration: concurrently
Styling: organised plain CSS
```

Do not install a second state library, API framework, component system, CSS
framework, database, or container stack without a concrete blocking reason.

### Target repository structure

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
    AppShell.tsx
    DemoPersonaSwitcher.tsx
    BusinessWorkspaceSwitcher.tsx
    StatusBadge.tsx
    TransactionReceipt.tsx
    DemoResetButton.tsx
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
    tokens.css
    globals.css
    components.css
server/
  index.ts
  app.ts
  api/
    routes.ts
    errors.ts
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

Files may be split further when useful, but preserve the boundaries between UI
features, shared contracts, server transitions, wallet verification, and
server-only Solana code.

## 3. Actor, business, and routing model

### Three views

The product has three task-oriented views:

```text
Customer view   → visits, reward progress, claims, redemption request
Advertiser view → campaigns, budgets, deals, validation, receipts
Host view       → incoming deals, approval, visit verification, earnings
```

Customer is an actor type. Advertiser and host are capabilities of a business,
not permanent or mutually exclusive business types.

```ts
export type BusinessCapability = 'advertiser' | 'host';

export interface Business {
  id: string;
  name: string;
  capabilities: BusinessCapability[];
}

export interface Campaign {
  id: string;
  advertiserBusinessId: string;
}

export interface Deal {
  id: string;
  campaignId: string;
  hostBusinessId: string;
}
```

The same business can be `Campaign.advertiserBusinessId` in one relationship
and `Deal.hostBusinessId` in another.

### Navigation model

Keep these controls separate:

- `DemoPersonaSwitcher` changes the seeded actor and is visibly labelled as
  demo tooling.
- `BusinessWorkspaceSwitcher` changes advertiser/host workspaces for the same
  business and appears only for capabilities that business owns.

Seed Magnolia and Camora with both capabilities so the architecture is visible,
but default the walkthrough to Magnolia advertiser and Camora host. Their
opposite workspaces may show concise English empty states; do not create extra
fake campaigns merely to fill them.

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

The router must reject or redirect a business workspace when the selected
business lacks the requested capability.

## 4. Shared domain and state-machine contract

### Domain vocabulary

```text
Campaign: advertiser’s objective, simulated budget, duration, and deal set.
Deal: one campaign’s agreement with one host.
Visit: one server-verified qualifying host action for a customer.
Claim: one unique customer reward unlocked after meeting the requirement.
Redemption request: customer asks to use an unlocked claim.
Redemption validation: advertiser confirms that the claim was used.
Payout: server-funded devnet bounty sent to the host after validation.
Funding proof: server-funded devnet memo proving the simulated authorization flow.
```

Do not collapse unlock, redemption request, advertiser validation, and payout
into one action.

### State enums

```ts
type CampaignStatus = 'draft' | 'simulated_funded' | 'live' | 'completed';
type DealStatus = 'proposed' | 'active' | 'completed';
type ClaimStatus = 'locked' | 'unlocked' | 'redemption_requested' | 'redeemed';
type PayoutStatus = 'not_ready' | 'pending' | 'processing' | 'paid' | 'failed';
type TransactionType = 'funding_proof' | 'host_payout';
```

Deal status and payout status are separate. Never set a deal’s status to
`paid`. Enum values are internal and must render as human-readable English labels.

### Required transition sequence

```text
funding challenge issued
→ exact challenge signed and verified once
→ server submits and confirms devnet funding proof
→ campaign simulated_funded
→ Camora approves proposed deal
→ deal active and campaign live
→ visit count progresses from 1 to 3
→ claim unlocked automatically at 3
→ customer requests redemption
→ claim redemption_requested and payout pending
→ Magnolia validates once
→ claim redeemed and payout processing
→ server confirms devnet payout
→ payout paid
→ simulated remaining budget changes from 0.05 to 0.045 SOL
```

Server transition rules:

- Funding authorization is accepted only for the seeded Magnolia campaign.
- A challenge is exact, expires, and can be consumed only once.
- Campaign state changes only after the proof transaction is confirmed.
- A deal cannot activate before the campaign is simulated-funded.
- A visit can be added only to an active deal and cannot exceed the requirement.
- A claim unlocks exactly once when the requirement is reached.
- Redemption can be requested only from `unlocked`.
- An accepted redemption request changes payout from `not_ready` to `pending`.
- Validation can occur only from `redemption_requested`.
- Payout begins only after validation and is idempotent per claim.
- Duplicate actions return a stable structured error or the existing completed
  result; they must never create a second payout.
- Failed Solana actions retain recoverable state and expose a retry path.

## 5. Seed data contract

```ts
export const ids = {
  magnolia: 'magnolia-film-lab',
  camora: 'camora',
  tsreGym: 'tsre-gym',
  nino: 'nino',
  campaign: 'magnolia-develop-the-night',
  camoraDeal: 'camora-deal',
  tsreDeal: 'tsre-gym-deal',
  claim: 'LL-NINO-001',
} as const;
```

Seed these facts:

```text
Magnolia Film Lab
- capabilities: advertiser, host
- default demo workspace: advertiser

Camora
- capabilities: advertiser, host
- default demo workspace: host

TSRE Gym
- capabilities: host

Campaign "Develop the Night"
- advertiser: Magnolia Film Lab
- status: draft
- total simulated budget: 0.05 SOL
- remaining simulated budget: 0.05 SOL

Camora deal
- status: proposed
- requirement: 3 verified visits at Camora
- reward: 10 ₾ off film development and scanning on orders over 40 ₾
- payout: 0.005 faucet-issued devnet SOL
- maximum redemptions: 10

TSRE Gym deal
- status: proposed and mocked
- payout: 0.007 faucet-issued devnet SOL
- maximum redemptions: 5

Nino
- initial Camora visits: 1 of 3
- claim LL-NINO-001: locked
- payout: not_ready
```

Budget values are a simulated ledger, calculated as:

```text
paid = sum of confirmed host payouts
remaining = total simulated budget - paid
reserved = active-deal payout capacity, capped by remaining
```

The proposed TSRE Gym deal reserves nothing. Once Camora is active, its
10 × 0.005 SOL capacity reserves the 0.05 SOL simulated budget. After one
confirmed payout, paid is 0.005 and remaining/reserved are both 0.045 SOL.

## 6. API, errors, and live synchronization

### Response envelope

Successful state-changing responses:

```ts
type MutationResponse<T = unknown> = {
  revision: number;
  data: T;
  state: DemoState;
};
```

Errors:

```ts
type ApiError = {
  error: {
    code: string;
    messageKa: string;
    retryable: boolean;
    details?: Record<string, unknown>;
  };
};
```

Never return a private key, raw server exception, or English-only UI error.

### Required endpoints

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

`GET /api/events` uses Server-Sent Events. Each domain mutation increments a
monotonic revision and emits:

```text
event: revision
data: {"revision": 12}
```

The frontend refetches `/api/state` when it sees a newer revision. Native
`EventSource` reconnect behavior is sufficient. On reconnect or revision gaps,
refetch the complete state. Do not duplicate the domain reducer in the browser.

### Funding challenge payload

Request:

```json
{ "walletAddress": "..." }
```

Response contains a challenge ID, expiry, and exact plaintext message. The
server-generated message must make the safety model obvious:

```text
LocalLoop demo authorization
Action: Simulate campaign funding
Campaign: magnolia-develop-the-night
Budget: 0.05 SOL (simulated; no transfer)
Wallet: {walletAddress}
Nonce: {nonce}
Expires: {isoTimestamp}
This signature does not authorize a blockchain transaction.
```

The frontend signs the exact UTF-8 bytes and returns:

```json
{
  "challengeId": "...",
  "walletAddress": "...",
  "signatureBase58": "..."
}
```

The backend verifies the signature, wallet match, expiry, nonce, and one-time
use before calling the funding-proof service.

## 7. Solana safety and transaction contract

### Non-negotiable advertiser-wallet rule

The connected advertiser wallet must never transfer funds or pay a fee.

- Allowed frontend wallet methods: connect, disconnect, `signMessage`.
- Forbidden frontend wallet methods: `sendTransaction`, `signTransaction`,
  `signAllTransactions`.
- Never build a `SystemProgram.transfer` from the connected wallet.
- Never make the connected wallet the fee payer.
- Never add an advertiser-wallet transfer fallback.
- A wallet that lacks `signMessage` gets a clear English unsupported-wallet
  state; it does not fall back to a transaction.

### Server devnet wallet

Only the server demo wallet submits transactions. It contains faucet-issued
devnet SOL only and pays all fees.

The Solana service must refuse to initialize unless:

```text
SOLANA_CLUSTER === 'devnet'
RPC URL is explicitly configured for devnet
server secret parses as the expected keypair
host public key is valid
```

Never log or return the secret key.

### Funding proof

After successful message verification, the server submits a memo-only devnet
transaction paid by the server demo wallet:

```text
LocalLoop|proof|simulate-funding|campaign:magnolia-develop-the-night
```

Only after `confirmed` commitment:

- Store the signature and Explorer URL.
- Mark campaign `simulated_funded`.
- Label the budget `Simulated budget`.

No SOL moves from the connected advertiser wallet.

### Host payout

After Magnolia validates `LL-NINO-001`, the server sends:

```text
server demo wallet
→ DEMO_HOST_PUBLIC_KEY
→ 0.005 faucet-issued devnet SOL
→ Memo:
  LocalLoop|payout|campaign:magnolia-develop-the-night|deal:camora-deal|claim:LL-NINO-001
```

After confirmation:

- Store signature and Explorer URL.
- Mark payout `paid`.
- Reduce the simulated ledger balance to `0.045`.
- Broadcast a new state revision.

The payout service must lock by claim ID before sending. Repeated validation or
retry after a known confirmation returns the existing transaction rather than
sending another payout.

### Explorer URL

```text
https://explorer.solana.com/tx/{signature}?cluster=devnet
```

### Required environment

```bash
PORT=3001
SOLANA_CLUSTER=devnet
SOLANA_RPC_URL=https://api.devnet.solana.com
DEMO_TREASURY_SECRET_KEY=server_only_base58_secret
DEMO_HOST_PUBLIC_KEY=replace_with_camora_demo_address
VITE_SOLANA_CLUSTER=devnet
VITE_SOLANA_RPC_URL=https://api.devnet.solana.com
```

`DEMO_TREASURY_SECRET_KEY` is server-only. Never expose it through `VITE_*`,
source code, logs, state, or API responses. Commit `.env.example`, never `.env`
or generated keypair files.

Run `npm run solana:check` to verify cluster=`devnet`, RPC reachability, treasury
secret parse (public address + balance only), and host public key validity.
The command must never print the private key. When configuration is missing,
`/api/health` returns `solanaReady: false` and Solana mutations fail with clear
retryable guidance instead of fabricating Explorer URLs.

Implementation references: [Solana clusters and devnet](https://solana.com/docs/core),
[official devnet faucet](https://faucet.solana.com/), and
[Solana memo payments](https://solana.com/docs/payments/send-payments/payment-with-memo).

## 8. English language contract

All app-owned user-facing copy must be clear, natural English: navigation,
headings, buttons, helper text, wallet guidance, status labels,
loading/error/empty states, reward terms, and demo controls.

Keep official business names, `LocalLoop`, addresses, wallet addresses,
transaction signatures, IDs, `SOL`, `devnet`, and URLs in conventional form.
Third-party wallet dialogs and Solana Explorer are outside the app’s copy
scope.

Set `<html lang="en">`.

Canonical copy:

```text
Campaign: "Develop the Night"
Reward: "10 ₾ off film development and scanning on orders over 40 ₾"
Demo mode: "Demo mode"
Fund action: "Simulate campaign funding"
Verify visit: "Verify Camora visit"
Redemption request: "Request reward redemption"
Validate redemption: "Validate redemption"
Funding label: "Simulated budget"
Devnet label: "Demo settlement on Solana devnet"
Reset: "Reset demo"
Claim: "Locked" → "Unlocked" → "Redemption requested" → "Redeemed"
Payout: "Not ready" → "Pending" → "Processing" → "Paid"
```

Internal enums remain code identifiers. Convert them at the presentation
boundary through a central copy/status map; do not scatter alternate labels
through pages.

## 9. Design and brand contract

The visual system is open by design. Industrial/editorial and newspaper cues
are strong options for the local-business story, and selective neobrutalist
details can add energy, but no single reference is mandatory.

There is no required color palette, paper background, border weight, shadow
style, or font stack. Choose a compact tokenized system and apply it coherently.
Editorial type hierarchy, utilitarian grids, rules, labels, stamps, ink/paper
texture, monochrome or limited-color palettes, and selective monospace are
useful ingredients—not a checklist. Gradients, photography, illustration,
softer forms, texture, and motion are also valid when they support the concept.

Usability guardrails:

- Mobile-first at 375px and fully usable on desktop.
- Minimum 44px touch targets.
- Readable typography and accessible color contrast.
- Visible focus, disabled, loading, success, empty, and error states.
- Clear hierarchy for campaign, deal, claim, wallet, and transaction data.
- A consistent family resemblance across customer, advertiser, and host views.

Avoid generic crypto/SaaS dashboard clichés, illegible decorative effects,
and decoration without a role in hierarchy or storytelling. Creative choices
within these guardrails do not need a special prompt or approval.

---

# LL-101 — Scaffold the full-stack foundation and shared contracts

**Priority:** P0  
**Owner:** Foundation agent  
**Dependencies:** None  
**Primary ownership:** root configuration, `shared/`, `src/app/`, common
components, copy, and styles

## Goal

Create the executable TypeScript foundation and contracts that every other
epic can implement against without inventing alternate architecture.

## Scope

- Initialize React + Vite + TypeScript and Node + Express in one repository.
- Add required scripts for dev, typecheck, build, and production start.
- Configure the Vite `/api` proxy and Express static serving after build.
- Add React Router and all canonical routes plus demo aliases.
- Define shared domain types, IDs, state enums, API envelopes, and payload types.
- Create an API client and a placeholder `DemoStateProvider` interface that
  LL-102 will connect to real endpoints.
- Build `AppShell`, `DemoPersonaSwitcher`, `BusinessWorkspaceSwitcher`,
  `StatusBadge`, `TransactionReceipt`, and `DemoResetButton` primitives.
- Establish centralized English copy and status mappings.
- Establish design tokens and responsive global styles.
- Create `.env.example`, `.gitignore`, `AGENTS.md`, and `CLAUDE.md`.

## `AGENTS.md` and `CLAUDE.md` requirements

Both files must state:

- This is a new full-stack demo, not a POC refactor.
- Frontend/backend/shared ownership boundaries.
- Required scripts and validation commands.
- Canonical routes and demo aliases.
- Advertiser/host are business capabilities, not fixed business types.
- Server state is authoritative; frontend state is a projection.
- No database or Docker by default.
- English-copy requirements and centralized presentation labels.
- Flexible visual direction and non-negotiable usability guardrails.
- The connected wallet may use `signMessage` only and must never send a
  transaction or pay a fee.
- Server-only devnet secrets must never enter browser code or Git.
- Do not edit another active owner’s files without coordination.
- Every meaningful integration finishes with typecheck and build.

`AGENTS.md` is detailed and canonical. `CLAUDE.md` is concise but must not omit
safety or architecture rules.

## Acceptance criteria

- `npm install`, `npm run dev`, `npm run typecheck`, and `npm run build` work.
- Vite and Express run together from `npm run dev`.
- Direct navigation and refresh work for every canonical route.
- Demo aliases resolve to the correct seeded IDs.
- Business workspace routing checks the selected capability.
- `<html lang="en">` is set.
- UI typography is explicitly chosen, readable, and applied consistently.
- Common components work at 375px and desktop widths.
- Shared types contain no duplicated business-specific string literals.
- `AGENTS.md` and `CLAUDE.md` contain every required contract above.

## Out of scope

- Real server domain behavior.
- Feature-complete customer, advertiser, or host pages.
- Wallet connection and Solana transactions.

---

# LL-102 — Implement server-owned state, REST API, and live synchronization

**Priority:** P0  
**Owner:** Platform agent  
**Depends on:** LL-101 shared contracts  
**Primary ownership:** `server/domain/`, `server/api/`, `src/app/DemoStateProvider.tsx`,
`src/lib/api.ts`, and `src/lib/events.ts`

## Goal

Make the three views projections of one validated server-owned demo state and
keep them synchronized across tabs.

## Scope

- Implement the complete seeded `DemoState` in `server/domain/seed.ts`.
- Implement a singleton in-memory store with monotonic revisions,
  subscriptions, reset, and immutable snapshots.
- Implement transition functions for deal approval, visit verification, claim
  unlock, redemption request, validation, payout state, and transaction state.
- Expose the required REST endpoints and structured errors.
- Implement SSE at `/api/events` with heartbeat cleanup and revision events.
- Implement `DemoStateProvider` to fetch, subscribe, refetch on newer revisions,
  recover after disconnect, and expose mutation helpers.
- Make all frontend domain updates originate from server responses or refetches.
- Implement `POST /api/demo/reset` and ensure reset broadcasts a revision.
- Add focused transition and API tests if the repository test runner is
  available; otherwise add a deterministic smoke script.

## Transition requirements

- Deal approval is rejected before simulated funding.
- Visits are rejected before deal activation.
- Visit count cannot exceed three.
- The third visit unlocks `LL-NINO-001` exactly once.
- Redemption request is accepted only for an unlocked claim.
- Validation is accepted only for a requested redemption.
- Repeated validation cannot create a second payout operation.
- Reset returns visits to one, claim to locked, campaign to draft, deal to
  proposed, payout to not-ready, budget to 0.05, and transactions to empty.

LL-102 may use an injected test double for funding-proof/payout behavior while
LL-105 is in progress. Keep it behind a server-side interface, never fabricate
an Explorer URL, and remove the runtime test double before final integration.

## Acceptance criteria

- Opening customer, advertiser, and host routes in separate tabs shows the same
  revision.
- A mutation in one tab updates the other tabs without manual refresh.
- Killing and restarting the frontend connection recovers by refetching state.
- Invalid transitions return stable error codes and clear English messages.
- Rapid duplicate clicks do not duplicate visits, claims, or payouts.
- Reset synchronizes every open tab.
- The browser contains no independent authoritative reducer.
- API responses never expose stack traces or secrets.
- `npm run typecheck` and `npm run build` succeed.

## Out of scope

- Wallet challenge verification.
- Actual Solana RPC calls.
- Final feature-page visual polish.

---

# LL-103 — Build the customer and host acquisition journey

**Priority:** P0  
**Owner:** Customer/host agent  
**Depends on:** LL-101 and LL-102 contracts  
**Primary ownership:** `src/features/customer/` and `src/features/host/`

## Goal

Build the real-world half of the demo: Camora accepts the deal and verifies
visits; Nino sees progress, unlocks the Magnolia reward, and requests
redemption.

## Customer view

Required content:

- Nino identity and clear demo-mode framing.
- Camora × Magnolia relationship.
- Campaign name and English reward terms.
- Progress from 1/3 to 3/3 using a memorable stamp/film-frame visual.
- Locked, unlocked, redemption-requested, and redeemed claim states.
- Claim ID `LL-NINO-001` in technical typography.
- Reward terms and one-time-use explanation.
- Status history showing which business performed each verification.
- "Request reward redemption" action only when unlocked.
- Loading, rejection, and already-completed behavior.

## Host view

Required content:

- Camora identity and host workspace context.
- Incoming Magnolia deal with reward, requirement, and payout terms.
- Approve action, disabled until campaign is simulated-funded.
- A permanent LocalLoop QR/pass placement visual; no real camera scanning.
- Clearly restricted staff verification mode.
- "Verify Camora visit" action.
- Current customer progress and recent verification history.
- Payout amount, status, and Explorer receipt after LL-105 settlement.
- No campaign-funding or advertiser budget controls in staff mode.

## Happy path

```text
1. Camora approves the simulated-funded Magnolia deal.
2. Nino starts at 1 of 3 visits.
3. Camora verifies two remaining visits.
4. Customer tab updates live after each verification.
5. LL-NINO-001 becomes "Unlocked" at 3 of 3.
6. Nino requests redemption.
7. Claim becomes "Redemption requested".
8. After LL-104 validation and LL-105 payout, both views show completion.
```

## Acceptance criteria

- Claim cannot unlock before three verified visits.
- A fourth visit is impossible.
- A locked or already-used claim cannot request redemption.
- Host and customer tabs update without refresh.
- Staff controls are visibly distinct from business financial controls.
- Payout `processing`, `failed`, retry, and `paid` states render clearly.
- Explorer receipt uses the server-provided URL.
- All app-owned copy follows the English language contract.
- All interactions work at 375px with minimum 44px targets.
- `npm run typecheck` and `npm run build` succeed.

## Out of scope

- Camera access or real QR scanning.
- Authentication.
- Real POS integration.
- Solana implementation details owned by LL-105.

---

# LL-104 — Build the advertiser workspace and dual-capability business UX

**Priority:** P0  
**Owner:** Advertiser agent  
**Depends on:** LL-101 and LL-102 contracts  
**Primary ownership:** `src/features/advertiser/` and business-workspace UX

## Goal

Build Magnolia’s campaign workspace, prove the multi-host model, and make it
clear that advertiser and host are switchable business capabilities rather than
fixed account types.

## Advertiser workspace

Required content:

- Magnolia identity and advertiser workspace label.
- Campaign "Develop the Night" with lifecycle status.
- Strong disclosure that the budget is simulated and no wallet transfer occurs.
- Budget summary: total 0.05, reserved, paid, and remaining simulated SOL.
- Camora deal: working demo path, 0.005 devnet SOL payout.
- TSRE Gym deal: separate proposed mock path, 0.007 devnet SOL payout.
- Clear distinction between campaign state and each deal’s state.
- Wallet connection, signed-authorization, proof-pending, confirmed, retry, and
  unsupported-wallet states supplied by LL-105.
- Funding-proof receipt with Explorer link.
- Incoming redemption request for `LL-NINO-001`.
- "Validate redemption" action.
- Payout progress and final Camora receipt.
- Claims, redemption, payout count, and remaining-budget summary.
- Mock "Add partner" interaction may add a local presentation-only card
  but must not mutate canonical demo economics.

## Dual-capability UX

- Show `BusinessWorkspaceSwitcher` inside a business context, not as a global
  actor selector.
- Magnolia defaults to advertiser; its host workspace shows a concise English
  empty state when selected.
- Camora defaults to host; its advertiser workspace shows a concise English
  empty state when selected.
- The demo persona switcher keeps fixed Nino/Magnolia/Camora shortcuts and is
  labelled "Demo mode".
- Switching a business workspace preserves the selected business identity.
- Do not use wording that implies every business must choose one permanent role.

## Acceptance criteria

- Campaign and deal are visually and semantically distinct.
- Camora and TSRE Gym appear as two independent deals under one campaign.
- Funding action cannot imply a transfer from Magnolia’s connected wallet.
- Campaign becomes simulated-funded only after LL-105 confirms the proof.
- Redemption validation is unavailable until Nino requests it.
- Repeated validation cannot create a second payout.
- Remaining simulated budget becomes 0.045 only after confirmed payout.
- Both workspaces enforce the selected business capability.
- Demo persona switching and business workspace switching cannot be confused.
- All app-owned copy follows the English language contract.
- `npm run typecheck` and `npm run build` succeed.

## Out of scope

- Real campaign creation marketplace.
- Host discovery or maps.
- Real analytics backend.
- Production role-based access control.
- Actual Solana code owned by LL-105.

---

# LL-105 — Integrate safe wallet authorization and real Solana devnet receipts

**Priority:** P0  
**Owner:** Solana/integration agent  
**Depends on:** LL-101 shared contracts; integrates with LL-102 and LL-104  
**Primary ownership:** `src/lib/wallet.ts`, wallet UI components,
`server/wallet/`, `server/solana/`, and Solana environment handling

## Goal

Deliver the technical proof point without sending any transaction from the
connected advertiser wallet.

## A. Wallet connection and challenge signing

- Connect a Wallet Standard-compatible Solana wallet.
- Display shortened public key.
- Request a challenge from `POST /api/wallet/challenge`.
- Show the exact safety-oriented plaintext before asking for a signature.
- Call `signMessage` on the exact UTF-8 bytes.
- Submit `challengeId`, address, and base58 signature to the funding endpoint.
- Handle missing wallet, rejected connection, rejected signature, expired
  challenge, replay, unsupported `signMessage`, and verification failure.
- Never import or call transaction-signing helpers in the advertiser-wallet
  flow.

## B. Server verification

- Generate cryptographically random one-time nonces.
- Bind each challenge to wallet, campaign, exact message, and expiry.
- Verify Ed25519 signature bytes against the wallet public key.
- Consume the challenge atomically.
- Reject modified messages, wrong wallet addresses, expired challenges, and
  replayed challenge IDs.
- Never log the full signature challenge record unnecessarily.

## C. Funding-proof transaction

- Load and validate the server demo keypair only on the backend.
- Refuse any cluster other than `devnet`.
- Build a server-paid memo-only transaction using the canonical funding memo.
- Simulate before sending when practical, then send and confirm.
- Return signature, Explorer URL, confirmation status, and transaction type.
- Mark campaign simulated-funded only after confirmation.
- On failure, leave campaign unfunded, show clear English retry guidance, and never
  fall back to a connected-wallet transaction.

## D. Host payout

- On advertiser validation, atomically set payout to processing.
- Build one server-paid devnet SOL transfer to `DEMO_HOST_PUBLIC_KEY` with the
  canonical payout memo.
- Send exactly 0.005 devnet SOL.
- Confirm before marking paid or reducing simulated budget.
- Store and return the receipt.
- Enforce an in-memory idempotency lock and existing-signature reuse by claim ID.
- On failure, retain a retryable failed payout without rolling the claim back to
  unlocked.

## E. Receipt UI

- Show funding proof in advertiser view.
- Show payout receipt in advertiser and Camora host views.
- Display shortened signature, transaction type, status, cluster, timestamp,
  and Explorer link.
- Label all transactions as devnet demo activity.
- Never use words suggesting production escrow or real advertiser funding.

## Acceptance criteria

- Connecting the advertiser wallet causes no balance change.
- The frontend never invokes `sendTransaction`, `signTransaction`, or
  `signAllTransactions`.
- Rejecting the message signature leaves campaign state unchanged.
- A modified or replayed challenge is rejected.
- A real funding-proof signature appears on Solana Explorer devnet.
- A real 0.005 devnet SOL payout appears on Explorer after validation.
- Both memos contain the canonical IDs.
- The advertiser wallet is neither source nor fee payer of either transaction.
- Repeating validation or retry after success does not send a second payout.
- Invalid/missing server config fails safely with clear English UI guidance.
- No private key appears in the client bundle, source, logs, Git, or API output.
- `npm run typecheck` and `npm run build` succeed.

## Explicitly forbidden fallbacks

- Advertiser-wallet-to-vault transfer.
- Advertiser-wallet-to-host transfer.
- Zero-lamport transaction from the connected wallet.
- Connected wallet as fee payer for a memo.
- Fake transaction signature or fabricated Explorer URL.
- Silent switch to mainnet.

---

## 10. Integration order and ownership

Recommended sequence:

```text
1. LL-101 establishes executable foundation and freezes shared contracts.
2. LL-102 and LL-105 implement server state and Solana boundaries in parallel.
3. LL-103 and LL-104 build against shared contracts and API fixtures.
4. Integrate real API responses and SSE; remove fixtures.
5. Run the exact final demo and failure-path rehearsal.
```

Coordination rules:

- Shared types and IDs are changed only with all dependent owners notified.
- Feature agents do not implement competing client-side domain stores.
- Only LL-105 code may access the server demo secret.
- Do not edit another active owner’s files without coordination.
- Every meaningful integration runs typecheck and build.
- Keep this file and `CONTEXT_HANDOVER.md` synchronized in the same change.
- If the documents conflict, reconcile them before implementation.

## 11. Shared final rehearsal

### Happy path

```text
1. Start frontend and API; open /customer, /advertiser, and /host in separate tabs.
2. Confirm all tabs show the same revision and seeded state.
3. In /advertiser, connect Magnolia’s wallet.
4. Read and sign the plaintext simulated-funding authorization.
5. Confirm no wallet transaction was requested and no wallet balance changed.
6. Wait for the real server-funded devnet proof confirmation.
7. Open its Explorer URL and verify the funding-proof memo.
8. In /host, approve the Camora deal.
9. Verify Nino’s two remaining visits.
10. Watch /customer reach 3 of 3 and unlock LL-NINO-001 without refresh.
11. Request redemption from /customer.
12. Validate redemption from Magnolia’s advertiser workspace.
13. Watch payout progress and Camora become "Paid".
14. Open the payout in Explorer and verify amount, host address, and memo.
15. Confirm remaining simulated budget is 0.045 SOL.
16. Use "Reset demo" and confirm every tab returns to seed state.
```

### Required failure-path rehearsal

```text
1. Reject wallet message signature; campaign stays draft.
2. Try approving Camora before funding proof; API rejects it safely.
3. Try requesting redemption before three visits; API rejects it safely.
4. Double-click visit verification; count never exceeds three.
5. Repeat redemption validation after payout; no second transaction is sent.
6. Disconnect SSE briefly; the tab reconnects and refetches current state.
7. Remove server Solana config; service fails safely and never requests a wallet transaction.
```

## 12. Cut line

The following are mandatory P0 and cannot be cut:

1. Wallet message authorization with no connected-wallet transaction.
2. Server-owned validated state and the complete Camora journey.
3. Real server-funded devnet funding proof and Explorer link.
4. Real server-funded Camora payout and Explorer link.
5. Live synchronization across the three views.
6. Dual-capability business modeling and unambiguous navigation.
7. Wallet safety, secret isolation, clear English core copy, and truthful
   simulated-funding labels.

Cut optional work in this order:

1. Decorative motion and secondary visual polish.
2. Interactive add-partner sheet; keep the two seeded deal cards.
3. Rich opposite-workspace empty states; retain the workspace switcher and a
   minimal localized empty state.
4. Extra analytics beyond the required counts and budget values.

Do not cut TSRE Gym’s seeded card because it is the primary proof that one
campaign supports multiple host deals.
