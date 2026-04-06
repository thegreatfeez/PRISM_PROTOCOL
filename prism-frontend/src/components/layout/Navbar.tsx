import { Link, useLocation } from "react-router-dom";
import { Gem, Lock } from "lucide-react";
import { useAccount } from "wagmi";
import { useTokenBalance } from "../../hooks/useERC20";
import { useRole } from "../../hooks/useRole";
import { formatToken } from "../../utils/formatters";

interface NavLink {
  to: string;
  label: string;
  signerOnly?: boolean;
}

const navLinks: NavLink[] = [
  { to: "/",            label: "Dashboard" },
  { to: "/nfts",        label: "My NFTs" },
  { to: "/marketplace", label: "Marketplace" },
  { to: "/staking",     label: "Staking" },
  { to: "/borrow",      label: "Borrow" },
  { to: "/governance",  label: "Governance",  signerOnly: true },
  { to: "/treasury",    label: "Treasury",    signerOnly: true },
];

export function Navbar() {
  const { address, isConnected } = useAccount();
  const { data: balance } = useTokenBalance(address);
  const { isSigner, isLoading } = useRole();
  const location = useLocation();

  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-16 bg-white/80 backdrop-blur-md border-b border-slate-100">
      <div className="h-full max-w-screen-2xl mx-auto px-4 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl
            flex items-center justify-center shadow-sm shadow-violet-200">
            <Gem size={16} className="text-white" />
          </div>
          <span className="font-bold text-slate-800 font-display text-lg tracking-tight">Prism</span>
          <span className="text-xs font-medium text-violet-500 bg-violet-50 px-1.5 py-0.5 rounded-md">
            Protocol
          </span>
        </Link>

        {/* Nav Links (desktop) */}
        <nav className="hidden md:flex items-center gap-0.5">
          {navLinks.map(({ to, label, signerOnly }) => {
            const active = location.pathname === to;
            const locked = signerOnly && !isLoading && !isSigner;

            if (locked) {
              return (
                <span
                  key={to}
                  title="Multisig signers only"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
                    text-slate-300 cursor-not-allowed select-none"
                >
                  {label}
                  <Lock size={11} />
                </span>
              );
            }

            return (
              <Link
                key={to}
                to={to}
                className={[
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150",
                  active
                    ? "bg-violet-50 text-violet-700"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-50",
                ].join(" ")}
              >
                {label}
                {signerOnly && isSigner && (
                  <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 align-middle" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* PRM balance */}
          {isConnected && balance !== undefined && (
            <div className="hidden sm:flex items-center gap-1.5 bg-violet-50 border border-violet-100
              rounded-xl px-3 py-1.5">
              <div className="w-4 h-4 bg-violet-500 rounded-full" />
              <span className="text-sm font-semibold text-violet-700">
                {formatToken(balance as bigint)} PRM
              </span>
            </div>
          )}

          {/* Signer badge */}
          {isConnected && isSigner && !isLoading && (
            <div className="hidden sm:flex items-center gap-1.5 bg-emerald-50 border border-emerald-100
              rounded-xl px-3 py-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-xs font-semibold text-emerald-600">Signer</span>
            </div>
          )}

          {/* AppKit connect button */}
          <w3m-button size="sm" />
        </div>
      </div>
    </header>
  );
}