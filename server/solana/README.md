# LocalLoop Solana devnet boundary

This directory is the only application layer allowed to load the demo treasury
secret or submit Solana transactions. The server-owned domain state remains the
orchestrator; Solana provides exact-message authorization receipts and host
settlement, not application state.

- Funding proof is a server-paid memo-only transaction.
- Host payout sends exactly `0.005 SOL` from the server treasury to Camora.
- The connected advertiser wallet only signs a message and never pays a fee.
- Configuration requires `SOLANA_CLUSTER=devnet`, and every submitting flow
  verifies the RPC genesis hash before building a transaction.
- Explorer links are server-provided and always target devnet.

Run `npm run solana:check` for a safe readiness check. It reports only public
addresses and balances; it never prints `DEMO_TREASURY_SECRET_KEY`.

Run `npm test`, `npm run typecheck`, and `npm run build` after changes.
