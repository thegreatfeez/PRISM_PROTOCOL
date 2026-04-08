import React from "react";
import { Sidebar } from "./Sidebar";
import { ProtocolAssistant } from "../ai/ProtocolAssistant";
import { WalletStatus } from "./WalletStatus";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="fixed top-4 right-4 z-40">
        <WalletStatus />
      </div>
      <Sidebar />
      <main className="lg:pl-60">
        <div className="max-w-6xl mx-auto px-6 pb-6 pt-20">{children}</div>
      </main>
      <ProtocolAssistant />
    </div>
  );
}

// Page header helper
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 font-display">{title}</h1>
        {subtitle && <p className="text-slate-500 text-sm mt-1">{subtitle}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
