import React from "react";
import { AlertCircle, CheckCircle, Info, X } from "lucide-react";

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "info";
  message: string;
}

interface ToastProps {
  toast: ToastMessage | null;
  onClose: () => void;
}

export function Toast({ toast, onClose }: ToastProps) {
  if (!toast) return null;

  const IconComponent =
    toast.type === "success"
      ? CheckCircle
      : toast.type === "error"
      ? AlertCircle
      : Info;

  return (
    <div className={`toast-banner toast-${toast.type}`} role="status" aria-live="polite">
      <IconComponent className="w-5 h-5 flex-shrink-0" />
      <span className="toast-text">{toast.message}</span>
      <button
        type="button"
        onClick={onClose}
        className="toast-close-btn"
        aria-label="Dismiss notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
