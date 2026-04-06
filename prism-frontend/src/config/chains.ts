import { defineChain } from "viem";

export const hashkey = defineChain({
  id: 177,
  name: "HashKey Chain",
  nativeCurrency: {
    name: "HashKey Token",
    symbol: "HSK",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://mainnet.hsk.xyz"],
    },
    public: {
      http: ["https://mainnet.hsk.xyz"],
    },
  },
  blockExplorers: {
    default: {
      name: "HashKey Explorer",
      url: "https://explorer.hashkey.cloud",
    },
  },
});
