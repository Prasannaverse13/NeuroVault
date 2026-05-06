# NeuroVault Enterprise

Decentralized AI memory infrastructure with wallet-only auth (RainbowKit/wagmi), on-chain agent identity on the 0G chain, encrypted memory on 0G Storage, and an OpenClaw-style multi-agent orchestrator (Memory → DevOps → Privacy → Billing).

## Run & Operate
- `npm run dev` — Express + Vite on port 5000
- `npm run build` — production build via `script/build.ts`
- `npm run check` — TypeScript type check
- `npm run db:push` — push Drizzle schema (in-memory storage by default)
- `ZG_PRIVATE_KEY=0x... npx tsx scripts/deploy.ts` — deploy `AgentRegistry.sol` to 0G

Optional env vars: `NEUROVAULT_ENCRYPTION_KEY`, `ZG_RPC_URL`, `ZG_INDEXER_RPC`, `ZG_PRIVATE_KEY`, `ZG_CHAIN` (default `0g-galileo`), `AGENT_REGISTRY_ADDRESS`, `COMPUTE_PROVIDER`, `VITE_WALLETCONNECT_PROJECT_ID`. **None required to run** — graceful fallbacks everywhere.

## Stack
- Node 20, TS 5.6
- Frontend: React 18, Vite 7, Wouter, TanStack Query 5, Tailwind 3, Radix UI, Framer Motion, **wagmi 2 + viem 2 + RainbowKit 2**
- Backend: Express 5
- Web3: ethers 6, `@0glabs/0g-ts-sdk`, solc (deploy-time)
- ORM: Drizzle (in-memory store today)

## Where things live
- `contracts/AgentRegistry.sol` — on-chain agent identity registry
- `scripts/deploy.ts` — one-command compile + deploy to 0G
- `server/agents/{memory,devops,privacy,billing}Agent.ts` — agent implementations
- `server/orchestrator.ts` — OpenClaw coordinator
- `server/lib/{encryption,zeroGStorage,zeroGCompute,embeddings,contract}.ts`
- `server/routes.ts` — 8 API groups (wallet, workspaces, agents, memory, storage, privacy, orchestrator, contracts)
- `server/storage.ts` — `IStorage` + `MemStorage`
- `client/src/lib/{wagmi,web3Providers,api}.ts(x)`
- `client/src/pages/AuthPage.tsx` — **wallet-only** auth (replaced email login)
- `shared/schema.ts` — Drizzle + Zod (workspaces, agents, memories, auditLogs, contractMeta)
- `README.md` — public docs, API surface, architecture diagram

## Architecture decisions
- **Wallet = identity**: workspace is keyed by `ownerWallet`. No users table, no passwords.
- **Privacy Agent always runs last** in the orchestrator so PII can never leak through the inference output.
- **Storage gracefully degrades**: when `ZG_*` env vars are unset, payloads are written to `.0g-fallback-cache/` and referenced as `local:<sha256>`.
- **Compute is pluggable**: `COMPUTE_PROVIDER` switches between `simulated`/`0g`/`openai`. Default is deterministic templated output.
- **Default chain = 0G Galileo testnet** (`chainId 16601`); flip `ZG_CHAIN=0g-mainnet` to switch.
- **AES-256-GCM** with per-record salt + IV; auth tag verified on decrypt. PII regex detector runs before encryption.
- Express 5 wildcard routes use `:param` only (no `*` or `(.*)` syntax).

## Product
- `/auth`, `/login`, `/signup` — wallet connect via RainbowKit (auto-creates workspace, redirects to `/dashboard`)
- `/dashboard`, `/agents/new`, `/marketplace`, `/memory`, `/copilot`, `/integrations`, `/billing`, `/privacy`, `/admin` — existing app pages, now wrapped by `DashboardLayout` with live wallet pill + 0G Galileo badge

## User preferences
- Wallet-only auth (no email/password). Email AuthPage was deliberately replaced.
- Default to 0G Galileo testnet; mainnet behind env-flag switch.
- Templated agent responses until an LLM key is added.
- Local fallback memory store when 0G env vars are unset.

## Gotchas
- Express 5 path-to-regexp v8: do NOT use `:ref(*)` or `(.*)` — use named params only.
- `WagmiProvider` must wrap `QueryClientProvider` which must wrap `RainbowKitProvider`.
- WalletConnect/Reown logs a harmless 403 in dev when `VITE_WALLETCONNECT_PROJECT_ID` is the placeholder. Injected wallets (MetaMask) still work.
- `@0glabs/0g-ts-sdk` is marked deprecated upstream; the wrapper falls back to local disk on any SDK error.
- Cartographer warning about `tailwind.config.ts` is harmless.

## Pointers
- 0G docs: <https://docs.0g.ai>
- 0G Galileo explorer: <https://chainscan-galileo.0g.ai>
- RainbowKit: <https://www.rainbowkit.com>
- wagmi: <https://wagmi.sh>
- Workflows skill: `.local/skills/workflows`
- Env secrets skill: `.local/skills/environment-secrets`
