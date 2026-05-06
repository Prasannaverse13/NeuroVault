# NeuroVault Enterprise

Decentralized AI memory infrastructure with wallet-only auth (RainbowKit/wagmi), on-chain agent identity on the 0G chain, AES-256-GCM encrypted memory on 0G Storage, and a Gemini 2.5 Flash–powered OpenClaw multi-agent orchestrator (Memory → DevOps → Privacy → Billing).

## Run & Operate
- `npm run dev` — Express + Vite on port 5000
- `npm run build` — production build via `scripts/build.ts`
- `npm run check` — TypeScript type check
- `ZG_PRIVATE_KEY=0x... npx tsx scripts/deploy.ts` — deploy `AgentRegistry.sol` to 0G

Required secrets: `GOOGLE_API_KEY` (already set — Gemini 2.5 Flash).
Optional env vars: `NEUROVAULT_ENCRYPTION_KEY`, `ZG_RPC_URL`, `ZG_INDEXER_RPC`, `ZG_PRIVATE_KEY`, `ZG_CHAIN` (default `0g-galileo`), `AGENT_REGISTRY_ADDRESS`, `VITE_WALLETCONNECT_PROJECT_ID`. None required to run — graceful fallbacks.

## Stack
- Node 20, TS 5.6
- Frontend: React 18, Vite 7, Wouter, TanStack Query 5, Tailwind 3, Radix UI, wagmi 2 + viem 2 + RainbowKit 2
- Backend: Express 5
- AI: **@google/generative-ai** — Gemini 2.5 Flash (model: `gemini-2.5-flash`)
- Web3: ethers 6, `@0glabs/0g-ts-sdk`, solc (deploy-time)
- ORM: Drizzle (in-memory store)

## Where things live
- `server/lib/gemini.ts` — Gemini client: `generateText`, `chatWithHistory`, `generateJSON`, `summarizeMemory`, `generateInsights`, `agentReason`
- `server/agents/{memory,devops,privacy,billing}Agent.ts` — Gemini-powered agents
- `server/orchestrator.ts` — OpenClaw: Memory→DevOps→Billing→Gemini→Privacy
- `server/routes.ts` — 10 API groups incl. `/api/copilot/chat`, `/api/insights/:id`, `/api/dashboard/stats/:id`
- `server/lib/{encryption,zeroGStorage,zeroGCompute,embeddings,contract}.ts`
- `server/storage.ts` — `IStorage` + `MemStorage`
- `contracts/AgentRegistry.sol` — on-chain agent registry (9 ABI entries, 2738 bytes)
- `client/src/lib/{wagmi,web3Providers,api}.ts(x)` — Web3 + API helpers
- `client/src/pages/` — all pages wired to live APIs (no mock data)
- `shared/schema.ts` — Drizzle + Zod schema

## Architecture decisions
- **Gemini 2.5 Flash is the only LLM**: `gemini-2.5-flash` via `@google/generative-ai`. All agents call `agentReason()`, memory ingest calls `summarizeMemory()`, insights call `generateInsights()`.
- **Wallet = identity**: workspace keyed by `ownerWallet`. No users table, no passwords.
- **Privacy Agent always runs last** in the orchestrator — PII redacted before any response leaves.
- **Storage gracefully degrades**: 0G env vars unset → `.0g-fallback-cache/` with `local:<sha256>` refs.
- **AES-256-GCM** per-record encryption; PII regex scan runs BEFORE encryption.
- **One QueryClientProvider** in `main.tsx` wraps both wagmi (Web3Providers) and the app (App.tsx has no QCP).
- Express 5 path-to-regexp v8: named params only, no `(.*)`.

## Product
- `/auth` — RainbowKit wallet connect → auto-creates workspace → redirects to `/dashboard`
- `/dashboard` — live stats (agents, memories, audit events), Gemini-powered AI insights panel
- `/copilot` — real Gemini 2.5 Flash chat with memory retrieval + OpenClaw orchestration
- `/memory` — live memory list (Gemini auto-summary + tags + category), inline ingest form
- `/agents/new` — real agent creation wizard (POSTs to `/api/agents`)
- `/billing` — real-time cost computed from workspace activity
- `/admin` — real audit log, system health (Gemini/0G/contract status), workspace info

## User preferences
- Wallet-only auth (no email/password).
- Gemini 2.5 Flash as sole LLM provider (gemini-1.5-pro not available on this API key).
- Default to 0G Galileo testnet; mainnet behind `ZG_CHAIN=0g-mainnet`.
- All mock/placeholder/static data removed — everything is real-time API-driven.

## Gotchas
- **Gemini model**: use `gemini-2.5-flash` — `gemini-1.5-pro` returns 404 on this API key (not in v1beta).
- `WagmiProvider` requires `QueryClientProvider` as ancestor — structure: `QCP → WagmiProvider → RainbowKit → App`.
- WalletConnect/Reown logs a harmless 403 in dev; injected wallets (MetaMask) work fine.
- `@0glabs/0g-ts-sdk` deprecated upstream; wrapper falls back to local disk on any SDK error.
- In-memory storage resets on server restart — workspace/agent/memory state is not persisted across restarts.

## Pointers
- Google AI Studio: <https://aistudio.google.com>
- Gemini API docs: <https://ai.google.dev/gemini-api/docs>
- 0G docs: <https://docs.0g.ai>
- RainbowKit: <https://www.rainbowkit.com>
