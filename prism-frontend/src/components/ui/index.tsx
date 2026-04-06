import React from "react";

// ─── Badge ────────────────────────────────────────────────────────────────────

type BadgeColor = "violet" | "sky" | "emerald" | "rose" | "amber" | "slate" | "fuchsia";

interface BadgeProps {
  children: React.ReactNode;
  color?: BadgeColor;
  size?: "sm" | "md";
  dot?: boolean;
}

const badgeColors: Record<BadgeColor, string> = {
  violet: "bg-violet-100 text-violet-700",
  sky: "bg-sky-100 text-sky-700",
  emerald: "bg-emerald-100 text-emerald-700",
  rose: "bg-rose-100 text-rose-700",
  amber: "bg-amber-100 text-amber-700",
  slate: "bg-slate-100 text-slate-600",
  fuchsia: "bg-fuchsia-100 text-fuchsia-700",
};

const dotColors: Record<BadgeColor, string> = {
  violet: "bg-violet-500",
  sky: "bg-sky-500",
  emerald: "bg-emerald-500",
  rose: "bg-rose-500",
  amber: "bg-amber-500",
  slate: "bg-slate-400",
  fuchsia: "bg-fuchsia-500",
};

export function Badge({ children, color = "slate", size = "md", dot = false }: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 font-medium rounded-full",
        badgeColors[color],
        size === "sm" ? "text-xs px-2 py-0.5" : "text-xs px-2.5 py-1",
      ].join(" ")}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[color]}`} />}
      {children}
    </span>
  );
}

// ─── Input ────────────────────────────────────────────────────────────────────

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  suffix?: React.ReactNode;
  prefix?: React.ReactNode;
}

export function Input({ label, hint, error, suffix, prefix, className = "", ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-slate-700">{label}</label>
      )}
      <div className="relative flex items-center">
        {prefix && (
          <span className="absolute left-3 text-slate-400 text-sm">{prefix}</span>
        )}
        <input
          className={[
            "w-full h-10 rounded-xl border border-slate-200 bg-slate-50",
            "text-sm text-slate-800 placeholder:text-slate-400",
            "focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-violet-400 focus:bg-white",
            "transition-all duration-150",
            prefix ? "pl-9" : "pl-3",
            suffix ? "pr-16" : "pr-3",
            error ? "border-rose-300 focus:ring-rose-400" : "",
            className,
          ].join(" ")}
          {...props}
        />
        {suffix && (
          <span className="absolute right-3 text-slate-500 text-sm font-medium">{suffix}</span>
        )}
      </div>
      {(error || hint) && (
        <p className={`text-xs ${error ? "text-rose-500" : "text-slate-400"}`}>
          {error || hint}
        </p>
      )}
    </div>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  sub?: string;
  icon?: React.ReactNode;
  color?: "violet" | "sky" | "emerald" | "rose" | "amber";
  loading?: boolean;
}

const statBg: Record<string, string> = {
  violet: "from-violet-50 to-purple-50",
  sky: "from-sky-50 to-blue-50",
  emerald: "from-emerald-50 to-teal-50",
  rose: "from-rose-50 to-pink-50",
  amber: "from-amber-50 to-yellow-50",
};

const statIconBg: Record<string, string> = {
  violet: "bg-violet-100 text-violet-600",
  sky: "bg-sky-100 text-sky-600",
  emerald: "bg-emerald-100 text-emerald-600",
  rose: "bg-rose-100 text-rose-600",
  amber: "bg-amber-100 text-amber-600",
};

export function StatCard({ label, value, sub, icon, color = "violet", loading }: StatCardProps) {
  return (
    <div className={`bg-gradient-to-br ${statBg[color]} rounded-2xl p-5 border border-white`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
          <div className="mt-1.5">
            {loading ? (
              <div className="h-8 w-24 bg-white/60 rounded-lg animate-pulse" />
            ) : (
              <p className="text-2xl font-bold text-slate-800 font-display truncate">{value}</p>
            )}
          </div>
          {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
        </div>
        {icon && (
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${statIconBg[color]}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Divider ──────────────────────────────────────────────────────────────────

export function Divider({ className = "" }: { className?: string }) {
  return <hr className={`border-slate-100 ${className}`} />;
}

// ─── Empty State ──────────────────────────────────────────────────────────────

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
      {icon && <div className="text-slate-300 mb-2">{icon}</div>}
      <p className="text-slate-700 font-semibold font-display">{title}</p>
      {description && <p className="text-slate-400 text-sm max-w-xs">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
