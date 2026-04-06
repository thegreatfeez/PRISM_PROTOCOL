import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, Image, ShoppingCart,
  TrendingUp, Repeat2, Shield, Vault,
  Gem, ExternalLink,
} from "lucide-react";
import { CONTRACT_ADDRESSES } from "../../config/contracts";
import { shortenAddress } from "../../utils/formatters";
import { useRole, Role } from "../../hooks/useRole";
import { useAccount } from "wagmi";
import { useTokenBalance } from "../../hooks/useERC20";
import { formatToken } from "../../utils/formatters";

interface NavItem {
  to: string;
  icon: React.ElementType;
  label: string;
  end?: boolean;
  requiredRole?: Role;
}

const navItems: NavItem[] = [
  { to: "/",            icon: LayoutDashboard, label: "Dashboard",   end: true },
  { to: "/nfts",        icon: Image,           label: "My NFTs" },
  { to: "/marketplace", icon: ShoppingCart,    label: "Marketplace" },
  { to: "/staking",     icon: TrendingUp,      label: "Staking" },
  { to: "/borrow",      icon: Repeat2,         label: "Borrow" },
  // signer-only — rendered only for signers
  { to: "/governance",  icon: Shield,          label: "Governance",  requiredRole: "signer" },
  { to: "/treasury",    icon: Vault,           label: "Treasury",    requiredRole: "signer" },
];

export function Sidebar() {
  const { isSigner, isLoading, address: roleAddress } = useRole();
  const { address, isConnected } = useAccount();
  const { data: balance } = useTokenBalance(address);

  const visibleItems = navItems.filter((item) => {
    if (!item.requiredRole) return true;
    if (isLoading) return false; // hide until we know
    return isSigner;
  });

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-60 bg-white border-r border-slate-100 flex flex-col z-30">
      {/* Logo */}
      <div className="h-16 flex items-center gap-3 px-5 border-b border-slate-100 flex-shrink-0">
        <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl
          flex items-center justify-center shadow-sm shadow-violet-200">
          <Gem size={16} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-800 font-display leading-tight">Prism</p>
          <p className="text-xs text-violet-500 font-medium leading-tight">Protocol</p>
        </div>
        {/* Live signer indicator */}
        {isConnected && !isLoading && isSigner && (
          <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" title="Signer wallet" />
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                [
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                  isActive
                    ? "bg-violet-50 text-violet-700"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-50",
                ].join(" ")
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={17} className={isActive ? "text-violet-600" : "text-slate-400"} />
                  {item.label}
                </>
              )}
            </NavLink>
          );
        })}

        {/* Divider + signer section label */}
        {isSigner && (
          <p className="text-xs font-semibold text-slate-300 uppercase tracking-wide px-3 pt-4 pb-1">
            Signer
          </p>
        )}
      </nav>

      {/* Wallet info */}
      {isConnected && (
        <div className="px-3 pb-2">
          <div className="bg-slate-50 rounded-xl p-3 space-y-2">
            {/* Balance */}
            {balance !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">PRM Balance</span>
                <span className="text-xs font-semibold text-violet-700">
                  {formatToken(balance as bigint)} PRM
                </span>
              </div>
            )}
            {/* Role badge */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Role</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                isSigner
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-slate-100 text-slate-500"
              }`}>
                {isLoading ? "…" : isSigner ? "Signer" : "User"}
              </span>
            </div>
            {/* Connect / disconnect */}
            <div className="pt-1">
              <w3m-button size="sm" />
            </div>
          </div>
        </div>
      )}

      {/* Not connected */}
      {!isConnected && (
        <div className="px-3 pb-3">
          <w3m-button size="sm" />
        </div>
      )}

      {/* Contract link */}
      <div className="p-3 border-t border-slate-100">
        <a
          href={`https://explorer.hashkey.cloud/address/${CONTRACT_ADDRESSES.diamond}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors group"
        >
          <div className="w-5 h-5 bg-gradient-to-br from-violet-400 to-purple-500 rounded-md
            flex items-center justify-center flex-shrink-0">
            <Gem size={10} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-500 truncate">
              {shortenAddress(CONTRACT_ADDRESSES.diamond, 5)}
            </p>
          </div>
          <ExternalLink size={11} className="text-slate-300 group-hover:text-violet-500 transition-colors" />
        </a>
        <div className="flex items-center gap-1.5 px-3 mt-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span className="text-xs text-slate-400">HashKey Chain</span>
        </div>
      </div>
    </aside>
  );
}