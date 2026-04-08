import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/protocol-assistant": {
        target: "http://localhost:8787",
        changeOrigin: true,
      },
      "/governance-summary": {
        target: "http://localhost:8787",
        changeOrigin: true,
      },
    },
  },
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
