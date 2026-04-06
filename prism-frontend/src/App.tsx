import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WagmiProvider } from "wagmi";
import { QueryClientProvider } from "@tanstack/react-query";
import { wagmiConfig, queryClient } from "./config/wagmi";
import { Layout } from "./components/layout/Layout";
import { AccessGate } from "./components/ui/AccessGate";
import { Dashboard } from "./pages/Dashboard";
import { NFTsPage } from "./pages/NFTsPage";
import { MarketplacePage } from "./pages/MarketplacePage";
import { StakingPage } from "./pages/StakingPage";
import { BorrowPage } from "./pages/BorrowPage";
import { GovernancePage } from "./pages/GovernancePage";
import { TreasuryPage } from "./pages/TreasuryPage";

import "./config/wagmi";

export default function App() {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Layout>
            <Routes>
              {/* ── Public ───────────────────────────────────────── */}
              <Route path="/" element={<Dashboard />} />
              <Route path="/marketplace" element={<MarketplacePage />} />
              <Route path="/borrow" element={<BorrowPage />} />

              {/* ── Must be connected ─────────────────────────────── */}
              <Route path="/nfts" element={
                <AccessGate require="user"><NFTsPage /></AccessGate>
              } />
              <Route path="/staking" element={
                <AccessGate require="user"><StakingPage /></AccessGate>
              } />

              {/* ── Multisig signer or contract owner only ───────── */}
              <Route path="/governance" element={
                <AccessGate require="signer"
                  message="Governance is restricted to registered multisig signers and the contract owner.">
                  <GovernancePage />
                </AccessGate>
              } />
              <Route path="/treasury" element={
                <AccessGate require="signer"
                  message="Treasury controls are restricted to multisig signers and the contract owner.">
                  <TreasuryPage />
                </AccessGate>
              } />
            </Routes>
          </Layout>
        </BrowserRouter>
      </QueryClientProvider>
    </WagmiProvider>
  );
}