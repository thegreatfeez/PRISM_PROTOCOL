import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: "sm" | "md" | "lg" | "none";
  accent?: "violet" | "sky" | "emerald" | "rose" | "amber" | "none";
}

const paddingMap = {
  none: "",
  sm: "p-4",
  md: "p-5",
  lg: "p-6",
};

const accentMap = {
  none: "",
  violet: "border-l-4 border-l-violet-400",
  sky: "border-l-4 border-l-sky-400",
  emerald: "border-l-4 border-l-emerald-400",
  rose: "border-l-4 border-l-rose-400",
  amber: "border-l-4 border-l-amber-400",
};

export function Card({
  children,
  className = "",
  hover = false,
  padding = "md",
  accent = "none",
}: CardProps) {
  return (
    <div
      className={[
        "bg-white rounded-2xl border border-slate-100 shadow-sm",
        paddingMap[padding],
        accentMap[accent],
        hover
          ? "transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
          : "",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex items-center justify-between mb-4 ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <h3 className={`text-base font-semibold text-slate-800 font-display ${className}`}>
      {children}
    </h3>
  );
}
