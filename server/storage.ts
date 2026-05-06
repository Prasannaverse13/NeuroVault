import { randomUUID } from "node:crypto";
import type {
  Workspace,
  InsertWorkspace,
  Agent,
  InsertAgent,
  Memory,
  InsertMemory,
  AuditLog,
  InsertAuditLog,
  ContractMeta,
  InsertContractMeta,
} from "@shared/schema";

export interface IStorage {
  // Workspaces (wallet identity)
  getOrCreateWorkspaceByWallet(wallet: string, name?: string): Promise<Workspace>;
  getWorkspace(id: string): Promise<Workspace | undefined>;
  getWorkspaceByWallet(wallet: string): Promise<Workspace | undefined>;
  listWorkspaces(): Promise<Workspace[]>;

  // Agents
  createAgent(input: InsertAgent): Promise<Agent>;
  getAgent(id: string): Promise<Agent | undefined>;
  listAgents(workspaceId: string): Promise<Agent[]>;
  updateAgentMemorySize(id: string, memorySize: number): Promise<Agent | undefined>;
  setAgentOnchain(id: string, onchainId: string, txHash: string, contractAddress: string, explorerUrl: string): Promise<void>;

  // Memories
  createMemory(input: InsertMemory): Promise<Memory>;
  getMemory(id: string): Promise<Memory | undefined>;
  listWorkspaceMemories(workspaceId: string): Promise<Memory[]>;
  setMemoryStorageRef(id: string, storageRef: string): Promise<void>;

  // Audit log
  appendAudit(input: InsertAuditLog): Promise<AuditLog>;
  listAudit(workspaceId: string, limit?: number): Promise<AuditLog[]>;

  // Contract registry
  upsertContractMeta(input: InsertContractMeta): Promise<ContractMeta>;
  getContractMeta(name: string): Promise<ContractMeta | undefined>;
}

export class MemStorage implements IStorage {
  private workspaces = new Map<string, Workspace>();
  private agents = new Map<string, Agent>();
  private memories = new Map<string, Memory>();
  private audits: AuditLog[] = [];
  private contracts = new Map<string, ContractMeta>();

  async getOrCreateWorkspaceByWallet(wallet: string, name?: string): Promise<Workspace> {
    const existing = await this.getWorkspaceByWallet(wallet);
    if (existing) return existing;
    const ws: Workspace = {
      id: randomUUID(),
      ownerWallet: wallet.toLowerCase(),
      name: name ?? `Workspace ${wallet.slice(0, 8)}`,
      createdAt: new Date(),
    };
    this.workspaces.set(ws.id, ws);
    return ws;
  }

  async getWorkspace(id: string) {
    return this.workspaces.get(id);
  }

  async getWorkspaceByWallet(wallet: string) {
    const lower = wallet.toLowerCase();
    return Array.from(this.workspaces.values()).find((w) => w.ownerWallet === lower);
  }

  async listWorkspaces() {
    return Array.from(this.workspaces.values());
  }

  async createAgent(input: InsertAgent): Promise<Agent> {
    const agent: Agent = {
      id: randomUUID(),
      workspaceId: input.workspaceId,
      onchainAgentId: input.onchainAgentId ?? null,
      name: input.name,
      role: input.role,
      ownerWallet: input.ownerWallet.toLowerCase(),
      memorySize: input.memorySize ?? 0,
      contractAddress: input.contractAddress ?? null,
      txHash: input.txHash ?? null,
      explorerUrl: input.explorerUrl ?? null,
      createdAt: new Date(),
    };
    this.agents.set(agent.id, agent);
    return agent;
  }

  async getAgent(id: string) {
    return this.agents.get(id);
  }

  async listAgents(workspaceId: string) {
    return Array.from(this.agents.values()).filter((a) => a.workspaceId === workspaceId);
  }

  async updateAgentMemorySize(id: string, memorySize: number) {
    const a = this.agents.get(id);
    if (!a) return undefined;
    const updated = { ...a, memorySize };
    this.agents.set(id, updated);
    return updated;
  }

  async setAgentOnchain(id: string, onchainId: string, txHash: string, contractAddress: string, explorerUrl: string) {
    const a = this.agents.get(id);
    if (!a) return;
    this.agents.set(id, { ...a, onchainAgentId: onchainId, txHash, contractAddress, explorerUrl });
  }

  async createMemory(input: InsertMemory): Promise<Memory> {
    const memory: Memory = {
      id: randomUUID(),
      workspaceId: input.workspaceId,
      agentId: input.agentId,
      type: input.type,
      tags: input.tags ?? [],
      summary: input.summary,
      encryptedPayload: input.encryptedPayload,
      storageRef: input.storageRef ?? null,
      embedding: (input.embedding ?? null) as any,
      createdAt: new Date(),
    };
    this.memories.set(memory.id, memory);
    return memory;
  }

  async getMemory(id: string) {
    return this.memories.get(id);
  }

  async listWorkspaceMemories(workspaceId: string) {
    return Array.from(this.memories.values())
      .filter((m) => m.workspaceId === workspaceId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async setMemoryStorageRef(id: string, storageRef: string) {
    const m = this.memories.get(id);
    if (!m) return;
    this.memories.set(id, { ...m, storageRef });
  }

  async appendAudit(input: InsertAuditLog): Promise<AuditLog> {
    const entry: AuditLog = {
      id: randomUUID(),
      workspaceId: input.workspaceId,
      actorWallet: input.actorWallet.toLowerCase(),
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId ?? null,
      metadata: (input.metadata ?? null) as any,
      createdAt: new Date(),
    };
    this.audits.push(entry);
    return entry;
  }

  async listAudit(workspaceId: string, limit = 100) {
    return this.audits
      .filter((a) => a.workspaceId === workspaceId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async upsertContractMeta(input: InsertContractMeta): Promise<ContractMeta> {
    const existing = this.contracts.get(input.name);
    const entry: ContractMeta = {
      id: existing?.id ?? randomUUID(),
      name: input.name,
      address: input.address,
      chainId: input.chainId,
      deployTxHash: input.deployTxHash ?? null,
      explorerUrl: input.explorerUrl ?? null,
      createdAt: existing?.createdAt ?? new Date(),
    };
    this.contracts.set(input.name, entry);
    return entry;
  }

  async getContractMeta(name: string) {
    return this.contracts.get(name);
  }
}

export const storage = new MemStorage();
