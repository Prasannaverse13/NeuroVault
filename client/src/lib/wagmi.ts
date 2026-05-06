import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { defineChain } from "viem";
import { mainnet } from "wagmi/chains";

export const zeroGGalileo = defineChain({
  id: 16601,
  name: "0G Galileo Testnet",
  nativeCurrency: { name: "0G", symbol: "0G", decimals: 18 },
  rpcUrls: { default: { http: ["https://evmrpc-testnet.0g.ai"] } },
  blockExplorers: {
    default: { name: "0G Chainscan", url: "https://chainscan-galileo.0g.ai" },
  },
  testnet: true,
});

export const zeroGMainnet = defineChain({
  id: 16660,
  name: "0G Mainnet",
  nativeCurrency: { name: "0G", symbol: "0G", decimals: 18 },
  rpcUrls: { default: { http: ["https://evmrpc.0g.ai"] } },
  blockExplorers: {
    default: { name: "0G Chainscan", url: "https://chainscan.0g.ai" },
  },
});

const projectId =
  import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "neurovault-dev-placeholder";

export const wagmiConfig = getDefaultConfig({
  appName: "NeuroVault Enterprise",
  projectId,
  chains: [zeroGGalileo, zeroGMainnet, mainnet],
  ssr: false,
});
