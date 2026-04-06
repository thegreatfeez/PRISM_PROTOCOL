import { CheckCircle, XCircle, Info, AlertTriangle, X } from "lucide-react";
import { ToastMessage } from "../../types";

const config = {
  success: {
    icon: CheckCircle,
    bg: "bg-emerald-50 border-emerald-200",
    icon_color: "text-emerald-500",
    title_color: "text-emerald-800",
    desc_color: "text-emerald-600",
  },
  error: {
    icon: XCircle,
    bg: "bg-rose-50 border-rose-200",
    icon_color: "text-rose-500",
    title_color: "text-rose-800",
    desc_color: "text-rose-600",
  },
  info: {
    icon: Info,
    bg: "bg-sky-50 border-sky-200",
    icon_color: "text-sky-500",
    title_color: "text-sky-800",
    desc_color: "text-sky-600",
  },
  warning: {
    icon: AlertTriangle,
    bg: "bg-amber-50 border-amber-200",
    icon_color: "text-amber-500",
    title_color: "text-amber-800",
    desc_color: "text-amber-600",
  },
};

interface ToastProps {
  toast: ToastMessage;
  onRemove: (id: string) => void;
}

function Toast({ toast, onRemove }: ToastProps) {
  const c = config[toast.type];
  const Icon = c.icon;
  return (
    <div
      className={`flex items-start gap-3 p-3.5 rounded-xl border shadow-lg ${c.bg} max-w-sm w-full`}
      style={{ animation: "toast-in 0.2s ease-out" }}
    >
      <Icon size={18} className={`flex-shrink-0 mt-0.5 ${c.icon_color}`} />
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${c.title_color}`}>{toast.title}</p>
        {toast.description && (
          <p className={`text-xs mt-0.5 ${c.desc_color}`}>{toast.description}</p>
        )}
      </div>
      <button
        onClick={() => onRemove(toast.id)}
        className="text-slate-400 hover:text-slate-600 flex-shrink-0"
      >
        <X size={14} />
      </button>
    </div>
  );
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} onRemove={onRemove} />
      ))}
      <style>{`
        @keyframes toast-in {
          from { opacity: 0; transform: translateX(12px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
