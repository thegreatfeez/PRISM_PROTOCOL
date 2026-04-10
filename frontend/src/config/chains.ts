import { defineChain } from "viem";

export const hashkey = defineChain({
  id: 133,
  name: "HashKey Chain Testnet",
  nativeCurrency: {
    name: "HashKey Token",
    symbol: "HSK",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://testnet.hsk.xyz"],
    },
    public: {
      http: ["https://testnet.hsk.xyz"],
    },
  },
  blockExplorers: {
    default: {
      name: "HashKey Explorer",
      url: "https://testnet-explorer.hsk.xyz",
    },
  },
});
