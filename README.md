# NeuroVault Enterprise

> **Enterprise AI Memory Infrastructure powered by decentralized intelligence.**

[![0G APAC Hackathon](https://img.shields.io/badge/0G-APAC%20Hackathon-6D5EF7?style=for-the-badge)](https://0g.ai)
[![Gemini](https://img.shields.io/badge/Gemini-2.5%20Flash-4285F4?style=for-the-badge)](https://aistudio.google.com)
[![0G Mainnet](https://img.shields.io/badge/0G-Mainnet-00D3A7?style=for-the-badge)](https://chainscan.0g.ai)
[![Wallet Auth](https://img.shields.io/badge/Wallet--Only-Auth-111827?style=for-the-badge)](https://www.rainbowkit.com)

---

## Project Banner

```text
┌──────────────────────────────────────────────────────────────────────────┐
│ NeuroVault Enterprise                                                    │
│ Decentralized AI memory, live GitHub intelligence, and wallet identity   │
│ for enterprise-grade copilots and autonomous agents — on 0G Mainnet.    │
└──────────────────────────────────────────────────────────────────────────┘
```

## Architecture Visual

```text
Wallet Login (RainbowKit)
        ↓
OpenClaw-style Orchestrator
        ↓
Memory Retrieval Engine  ←→  GitHub Intelligence (live)
        ↓
Gemini AI Reasoning Layer
        ↓
0G Storage (encrypted memory persistence)
        ↓
0G Mainnet Smart Contract / Agent Registry
        ↓
AI Response (Privacy-filtered)
```

---

## 1) Project Overview

NeuroVault Enterprise is an enterprise AI memory infrastructure platform built for teams that need agents to remember, evolve, and retrieve organizational intelligence across sessions — all anchored on decentralized infrastructure.

Traditional copilots fail when context disappears after each chat. NeuroVault solves that by combining wallet-based identity, AES-256-GCM encrypted persistent memory, 0G Mainnet agent registration, and multi-agent orchestration into one AI-native system.

### What it enables

- Persistent enterprise AI memory on 0G Storage
- Multi-agent orchestration (OpenClaw-style)
- On-chain agent identity via `AgentRegistry.sol` on **0G Mainnet**
- Secure knowledge retrieval
- Live GitHub intelligence ingestion into Gemini context
- Wallet-owned agent and workspace identity

---

## 2) Key Features

- **Persistent AI Memory** — AES-256-GCM encrypted, stored on 0G Storage
- **Multi-Agent Orchestration** — Memory → DevOps → Billing → Privacy pipeline
- **Agent Identity System** — On-chain registry on 0G Mainnet
- **Enterprise Knowledge Retrieval** — Vector embedding + cosine similarity search
- **GitHub Intelligence Integration** — Live repos, commits, issues, PRs injected into Gemini context
- **Encrypted Memory Storage** — Per-record AES-256-GCM with PII scanning
- **Wallet-based Ownership** — Address = identity, no passwords
- **Real-time AI Copilot** — Gemini 2.5 Flash + orchestrator + live GitHub data
- **Agent Marketplace** — Install agents that create real on-chain identities
- **Privacy-first Architecture** — Privacy agent always runs last; PII redacted before every response

---

## 3) Track Coverage

### Track 1: Agentic Infrastructure & OpenClaw Lab

OpenClaw-style orchestrator coordinates Memory, DevOps, Billing, and Privacy agents. The memory pipeline persists long-context knowledge to 0G Storage. Gemini 2.5 Flash provides the reasoning layer across all agents.

### Track 3: Agentic Economy & Autonomous Applications

Wallet-owned agent marketplace, on-chain agent registry, usage-aware billing, and enterprise-grade agent services form the foundation for monetizable AI agents and verifiable autonomous applications.

### Track 5: Privacy & Sovereign Infrastructure

Every memory is encrypted before storage. The Privacy Agent runs last in every orchestration pipeline. PII is detected and redacted before any response leaves the system. Architecture supports enterprise data sovereignty.

---

## 4) System Architecture

```text
[React + RainbowKit]  ──wallet-auth──►  [Express 5 API]
        │                                      │
        │                              [Orchestrator]
        │                            ┌──────────────────┐
        │                            │  Memory Agent     │
        │                            │  DevOps Agent     │
        │                            │  Billing Agent    │
        │                            │  Privacy Agent ◄──┘ (always last)
        │                            └──────────────────┘
        │                                      │
        │                              [Gemini 2.5 Flash]
        │                              [GitHub Live API]
        │                                      │
        │                              [0G Storage SDK]
        │                              [0G Mainnet RPC]
        │                              [AgentRegistry.sol]
        └──────────────────────────────────────┘
```

### Layer breakdown

- **Frontend**: React 18, Vite 7, RainbowKit, wagmi — wallet-gated, all routes protected
- **Backend**: Express 5 + workspace storage + `x-wallet-address` middleware
- **Orchestration**: OpenClaw-style 4-agent pipeline with context injection
- **AI Layer**: Gemini 2.5 Flash for reasoning, summarization, tagging, extraction
- **Decentralized Storage**: 0G Storage SDK — encrypted memory persistence
- **Blockchain**: 0G Mainnet — `AgentRegistry.sol` for agent identity

---

## 5) 0G Modules Used

### 0G Storage

Used to store encrypted memory logs, embeddings metadata, and enterprise knowledge. Active whenever `ZG_PRIVATE_KEY` is set — public mainnet endpoints (`https://evmrpc.0g.ai`, indexer `https://indexer-storage.0g.ai`) are used by default, so no extra RPC env vars are needed. Gracefully degrades to local disk only when `ZG_PRIVATE_KEY` is absent.

### 0G Chain (Mainnet)

`AgentRegistry.sol` is deployed on **0G Mainnet** (chain ID 16660). Agent IDs are owned by wallet addresses, verifiable on the 0G Mainnet explorer.

- Explorer: https://chainscan.0g.ai
- RPC: https://evmrpc.0g.ai

### 0G Compute

Abstraction layer prepared for decentralized inference routing. Set `COMPUTE_PROVIDER=0g` to route workloads to 0G Compute nodes.

### Privacy / TEE Concepts

AES-256-GCM encrypted memory pipeline with PII scanning before encryption and after every AI inference step. Software TEE architecture — hardware TEE-ready.

---

## 6) How 0G Supports the Product

0G gives NeuroVault:

- **Tamper-resistant memory** — decentralized storage not controlled by any single party
- **Long-term persistence** — memory survives session restarts and server resets
- **Verifiable ownership** — wallet-linked agent IDs on-chain, queryable by anyone
- **Decentralized intelligence** — infrastructure not dependent on centralized cloud
- **Scalable enterprise AI** — storage and compute scale independently

---

## 7) OpenClaw-Style Orchestration

```text
POST /api/orchestrator/run
       │
       ▼
 ┌────────────────┐
 │ Memory Agent   │ ← retrieves top-K relevant memories
 └────────┬───────┘
          ▼
 ┌────────────────┐
 │ DevOps Agent   │ ← classifies query, recommends actions
 └────────┬───────┘
          ▼
 ┌────────────────┐
 │ Billing Agent  │ ← usage tracking, cost estimation
 └────────┬───────┘
          ▼
 ┌────────────────┐
 │ Privacy Agent  │ ← ALWAYS LAST: PII redaction
 └────────┬───────┘
          ▼
   final response + audit log entry
```

---

## 8) Gemini AI Integration

Gemini 2.5 Flash powers:

- Enterprise reasoning across all agent steps
- Memory summarization and auto-tagging
- Contextual Copilot responses with live GitHub data
- Knowledge extraction from ingested content
- Autonomous agent decision-making in the marketplace

---

## 9) GitHub Intelligence Integration

- Live GitHub repo ingestion via PAT
- Commit analysis injected into every Copilot message
- Issue and PR summarization
- Sync-to-memory: indexes all repos as searchable enterprise knowledge
- AI memory created from engineering activity automatically

---

## 10) Smart Contracts

`AgentRegistry.sol` — deployed on **0G Mainnet**

Capabilities:
- `createAgent(name, role, memorySize)` → on-chain agent ID
- `getAgent(id)` → owner wallet + metadata
- `transferOwnership(id, newOwner)` → verifiable transfer
- `getAgentsByOwner(wallet)` → list all agents for a wallet

**Deployed contract**

| Field | Value |
|---|---|
| Contract Address | `0x9D06eaEFfD214C2fb14Fad09cBEd469816F01299` |
| Explorer | https://chainscan.0g.ai/address/0x9D06eaEFfD214C2fb14Fad09cBEd469816F01299 |
| Chain | 0G Mainnet (Chain ID 16660) |

---

## 11) Local Deployment Guide

### 1. Clone and install

```bash
git clone <your-repo-url>
cd neurovault-enterprise
npm install
```

### 2. Configure environment

Create a `.env` file (never commit this):

```bash
GOOGLE_API_KEY=your_gemini_api_key

# 0G Mainnet deployment
ZG_PRIVATE_KEY=your_deploy_wallet_private_key
ZG_CHAIN=0g-mainnet
ZG_RPC_URL=https://evmrpc.0g.ai
ZG_INDEXER_RPC=https://indexer-storage-testnet-standard.0g.ai

# Optional
AGENT_REGISTRY_ADDRESS=0x...
NEUROVAULT_ENCRYPTION_KEY=your_aes_passphrase
VITE_WALLETCONNECT_PROJECT_ID=your_walletconnect_id
```

### 3. Run the app

```bash
npm run dev          # http://localhost:5000
```

### 4. Deploy contract to 0G Mainnet

```bash
ZG_PRIVATE_KEY=0x... npx tsx scripts/deploy.ts
```

For testnet (Galileo) instead:

```bash
ZG_PRIVATE_KEY=0x... ZG_CHAIN=0g-galileo npx tsx scripts/deploy.ts
```

---

## 12) Wallet + Network Guide

### MetaMask setup for 0G Mainnet

| Field | Value |
|---|---|
| Network Name | 0G Mainnet |
| RPC URL | https://evmrpc.0g.ai |
| Chain ID | 16660 |
| Currency Symbol | 0G |
| Explorer | https://chainscan.0g.ai |

NeuroVault uses RainbowKit — it will prompt the user to add and switch to 0G Mainnet automatically on wallet connect.

**Testnet faucet (for development):** https://faucet.0g.ai

---

## 13) Testing Guide

Judges can test:

1. Navigate to the app and connect MetaMask — 0G Mainnet is the default chain
2. Connect GitHub from the Integrations page and enter a PAT
3. Ask the AI Copilot about repositories, commits, or issues
4. Sync GitHub data into memory via the Copilot sidebar
5. View memory entries on the Memory page
6. Check the Admin panel for contract deployment status and audit log
7. View the deployed contract on the 0G Mainnet explorer

---

## 14) Security & Privacy

- **AES-256-GCM** per-record encryption with random salt and IV
- PII scanning runs before encryption AND after inference (privacy agent runs last)
- Private keys never leave the server; only `VITE_*` prefixed vars reach the browser
- All sensitive API endpoints require `x-wallet-address` header validation
- Storage layer never logs cleartext payloads

---

## 15) Future Roadmap

- Real decentralized inference via 0G Compute nodes
- Autonomous enterprise agents with on-chain action execution
- Persistent cross-session memory with retrieval ranking
- Decentralized AI workforce marketplace
- Enterprise AI operating system on 0G infrastructure

---

## 16) Team & Hackathon Info

**Hackathon:** 0G APAC Hackathon

**Tracks targeted:**
- Track 1: Agentic Infrastructure & OpenClaw Lab
- Track 3: Agentic Economy & Autonomous Applications
- Track 5: Privacy & Sovereign Infrastructure

**Technology highlights:**
- 0G Mainnet smart contract deployment
- 0G Storage for encrypted memory persistence
- Gemini 2.5 Flash multi-agent orchestration
- Wallet-only auth (RainbowKit + wagmi)
- Live GitHub intelligence in AI Copilot
- AES-256-GCM privacy layer

---

## Repository Map

```text
contracts/        AgentRegistry.sol
scripts/          deploy.ts — compiles + deploys to 0G Mainnet by default
server/           API, orchestrator, agents, 0G storage, contract lib
client/src/       React UI, wallet flow, protected routes
shared/           Drizzle + Zod schema
```

---

## Environment Variables Reference

| Variable | Purpose | Required |
|---|---|---|
| `GOOGLE_API_KEY` | Gemini 2.5 Flash | Yes |
| `ZG_PRIVATE_KEY` | Funded 0G wallet — activates both Storage uploads and contract deploy | For storage + deploy |
| `ZG_CHAIN` | `0g-mainnet` (default) or `0g-galileo` | No |
| `ZG_RPC_URL` | Override 0G EVM RPC (default: `https://evmrpc.0g.ai`) | No |
| `ZG_INDEXER_RPC` | Override 0G Storage Indexer (default: `https://indexer-storage.0g.ai`) | No |
| `AGENT_REGISTRY_ADDRESS` | Override deployed contract address | No |
| `NEUROVAULT_ENCRYPTION_KEY` | AES key derivation passphrase | Recommended |
| `VITE_WALLETCONNECT_PROJECT_ID` | WalletConnect Cloud | For mobile wallets |

---

## License

MIT
