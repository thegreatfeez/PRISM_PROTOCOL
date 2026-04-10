import { createAppKit } from "@reown/appkit/react";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { QueryClient } from "@tanstack/react-query";
import type { AppKitNetwork } from "@reown/appkit-common";
import { hashkey } from "./chains";

// Your Reown (WalletConnect) Project ID — replace with your own from cloud.reown.com
export const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "YOUR_PROJECT_ID";

export const queryClient = new QueryClient();

const networks: [AppKitNetwork, ...AppKitNetwork[]] = [hashkey];

export const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
  ssr: false,
});

export const wagmiConfig = wagmiAdapter.wagmiConfig;

createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId,
  metadata: {
    name: "Prism Protocol",
    description: "Own. Stake. Borrow. Trade. All on-chain, forever.",
    url: typeof window !== "undefined" ? window.location.origin : "",
    icons: ["https://avatars.githubusercontent.com/u/37784886"],
  },
  features: {
    analytics: true,
    email: false,
    socials: [],
  },
  themeMode: "light",
  themeVariables: {
    "--w3m-accent": "#7C3AED",
    "--w3m-border-radius-master": "12px",
  },
});
