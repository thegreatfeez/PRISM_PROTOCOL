import React from "react";
import { ShieldOff, Loader2 } from "lucide-react";
import { useRole, Role } from "../../hooks/useRole";
import { AppKitButton } from "@reown/appkit/react";

interface AccessGateProps {
  /** Minimum role required to see children */
  require: Role;
  children: React.ReactNode;
  /** Optional custom message */
  message?: string;
}

const roleRank: Record<Role, number> = {
  guest: 0,
  user: 1,
  signer: 2,
};

const roleLabel: Record<Role, string> = {
  guest: "connected wallet",
  user: "connected wallet",
  signer: "multisig signer",
};

/**
 * Wraps a page or section and blocks rendering unless the
 * connected wallet meets the required role.
 *
 * Usage:
 *   <AccessGate require="signer">
 *     <GovernancePage />
 *   </AccessGate>
 */
export function AccessGate({ require, children, message }: AccessGateProps) {
  const { role, isLoading, isGuest } = useRole();

  // Not connected at all
  if (isGuest) {
    return (
      <div className="flex flex-col items-center justify-center py-28 gap-4 text-center">
        <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center">
          <ShieldOff size={24} className="text-slate-400" />
        </div>
        <div>
          <p className="text-base font-semibold text-slate-700 font-display">
            Connect your wallet
          </p>
          <p className="text-sm text-slate-400 mt-1">
            You need to connect to access this page.
          </p>
        </div>
        <AppKitButton />
      </div>
    );
  }

  if (require === "user") return <>{children}</>;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 size={24} className="text-violet-400 animate-spin" />
      </div>
    );
  }

  const hasAccess = roleRank[role] >= roleRank[require];
  if (hasAccess) return <>{children}</>;

  // Connected but wrong role
  return (
    <div className="flex flex-col items-center justify-center py-28 gap-4 text-center">
      <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center border border-rose-100">
        <ShieldOff size={24} className="text-rose-400" />
      </div>
      <div>
        <p className="text-base font-semibold text-slate-700 font-display">
          Access Restricted
        </p>
        <p className="text-sm text-slate-400 mt-1 max-w-xs">
          {message ??
            `This page is only accessible to ${roleLabel[require]}s. Your connected wallet is not registered as a signer on this protocol.`}
        </p>
      </div>

      {/* Role indicator */}
      <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm">
        <span className="text-slate-400">Your role:</span>
        <span className="font-semibold text-slate-600 capitalize">{role}</span>
        <span className="text-slate-300">·</span>
        <span className="text-slate-400">Required:</span>
        <span className="font-semibold text-violet-600 capitalize">{require}</span>
      </div>
    </div>
  );
}

/**
 * Conditionally renders children only if the user has the required role.
 * Unlike AccessGate, renders nothing (not a full-page block) when access is denied.
 * Use this for hiding buttons/sections inline.
 */
export function RoleOnly({
  require,
  children,
}: {
  require: Role;
  children: React.ReactNode;
}) {
  const { role, isLoading, isGuest } = useRole();
  if (require === "user") return isGuest ? null : <>{children}</>;
  if (isLoading) return null;
  const hasAccess = roleRank[role] >= roleRank[require];
  return hasAccess ? <>{children}</> : null;
}