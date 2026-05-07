import { ethers } from "ethers";
import { readFile } from "node:fs/promises";
import path from "node:path";

export const AGENT_REGISTRY_ABI = [
  "function createAgent(string memory name, string memory role, uint256 memorySize) external returns (uint256)",
  "function getAgent(uint256 agentId) external view returns (uint256, string memory, string memory, uint256, address)",
  "function updateMemorySize(uint256 agentId, uint256 newSize) external",
  "function transferOwnership(uint256 agentId, address newOwner) external",
  "function getAgentsByOwner(address owner) external view returns (uint256[] memory)",
  "function totalAgents() external view returns (uint256)",
  "event AgentCreated(uint256 indexed agentId, address indexed owner, string name, string role)",
  "event MemorySizeUpdated(uint256 indexed agentId, uint256 newSize)",
  "event OwnershipTransferred(uint256 indexed agentId, address indexed from, address indexed to)",
];

export interface ChainConfig {
  chainId: number;
  rpcUrl: string;
  explorer: string;
  name: string;
}

export const CHAINS: Record<string, ChainConfig> = {
  "0g-galileo": {
    chainId: 16601,
    rpcUrl: "https://evmrpc-testnet.0g.ai",
    explorer: "https://chainscan-galileo.0g.ai",
    name: "0G Galileo Testnet",
  },
  "0g-mainnet": {
    chainId: 16660,
    rpcUrl: process.env.ZG_MAINNET_RPC || "https://evmrpc.0g.ai",
    explorer: "https://chainscan.0g.ai",
    name: "0G Mainnet",
  },
};

const activeChainKey = (process.env.ZG_CHAIN || "0g-mainnet") as keyof typeof CHAINS;
export const activeChain: ChainConfig = CHAINS[activeChainKey] ?? CHAINS["0g-mainnet"];

let cachedAddress: string | null = null;

const tryReadDeployment = async (): Promise<string | null> => {
  if (cachedAddress) return cachedAddress;
  const envAddr = process.env.AGENT_REGISTRY_ADDRESS;
  if (envAddr) {
    cachedAddress = envAddr;
    return envAddr;
  }
  try {
    const file = path.resolve(process.cwd(), "contracts/deployments.json");
    const raw = await readFile(file, "utf8");
    const json = JSON.parse(raw);
    const addr = json[activeChainKey]?.AgentRegistry;
    if (addr) {
      cachedAddress = addr;
      return addr;
    }
  } catch {
    /* not deployed yet */
  }
  return null;
};

export interface ContractStatus {
  configured: boolean;
  chain: ChainConfig;
  address: string | null;
  explorerUrl: string | null;
}

export const contractStatus = async (): Promise<ContractStatus> => {
  const address = await tryReadDeployment();
  return {
    configured: !!address,
    chain: activeChain,
    address,
    explorerUrl: address ? `${activeChain.explorer}/address/${address}` : null,
  };
};

export const getProvider = () => new ethers.JsonRpcProvider(activeChain.rpcUrl);

export const getReadContract = async () => {
  const address = await tryReadDeployment();
  if (!address) return null;
  return new ethers.Contract(address, AGENT_REGISTRY_ABI, getProvider());
};

export interface OnchainAgent {
  agentId: string;
  name: string;
  role: string;
  memorySize: number;
  owner: string;
}

export const fetchOnchainAgent = async (
  agentId: number | string,
): Promise<OnchainAgent | null> => {
  const c = await getReadContract();
  if (!c) return null;
  try {
    const [id, name, role, memorySize, owner] = await c.getAgent(agentId);
    return {
      agentId: id.toString(),
      name,
      role,
      memorySize: Number(memorySize),
      owner,
    };
  } catch (err) {
    console.warn("[contract] fetchOnchainAgent failed:", err);
    return null;
  }
};

export const txExplorerUrl = (txHash: string): string =>
  `${activeChain.explorer}/tx/${txHash}`;
