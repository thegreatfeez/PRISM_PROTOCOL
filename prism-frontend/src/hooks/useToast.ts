import { useState, useCallback } from "react";
import { ToastMessage } from "../types";

let toastCounter = 0;

export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback(
    (type: ToastMessage["type"], title: string, description?: string) => {
      const id = `toast-${++toastCounter}`;
      setToasts((prev) => [...prev, { id, type, title, description }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 5000);
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = (title: string, description?: string) => addToast("success", title, description);
  const error = (title: string, description?: string) => addToast("error", title, description);
  const info = (title: string, description?: string) => addToast("info", title, description);
  const warning = (title: string, description?: string) => addToast("warning", title, description);

  return { toasts, success, error, info, warning, removeToast };
}
