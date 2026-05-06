# NeuroVault Enterprise

> **Decentralized AI memory infrastructure for enterprise.** Wallet-only auth, on-chain agent identity, encrypted persistent memory on the [0G chain](https://0g.ai), and an OpenClaw-style multi-agent orchestrator.

---

## ✨ What it is

NeuroVault is the cognitive backbone for enterprise AI. Every agent gets a wallet-bound identity registered on the 0G chain, every memory is AES-256 encrypted before being persisted to 0G Storage, and every workflow is coordinated by a four-agent orchestrator (Memory → DevOps → Privacy → Billing).

| Layer | Implementation |
|---|---|
| **Auth** | Wallet-only via RainbowKit / wagmi / viem. Address = workspace identity. |
| **Storage** | 0G Storage SDK with transparent local-disk fallback when env vars unset. |
| **Compute** | Pluggable inference layer; defaults to a deterministic templated provider. Wire up 0G Compute or OpenAI by setting `COMPUTE_PROVIDER`. |
| **Privacy** | AES-256-GCM (TEE-simulated) + sensitive-data detector and redactor (PII / SSN / API keys). |
| **Identity** | `AgentRegistry.sol` deployed to 0G Galileo testnet (or mainnet). |
| **Orchestration** | OpenClaw-pattern: Memory Agent → DevOps Agent → Billing Agent → Compute → Privacy Agent (always last). |

---

## 🚀 Run it

```bash
npm install
npm run dev          # http://localhost:5000
```

The app boots on a single port. The Express server hosts both the API (`/api/*`) and the React SPA. **No env vars are required to run** — when `ZG_*` keys are missing, storage transparently falls back to a local cache, the compute layer simulates inference, and contract calls return `null`.

### Optional environment variables

| Var | Purpose |
|---|---|
| `NEUROVAULT_ENCRYPTION_KEY` | Passphrase for AES-256-GCM key derivation. **Set this in production.** |
| `ZG_RPC_URL` | 0G EVM RPC for storage uploads. |
| `ZG_INDEXER_RPC` | 0G Storage Indexer endpoint. |
| `ZG_PRIVATE_KEY` | Deployer / uploader private key. **Server-side only.** |
| `ZG_CHAIN` | `0g-galileo` (default) or `0g-mainnet`. |
| `ZG_MAINNET_RPC` | Override mainnet RPC when ready to switch. |
| `AGENT_REGISTRY_ADDRESS` | Address of the deployed AgentRegistry contract. Auto-loaded from `contracts/deployments.json` after deploy. |
| `COMPUTE_PROVIDER` | `simulated` (default) / `0g` / `openai`. |
| `VITE_WALLETCONNECT_PROJECT_ID` | WalletConnect Cloud project ID for mobile-wallet support. |

---

## ⛓️ Deploy AgentRegistry to the 0G chain

```bash
# Galileo testnet (default)
ZG_PRIVATE_KEY=0x... npx tsx scripts/deploy.ts

# Mainnet (when you're ready)
ZG_PRIVATE_KEY=0x... ZG_CHAIN=0g-mainnet npx tsx scripts/deploy.ts
```

The script compiles `contracts/AgentRegistry.sol` with `solc`, deploys with `ethers`, and writes the resulting address + tx hash + explorer URL to `contracts/deployments.json`. The server picks up the address automatically on its next request — no restart required.

> Need testnet 0G? Faucet: <https://faucet.0g.ai>

---

## 🧠 OpenClaw orchestrator flow

```
POST /api/orchestrator/run
       │
       ▼
 ┌────────────────┐
 │ Memory Agent   │ ◀─ retrieves top-K relevant memories (cosine sim on embeddings)
 └────────┬───────┘
          ▼
 ┌────────────────┐
 │ DevOps Agent   │ ◀─ classifies query (incident/perf/deploy), recommends actions
 └────────┬───────┘
          ▼
 ┌────────────────┐
 │ Billing Agent  │ ◀─ tallies API/storage/vector spend, monetization hints
 └────────┬───────┘
          ▼
 ┌────────────────┐
 │ Compute Layer  │ ◀─ inference job (templated → 0G Compute / OpenAI)
 └────────┬───────┘
          ▼
 ┌────────────────┐
 │ Privacy Agent  │ ◀─ ALWAYS LAST: redacts PII before returning to caller
 └────────┬───────┘
          ▼
   final response + per-step trace + audit log entry
```

---

## 🌐 API surface

| Group | Endpoints |
|---|---|
| **Wallet** | `POST /api/wallet/connect`, `GET /api/wallet/:address` |
| **Workspaces** | `GET /api/workspaces/:id`, `GET /api/workspaces/:id/audit` |
| **Agents** | `GET/POST /api/agents`, `GET /api/agents/:id`, `POST /api/agents/:id/onchain` |
| **Memory** | `GET/POST /api/memory`, `GET /api/memory/:id` |
| **Storage** | `GET /api/storage/status`, `GET /api/storage/ref/:ref` |
| **Privacy** | `POST /api/privacy/scan` |
| **Orchestrator** | `POST /api/orchestrator/run` |
| **Contracts** | `GET /api/contracts/status`, `GET /api/contracts/agents/:id` |
| **System** | `GET /api/system/health` |

All write endpoints validate input with Zod schemas and append entries to the workspace's audit log.

---

## 🗂 Repository map

```
contracts/
  AgentRegistry.sol            # On-chain agent identity registry
  deployments.json             # (generated) deployed addresses per chain
scripts/
  deploy.ts                    # solc compile + ethers deploy → 0G chain
server/
  agents/{memory,devops,privacy,billing}Agent.ts
  lib/
    encryption.ts              # AES-256-GCM, sensitive-data detector + redactor
    zeroGStorage.ts            # 0G Storage SDK wrapper + local fallback
    zeroGCompute.ts            # Pluggable inference layer
    embeddings.ts              # Hash-based vector embeddings
    contract.ts                # Chain config, ABI, read helpers
  orchestrator.ts              # OpenClaw multi-agent coordinator
  routes.ts                    # 8-group REST API
  storage.ts                   # IStorage interface (in-memory)
  index.ts                     # Express + Vite + http server
client/src/
  lib/wagmi.ts                 # 0G Galileo + Mainnet wagmi config
  lib/web3Providers.tsx        # WagmiProvider + RainbowKit + QueryClient
  pages/AuthPage.tsx           # Wallet-only sign in
  pages/{Dashboard,Agents,Memory,Marketplace,...}
shared/
  schema.ts                    # Drizzle + Zod (workspaces, agents, memories, audit)
```

---

## 🔐 Security defaults

- AES-256-GCM with per-record salt + IV. Authentication tag verified on decrypt.
- Sensitive-data detection runs **before** encryption AND on inference output (privacy agent always runs last).
- Private keys never touch the browser. Only `VITE_*` env vars are bundled.
- Storage layer never logs cleartext. Audit log records the storage-ref + backend, not the payload.

---

## 🏗 Tech stack

React 18 · Vite 7 · Wouter · TanStack Query 5 · Tailwind 3 · Radix UI · Framer Motion · Express 5 · TypeScript 5.6 · Drizzle ORM · wagmi 2 · viem 2 · RainbowKit 2 · ethers 6 · `@0glabs/0g-ts-sdk` · solc · Node 20.

---

## License

MIT
