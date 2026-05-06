/**
 * One-command deploy script for AgentRegistry to the 0G chain.
 *
 * Usage:
 *   ZG_PRIVATE_KEY=0x... ZG_CHAIN=0g-galileo npx tsx scripts/deploy.ts
 *   ZG_PRIVATE_KEY=0x... ZG_CHAIN=0g-mainnet npx tsx scripts/deploy.ts
 *
 * Requires: solc (npm install -D solc)
 */
import { ethers } from "ethers";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { CHAINS } from "../server/lib/contract";

const chainKey = (process.env.ZG_CHAIN || "0g-galileo") as keyof typeof CHAINS;
const chain = CHAINS[chainKey];
const pk = process.env.ZG_PRIVATE_KEY;

if (!chain) throw new Error(`Unknown chain '${chainKey}'. Use 0g-galileo or 0g-mainnet.`);
if (!pk) throw new Error("Missing ZG_PRIVATE_KEY env var.");

const compileContract = async (): Promise<{ abi: any[]; bytecode: string }> => {
  const solc = (await import("solc")).default as any;
  const source = await readFile(path.resolve("contracts/AgentRegistry.sol"), "utf8");
  const input = {
    language: "Solidity",
    sources: { "AgentRegistry.sol": { content: source } },
    settings: {
      optimizer: { enabled: true, runs: 200 },
      outputSelection: { "*": { "*": ["abi", "evm.bytecode.object"] } },
    },
  };
  const out = JSON.parse(solc.compile(JSON.stringify(input)));
  if (out.errors?.some((e: any) => e.severity === "error")) {
    console.error(out.errors);
    throw new Error("solc compilation failed");
  }
  const c = out.contracts["AgentRegistry.sol"]["AgentRegistry"];
  return { abi: c.abi, bytecode: "0x" + c.evm.bytecode.object };
};

const main = async () => {
  console.log(`→ Compiling AgentRegistry.sol`);
  const { abi, bytecode } = await compileContract();

  console.log(`→ Connecting to ${chain.name} (${chain.rpcUrl})`);
  const provider = new ethers.JsonRpcProvider(chain.rpcUrl);
  const wallet = new ethers.Wallet(pk, provider);
  console.log(`→ Deployer wallet: ${wallet.address}`);

  const balance = await provider.getBalance(wallet.address);
  console.log(`→ Balance: ${ethers.formatEther(balance)} 0G`);
  if (balance === 0n) throw new Error("Wallet has 0 balance — fund it before deploying.");

  const factory = new ethers.ContractFactory(abi, bytecode, wallet);
  const contract = await factory.deploy();
  console.log(`→ Tx submitted: ${contract.deploymentTransaction()?.hash}`);
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  const tx = contract.deploymentTransaction()?.hash ?? "";
  const explorerUrl = `${chain.explorer}/address/${address}`;
  const txUrl = `${chain.explorer}/tx/${tx}`;

  console.log(`✔ Deployed AgentRegistry`);
  console.log(`  Address:  ${address}`);
  console.log(`  Tx hash:  ${tx}`);
  console.log(`  Explorer: ${explorerUrl}`);
  console.log(`  Tx URL:   ${txUrl}`);

  await mkdir("contracts", { recursive: true });
  const file = path.resolve("contracts/deployments.json");
  let json: any = {};
  try { json = JSON.parse(await readFile(file, "utf8")); } catch { /* new file */ }
  json[chainKey] = { ...(json[chainKey] ?? {}), AgentRegistry: address, txHash: tx, explorerUrl, deployedAt: new Date().toISOString() };
  await writeFile(file, JSON.stringify(json, null, 2));
  console.log(`✔ Saved to contracts/deployments.json`);
};

main().catch((err) => { console.error(err); process.exit(1); });
