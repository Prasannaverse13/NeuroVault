import { ReactNode } from "react";
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { wagmiConfig } from "./wagmi";

export const Web3Providers = ({ children }: { children: ReactNode }) => (
  <WagmiProvider config={wagmiConfig}>
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
  </WagmiProvider>
);
