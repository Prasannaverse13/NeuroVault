import { createRoot } from "react-dom/client";
import App from "./App";
import { Web3Providers } from "./lib/web3Providers";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <Web3Providers>
    <App />
  </Web3Providers>,
);
