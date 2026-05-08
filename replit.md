# NeuroVault Enterprise

Decentralized AI memory infrastructure with wallet-only auth (RainbowKit/wagmi), on-chain agent identity on the 0G Mainnet, AES-256-GCM encrypted memory on 0G Storage, and a Gemini 2.5 Flash–powered OpenClaw multi-agent orchestrator (Memory → DevOps → Privacy → Billing).

## Run & Operate
- `npm run dev` — Express + Vite on port 5000
- `npm run build` — production build via `scripts/build.ts`
- `npm run check` — TypeScript type check
- `ZG_PRIVATE_KEY=0x... npx tsx scripts/deploy.ts` — deploy `AgentRegistry.sol` to 0G Mainnet (or click Deploy Contract in Admin panel)

Required secrets: `GOOGLE_API_KEY` (already set — Gemini 2.5 Flash).
Key secret: `ZG_PRIVATE_KEY` (funded 0G wallet) — activates **both** live 0G Storage uploads and contract deploy. Public mainnet RPC endpoints are used by default (`https://evmrpc.0g.ai`, indexer `https://indexer-storage.0g.ai`), so no extra RPC env vars are needed.
Optional env vars: `NEUROVAULT_ENCRYPTION_KEY`, `ZG_RPC_URL` (default `https://evmrpc.0g.ai`), `ZG_INDEXER_RPC` (default `https://indexer-storage.0g.ai`), `ZG_CHAIN` (default `0g-mainnet`), `AGENT_REGISTRY_ADDRESS`, `COMPUTE_PROVIDER`, `VITE_WALLETCONNECT_PROJECT_ID`.

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
- `server/orchestrator.ts` — OpenClaw: Memory→DevOps→Billing→Gemini→Privacy (integrationContext injected)
- `server/routes.ts` — 11 API groups incl. `/api/integrations` (CRUD + live test), `/api/contracts/deploy` (with RPC health check + balance validation)
- `server/lib/{encryption,zeroGStorage,zeroGCompute,embeddings,contract}.ts`
- `server/lib/zeroGStorage.ts` — `isConfigured()` requires only `ZG_PRIVATE_KEY`; defaults RPC to `https://evmrpc.0g.ai` and indexer to `https://indexer-storage.0g.ai`
- `server/storage.ts` — `IStorage` + `MemStorage` (incl. Integration CRUD)
- `contracts/AgentRegistry.sol` — on-chain agent registry (9 ABI entries, 2738 bytes)
- `client/src/lib/{wagmi,web3Providers,api}.ts(x)` — Web3 + API helpers (incl. integration + deploy APIs)
- `client/src/pages/IntegrationsPage.tsx` — real backend-stored integrations, live connection testing, per-credential modal
- `client/src/pages/AgentMarketplacePage.tsx` — real install → creates agents via POST /api/agents
- `client/src/pages/AdminPanelPage.tsx` — infrastructure status checklist + Deploy Contract button
- `shared/schema.ts` — Drizzle + Zod schema + Integration interface + AGENT_ROLES

## Architecture decisions
- **Gemini 2.5 Flash is the only LLM**: `gemini-2.5-flash` via `@google/generative-ai`. All agents call `agentReason()`.
- **Wallet = identity**: workspace keyed by `ownerWallet`. No users table, no passwords.
- **Privacy Agent always runs last** in the orchestrator — PII redacted before any response leaves.
- **0G Storage active with just ZG_PRIVATE_KEY**: public mainnet RPC defaults baked in; falls back to `.0g-fallback-cache/` only when key is absent.
- **AES-256-GCM** per-record encryption; PII regex scan runs BEFORE encryption.
- **Integrations are real**: credentials stored in MemStorage, live connection test on every connect (Slack webhook, GitHub API, Notion API, etc.). Connected integrations injected into orchestrator system prompt.
- **Marketplace install is real**: POST /api/agents with `source=marketplace` + `marketplaceId`. Shows agent UUID after install.
- **Deploy pipeline is production-grade**: RPC health check (HTML response detection) + balance check + step-by-step server logging before any tx is sent.
- Express 5 path-to-regexp v8: named params only, no `(.*)`.
- Default chain: **0G Mainnet** (chainId 16660). Override with `ZG_CHAIN=0g-galileo` for testnet.

## Product
- `/auth` — RainbowKit wallet connect → auto-creates workspace → redirects to `/dashboard`
- `/dashboard` — live stats + Gemini AI insights panel
- `/copilot` — Gemini 2.5 Flash chat + OpenClaw orchestration + integration context
- `/memory` — live memory list (Gemini auto-summary + tags + category), inline ingest
- `/agents/new` — real agent creation (POST /api/agents)
- `/marketplace` — 8 marketplace agents, "Install Agent" creates real agents with UUIDs
- `/integrations` — 12 integrations, real credential storage + live connection testing
- `/billing` — real-time cost from workspace activity
- `/admin` — infrastructure status (0G Storage/Contract/AgentID/Compute/Privacy), Deploy Contract button, audit log

## User preferences
- Wallet-only auth (no email/password).
- Gemini 2.5 Flash as sole LLM provider.
- Default to 0G Mainnet; testnet available via `ZG_CHAIN=0g-galileo`.
- All mock/placeholder/static data removed — everything is real-time API-driven.
- Integrations must be real (backend-stored, live-tested), not fake toggles.

## Gotchas
- **Gemini model**: use `gemini-2.5-flash` — `gemini-1.5-pro` returns 404 on this API key.
- `WagmiProvider` requires `QueryClientProvider` as ancestor.
- WalletConnect/Reown logs a harmless 403 in dev.
- `@0glabs/0g-ts-sdk` deprecated upstream; wrapper falls back to local disk on any SDK error.
- In-memory storage resets on server restart.
- Deploy wallet: `0xB80232b4395e9cb595856F869614d49a58da8B1b` — fund from faucet.0g.ai then ensure `ZG_PRIVATE_KEY` secret is set.
- `/api/contracts/deploy` does RPC health check first — will return clear error if RPC returns HTML instead of JSON.

## Pointers
- Google AI Studio: <https://aistudio.google.com>
- 0G docs: <https://docs.0g.ai>
- 0G Galileo faucet: <https://faucet.0g.ai>
- 0G Mainnet explorer: <https://chainscan.0g.ai>
- RainbowKit: <https://www.rainbowkit.com>
