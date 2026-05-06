import { ReactNode } from "react";
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@rainbow-me/rainbowkit/styles.css";
import { wagmiConfig } from "./wagmi";

const queryClient = new QueryClient();

export const Web3Providers = ({ children }: { children: ReactNode }) => (
  <WagmiProvider config={wagmiConfig}>
    <QueryClientProvider client={queryClient}>
      <RainbowKitProvider
        theme={darkTheme({
          accentColor: "#8b5cf6",
          accentColorForeground: "white",
          borderRadius: "large",
          overlayBlur: "small",
        })}
        modalSize="compact"
      >
        {children}
      </RainbowKitProvider>
    </QueryClientProvider>
  </WagmiProvider>
);
