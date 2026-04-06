import { useAccount } from "wagmi";
import { Link } from "react-router-dom";
import {
  Gem, TrendingUp, ShoppingCart, Repeat2, ArrowRight,
  Coins, Users, Activity
} from "lucide-react";
import { PageHeader } from "../components/layout/Layout";
import { StatCard } from "../components/ui/index";
import { Card, CardHeader, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/index";
import { useTotalSupply, useNFTBalance, useNFTName, useNFTSymbol } from "../hooks/useERC721";
import { useTokenBalance, useTokenTotalSupply, useTokenSymbol } from "../hooks/useERC20";
import { usePlatformFee } from "../hooks/useMarketplace";
import { useMultisigOwners, useMultisigRequired } from "../hooks/useMultisig";
import { formatToken, formatBps, shortenAddress } from "../utils/formatters";

function ConnectPrompt() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-16 h-16 bg-gradient-to-br from-violet-400 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-200 mb-2">
        <Gem size={28} className="text-white" />
      </div>
      <h2 className="text-xl font-bold text-slate-800 font-display">Welcome to Prism Protocol</h2>
      <p className="text-slate-500 text-sm max-w-xs text-center">
        Connect your wallet to access gaming assets, staking, borrowing, and the marketplace.
      </p>
      <w3m-button />
    </div>
  );
}

export function Dashboard() {
  const { address, isConnected } = useAccount();

  const { data: nftName } = useNFTName();
  const { data: nftSymbol } = useNFTSymbol();
  const { data: totalSupply, isLoading: loadingSupply } = useTotalSupply();
  const { data: userNFTBalance, isLoading: loadingBalance } = useNFTBalance(address);
  const { data: tokenSymbol } = useTokenSymbol();
  const { data: tokenTotalSupply, isLoading: loadingTokenSupply } = useTokenTotalSupply();
  const { data: tokenBalance, isLoading: loadingTokenBalance } = useTokenBalance(address);
  const { data: platformFee } = usePlatformFee();
  const { data: multisigOwners } = useMultisigOwners();
  const { data: required } = useMultisigRequired();

  if (!isConnected) return <ConnectPrompt />;

  const actions = [
    {
      to: "/nfts",
      icon: Gem,
      label: "My NFTs",
      description: "View and manage your gaming assets",
      color: "violet" as const,
      badge: userNFTBalance ? `${userNFTBalance.toString()} owned` : undefined,
    },
    {
      to: "/marketplace",
      icon: ShoppingCart,
      label: "Marketplace",
      description: "Buy and sell NFTs with PRM tokens",
      color: "sky" as const,
    },
    {
      to: "/staking",
      icon: TrendingUp,
      label: "Staking",
      description: "Earn 80% of borrow fees from your NFTs",
      color: "emerald" as const,
    },
    {
      to: "/borrow",
      icon: Repeat2,
      label: "Borrow",
      description: "Rent gaming assets with ETH collateral",
      color: "amber" as const,
    },
  ];

  const cardAccentColors = {
    violet: "hover:border-violet-200",
    sky: "hover:border-sky-200",
    emerald: "hover:border-emerald-200",
    amber: "hover:border-amber-200",
  };

  const iconBgColors = {
    violet: "bg-violet-100 text-violet-600",
    sky: "bg-sky-100 text-sky-600",
    emerald: "bg-emerald-100 text-emerald-600",
    amber: "bg-amber-100 text-amber-600",
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle={`${nftName || "Prism"} (${nftSymbol || "PRM"}) · HashKey Chain`}
      />

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total NFTs Minted"
          value={totalSupply?.toString() ?? "—"}
          icon={<Gem size={18} />}
          color="violet"
          loading={loadingSupply}
        />
        <StatCard
          label="My NFT Balance"
          value={userNFTBalance?.toString() ?? "0"}
          icon={<Activity size={18} />}
          color="sky"
          loading={loadingBalance}
        />
        <StatCard
          label="My PRM Balance"
          value={tokenBalance !== undefined ? formatToken(tokenBalance as bigint, 18, 2) : "—"}
          sub={tokenSymbol ? `${tokenSymbol} tokens` : undefined}
          icon={<Coins size={18} />}
          color="emerald"
          loading={loadingTokenBalance}
        />
        <StatCard
          label="Total PRM Supply"
          value={tokenTotalSupply !== undefined ? formatToken(tokenTotalSupply as bigint, 18, 0) : "—"}
          icon={<TrendingUp size={18} />}
          color="rose"
          loading={loadingTokenSupply}
        />
      </div>

      {/* Action cards */}
      <div>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Protocol Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {actions.map(({ to, icon: Icon, label, description, color, badge }) => (
            <Link key={to} to={to}>
              <div className={`bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 h-full ${cardAccentColors[color]}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBgColors[color]}`}>
                    <Icon size={18} />
                  </div>
                  {badge && <Badge color={color} size="sm">{badge}</Badge>}
                </div>
                <p className="font-semibold text-slate-800 font-display text-sm mb-1">{label}</p>
                <p className="text-xs text-slate-400 leading-relaxed">{description}</p>
                <div className="flex items-center gap-1 mt-3 text-xs font-medium text-slate-400">
                  Open <ArrowRight size={12} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Protocol info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Protocol Economics */}
        <Card>
          <CardHeader>
            <CardTitle>Protocol Economics</CardTitle>
          </CardHeader>
          <div className="space-y-3">
            {[
              { label: "Platform Fee (burned on sale)", value: platformFee !== undefined ? formatBps(platformFee as bigint) : "—", color: "text-amber-600" },
              { label: "Staker Reward Share", value: "80%", color: "text-emerald-600" },
              { label: "Treasury Cut (borrows)", value: "20%", color: "text-violet-600" },
              { label: "Token Supply Model", value: "Deflationary", color: "text-rose-600" },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                <span className="text-sm text-slate-500">{label}</span>
                <span className={`text-sm font-semibold ${color}`}>{value}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Governance */}
        <Card>
          <CardHeader>
            <CardTitle>Multisig Governance</CardTitle>
            {required && multisigOwners && (
              <Badge color="violet">
                {required.toString()}/{multisigOwners.length} required
              </Badge>
            )}
          </CardHeader>
          {multisigOwners && multisigOwners.length > 0 ? (
            <div className="space-y-2">
              {(multisigOwners as string[]).map((owner, i) => (
                <div key={owner} className="flex items-center gap-2.5 py-1.5">
                  <div className="w-6 h-6 bg-gradient-to-br from-violet-400 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">{i + 1}</span>
                  </div>
                  <a
                    href={`https://explorer.hashkey.cloud/address/${owner}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-slate-600 hover:text-violet-600 font-mono transition-colors"
                  >
                    {shortenAddress(owner, 6)}
                  </a>
                  {owner.toLowerCase() === address?.toLowerCase() && (
                    <Badge color="violet" size="sm">You</Badge>
                  )}
                </div>
              ))}
              <Link to="/governance" className="flex items-center gap-1 text-xs text-violet-500 hover:text-violet-700 mt-2 pt-2 border-t border-slate-50">
                View governance <ArrowRight size={11} />
              </Link>
            </div>
          ) : (
            <p className="text-sm text-slate-400">No multisig owners found.</p>
          )}
        </Card>
      </div>

      {/* About */}
      <Card className="bg-gradient-to-br from-violet-50 to-purple-50 border-violet-100">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-sm shadow-violet-200 flex-shrink-0">
            <Gem size={22} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 font-display mb-1">Own. Stake. Borrow. Trade.</h3>
            <p className="text-sm text-slate-500 leading-relaxed max-w-2xl">
              Prism Protocol is a fully on-chain gaming asset ecosystem. Every NFT is unique — art generated entirely on-chain via Chainlink VRF. 
              Stake your assets to earn passive income, or borrow rare assets to play without buying.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
