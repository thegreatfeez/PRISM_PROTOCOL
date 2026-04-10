import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect, useRef } from "react";
import { WagmiProvider, useAccount, useChainId } from "wagmi";
import { QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { wagmiConfig, queryClient } from "./config/wagmi";
import { Layout } from "./components/layout/Layout";
import { AccessGate } from "./components/ui/AccessGate";
import { Dashboard } from "./pages/Dashboard";
import { MarketplacePage } from "./pages/MarketplacePage";
import { StakingPage } from "./pages/StakingPage";
import { BorrowPage } from "./pages/BorrowPage";
import { GovernancePage } from "./pages/GovernancePage";
import { TreasuryPage } from "./pages/TreasuryPage";
import { FaucetPage } from "./pages/FaucetPage";
import { NFTInventoryPage } from "./pages/NFTInventoryPage";

import "./config/wagmi";

function WalletSessionSync() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const qc = useQueryClient();

  useEffect(() => {
    // Force all wallet-dependent reads to refresh immediately when
    // wallet connection/account/network changes (no hard page reload needed).
    qc.invalidateQueries();
  }, [qc, isConnected, address, chainId]);

  return null;
}

function WalletHardReloadOnSessionChange() {
  const { address, isConnected } = useAccount();
  const previous = useRef<{ isConnected: boolean; address?: string } | null>(null);

  useEffect(() => {
    if (!previous.current) {
      previous.current = { isConnected, address };
      return;
    }

    const changed =
      previous.current.isConnected !== isConnected ||
      (previous.current.address ?? "").toLowerCase() !== (address ?? "").toLowerCase();

    if (changed) {
      window.location.reload();
      return;
    }

    previous.current = { isConnected, address };
  }, [isConnected, address]);

  return null;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiConfig} reconnectOnMount>
        <WalletSessionSync />
        <WalletHardReloadOnSessionChange />
        <BrowserRouter>
          <Layout>
            <Routes>
              {/* ── Public ───────────────────────────────────────── */}
              <Route path="/" element={<Dashboard />} />
              <Route path="/marketplace" element={<MarketplacePage />} />
              <Route path="/borrow" element={<BorrowPage />} />
              <Route path="/faucet" element={<FaucetPage />} />

              {/* ── Must be connected ─────────────────────────────── */}
              <Route
                path="/staking"
                element={
                  <AccessGate require="user">
                    <StakingPage />
                  </AccessGate>
                }
              />

              {/* ── Multisig signer or contract owner only ───────── */}
              <Route
                path="/inventory"
                element={
                  <AccessGate require="signer" message="NFT inventory is restricted to registered multisig signers and the contract owner.">
                    <NFTInventoryPage />
                  </AccessGate>
                }
              />
              <Route
                path="/governance"
                element={
                  <AccessGate
                    require="signer"
                    message="Governance is restricted to registered multisig signers and the contract owner."
                  >
                    <GovernancePage />
                  </AccessGate>
                }
              />
              <Route
                path="/treasury"
                element={
                  <AccessGate
                    require="signer"
                    message="Treasury controls are restricted to multisig signers and the contract owner."
                  >
                    <TreasuryPage />
                  </AccessGate>
                }
              />
            </Routes>
          </Layout>
        </BrowserRouter>
      </WagmiProvider>
    </QueryClientProvider>
  );
}