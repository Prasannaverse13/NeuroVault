import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import App from "./App";
import { Web3Providers } from "./lib/web3Providers";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <Web3Providers>
      <App />
    </Web3Providers>
  </QueryClientProvider>,
);
