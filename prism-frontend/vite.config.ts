import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  define: {
    global: "globalThis",
  },
  resolve: {
    alias: {
      // Polyfills for web3 libraries
      buffer: "buffer",
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          wagmi: ["wagmi", "viem"],
          appkit: ["@reown/appkit", "@reown/appkit-adapter-wagmi"],
          react: ["react", "react-dom", "react-router-dom"],
        },
      },
    },
  },
});
