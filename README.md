# NeuroVault Enterprise

> **Enterprise AI Memory Infrastructure powered by decentralized intelligence.**

[![0G APAC Hackathon](https://img.shields.io/badge/0G-APAC%20Hackathon-6D5EF7?style=for-the-badge)](https://0g.ai)
[![Gemini](https://img.shields.io/badge/Gemini-2.5%20Flash-4285F4?style=for-the-badge)](https://aistudio.google.com)
[![0G Storage](https://img.shields.io/badge/0G-Storage-00D3A7?style=for-the-badge)](https://docs.0g.ai)
[![Wallet Auth](https://img.shields.io/badge/Wallet--Only-Auth-111827?style=for-the-badge)](https://www.rainbowkit.com)

---

## Project Banner

```text
┌──────────────────────────────────────────────────────────────────────────┐
│ NeuroVault Enterprise                                                    │
│ Decentralized AI memory, live GitHub intelligence, and wallet identity   │
│ for enterprise-grade copilots and autonomous agents.                     │
└──────────────────────────────────────────────────────────────────────────┘
```

## Architecture Visuals

**System flow**

```text
Wallet Login (RainbowKit)
        ↓
OpenClaw-style Orchestrator
        ↓
Memory Retrieval Engine
        ↓
Gemini AI Reasoning Layer
        ↓
0G Storage
        ↓
Smart Contract / Agent Registry
        ↓
AI Response
```

**Architecture placeholder**

```text
[Frontend] → [Backend API] → [Orchestrator] → [AI Layer] → [0G Storage / 0G Chain]
```

---

## 1) Project Overview

NeuroVault Enterprise is an enterprise AI memory infrastructure platform built for teams that need agents to remember, evolve, and retrieve organizational intelligence across sessions.

Traditional copilots fail when context disappears after each chat. NeuroVault solves that by combining wallet-based identity, encrypted persistent memory, decentralized storage, and multi-agent orchestration into one AI-native system.

### What it enables

- Persistent enterprise AI memory
- Multi-agent orchestration
- Decentralized memory persistence
- Secure knowledge retrieval
- Live GitHub intelligence ingestion
- Wallet-owned agent identity

---

## 2) Key Features

- Persistent AI Memory
- Multi-Agent Orchestration
- Agent Identity System
- Enterprise Knowledge Retrieval
- GitHub Intelligence Integration
- Encrypted Memory Storage
- Wallet-based Ownership
- Real-time AI Copilot
- Agent Marketplace
- Privacy-first Architecture

---

## 3) How NeuroVault Enterprise Covers Multiple Tracks

### Track 1: Agentic Infrastructure & OpenClaw Lab

NeuroVault implements an OpenClaw-style orchestrator that coordinates specialized agents for memory, DevOps, privacy, and billing. The memory pipeline persists context, the orchestrator routes tasks dynamically, and 0G Storage provides decentralized persistence for long-context AI systems.

### Track 3: Agentic Economy & Autonomous Applications

The platform includes a wallet-owned agent marketplace, agent identity registry, usage-aware billing, and enterprise-grade agent services. This creates a foundation for monetizable AI agents and autonomous applications with verifiable ownership.

### Track 5: Privacy & Sovereign Infrastructure

NeuroVault encrypts memory before storage, applies privacy-first retrieval workflows, and keeps sensitive context protected by design. The architecture is built to support enterprise data sovereignty and TEE-inspired secure workflows.

---

## 4) System Architecture

### Runtime Layers

- **Frontend**: React 18, Vite 7, RainbowKit, wagmi
- **Backend**: Express 5 API + workspace storage + orchestration
- **Orchestration Layer**: OpenClaw-style multi-agent routing
- **AI Layer**: Gemini 2.5 Flash for reasoning, summarization, and extraction
- **Decentralized Storage Layer**: 0G Storage for memory persistence
- **Blockchain Layer**: 0G Chain smart contract identity via `AgentRegistry.sol`

### Flow

```text
Wallet Login (RainbowKit)
↓
OpenClaw-style Orchestrator
↓
Memory Retrieval Engine
↓
Gemini AI Reasoning Layer
↓
0G Storage
↓
Smart Contract / Agent Registry
↓
AI Response
```

---

## 5) 0G Modules Used

### 0G Storage

Used to store memory logs, embeddings metadata, and encrypted enterprise memory with decentralized persistence. When 0G env vars are unavailable, the system falls back safely without exposing secrets.

### 0G Chain

Used for Agent ID ownership, on-chain identity, smart contract deployment, and explorer-verifiable registry state.

### 0G Compute

The product is prepared for decentralized inference through an abstraction layer that can route workloads to 0G Compute in the future.

### Privacy / TEE Concepts

NeuroVault uses encrypted memory pipelines, secure retrieval, and privacy-first agent workflows inspired by TEE-style enterprise protection.

---

## 6) How 0G Supports the Product

Decentralized AI memory matters because enterprises need tamper-resistant memory, verifiable ownership, long-term persistence, and infrastructure that scales beyond a single session or vendor lock-in.

0G gives NeuroVault the foundation for:

- Tamper-resistant memory
- Long-term persistence
- Verifiable ownership
- Decentralized intelligence
- Scalable enterprise AI infrastructure

---

## 7) OpenClaw-Style Orchestration

### Agents

- Memory Agent
- DevOps Agent
- Privacy Agent
- Billing Agent

### Behavior

- Agent coordination across tasks
- Dynamic workflow execution
- Context-aware reasoning
- Privacy enforcement at the end of every response path

---

## 8) Gemini AI Integration

Gemini 2.5 Flash powers the intelligence layer for:

- Enterprise reasoning
- Memory summarization
- Contextual AI responses
- Auto-tagging
- Knowledge extraction

Gemini provides the cognition, while 0G provides the decentralized infrastructure.

---

## 9) GitHub Intelligence Integration

NeuroVault includes live GitHub intelligence for enterprise engineering context:

- GitHub repo ingestion
- Commit analysis
- Issue summarization
- Pull request visibility
- AI memory creation from engineering activity

This live context is injected into Copilot responses and can also be synced into memory for later retrieval.

---

## 10) Smart Contracts

The `AgentRegistry.sol` contract provides on-chain agent identity and wallet-linked ownership.

### It supports

- Agent ID ownership
- Wallet-linked agents
- Metadata storage
- Memory tracking

### Contract placeholders

- **Contract Address**: `0x9D06eaEFfD214C2fb14Fad09cBEd469816F01299`
- **Explorer**: https://chainscan-galileo.0g.ai/address/0x9D06eaEFfD214C2fb14Fad09cBEd469816F01299

---

## 11) Local Deployment Guide

### 1. Clone and install

```bash
git clone <your-repo-url>
cd neurovault-enterprise
npm install
```

### 2. Configure environment

Create a `.env` file:

```bash
GEMINI_API_KEY=your_gemini_key
ZG_PRIVATE_KEY=your_0g_deploy_wallet_private_key
RPC_URL=your_0g_rpc_url
CONTRACT_ADDRESS=0x...
```

### 3. Run the app

```bash
npm run dev
```

### 4. Deploy contracts

```bash
ZG_PRIVATE_KEY=0x... npx tsx scripts/deploy.ts
```

---

## 12) Wallet + Testnet Guide

1. Install MetaMask
2. Switch to **0G Galileo Testnet**
3. Fund the wallet via the faucet
4. Connect wallet through RainbowKit

Faucet: https://faucet.0g.ai

---

## 13) Testing Guide

Judges can test:

- Wallet login
- GitHub integration
- AI Copilot
- Memory retrieval
- 0G storage persistence
- Smart contract interaction

Recommended flow:

1. Connect wallet
2. Add GitHub integration
3. Ask Copilot about repositories or commits
4. Sync GitHub data into memory
5. Verify memory retrieval and contract status

---

## 14) Security & Privacy

NeuroVault is built with enterprise privacy as a default:

- AES encryption
- Enterprise memory protection
- Secure memory retrieval
- Privacy-first AI workflows

Sensitive payloads are encrypted before persistence and never exposed in the browser.

---

## 15) Future Roadmap

- Real decentralized inference
- Autonomous enterprise agents
- Persistent cross-session memory
- Decentralized AI workforce
- Enterprise AI operating system

---

## 16) Team & Hackathon Info

**Hackathon:** 0G APAC Hackathon

**Tracks targeted:**
- Track 1: Agentic Infrastructure & OpenClaw Lab
- Track 3: Agentic Economy & Autonomous Applications
- Track 5: Privacy & Sovereign Infrastructure

**Technology highlights:**
- Wallet-only auth
- Gemini 2.5 Flash
- 0G Storage
- 0G Chain
- Encrypted memory
- Live GitHub intelligence
- Multi-agent orchestration

---

## Repository Map

```text
contracts/        AgentRegistry.sol + deployment metadata
scripts/          Contract deployment script
server/           API, orchestration, storage, agents
client/src/       React UI and wallet flow
shared/           Schema and shared types
```

---

## Security Note

No secret keys or private credentials are stored in this repository. Use environment variables for all sensitive values.

---

## License

MIT
