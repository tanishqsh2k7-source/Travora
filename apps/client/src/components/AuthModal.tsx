import React, { useState } from "react";
import { X, Lock, Mail, User as UserIcon, ArrowRight, CheckCircle2 } from "lucide-react";
import type { AuthUser } from "@travora/contracts";
import { loginUser, registerUser } from "../api/client.js";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: AuthUser) => void;
  initialMode?: "login" | "register";
}

export function AuthModal({
  isOpen,
  onClose,
  onAuthSuccess,
  initialMode = "login",
}: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (mode === "login") {
        const user = await loginUser({ email, password });
        onAuthSuccess(user);
        onClose();
      } else {
        if (!name.trim()) {
          throw new Error("Please enter your name");
        }
        if (password.length < 6) {
          throw new Error("Password must be at least 6 characters");
        }
        const user = await registerUser({ name, email, password });
        onAuthSuccess(user);
        onClose();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="auth-modal-content" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="auth-modal-close" onClick={onClose} aria-label="Close">
          <X className="w-5 h-5" />
        </button>

        <div className="auth-modal-header">
          <div className="auth-brand-badge">
            <span className="brand-dot"></span>
            <span>TRAVORA ACCOUNT</span>
          </div>
          <h2 className="auth-modal-title">
            {mode === "login" ? "Welcome Back" : "Start Your Journey"}
          </h2>
          <p className="auth-modal-subtitle">
            {mode === "login"
              ? "Sign in to access your saved trips, custom itineraries, and bookings."
              : "Create an account to save curated routes, personalize travel preferences, and replan on the go."}
          </p>

          <div className="auth-tab-switch">
            <button
              type="button"
              className={`auth-tab-btn ${mode === "login" ? "active" : ""}`}
              onClick={() => {
                setMode("login");
                setError(null);
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`auth-tab-btn ${mode === "register" ? "active" : ""}`}
              onClick={() => {
                setMode("register");
                setError(null);
              }}
            >
              Create Account
            </button>
          </div>
        </div>

        {error && (
          <div className="auth-error-alert" role="alert">
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {mode === "register" && (
            <div className="auth-field-group">
              <label className="auth-label" htmlFor="auth-name">
                Full Name
              </label>
              <div className="auth-input-wrapper">
                <UserIcon className="auth-input-icon w-4 h-4" />
                <input
                  id="auth-name"
                  type="text"
                  required
                  placeholder="e.g. Alex Henderson"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="auth-input"
                  autoComplete="name"
                />
              </div>
            </div>
          )}

          <div className="auth-field-group">
            <label className="auth-label" htmlFor="auth-email">
              Email Address
            </label>
            <div className="auth-input-wrapper">
              <Mail className="auth-input-icon w-4 h-4" />
              <input
                id="auth-email"
                type="email"
                required
                placeholder="you@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="auth-input"
                autoComplete="email"
              />
            </div>
          </div>

          <div className="auth-field-group">
            <label className="auth-label" htmlFor="auth-password">
              Password {mode === "register" && "(at least 6 characters)"}
            </label>
            <div className="auth-input-wrapper">
              <Lock className="auth-input-icon w-4 h-4" />
              <input
                id="auth-password"
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="auth-input"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="auth-submit-btn"
          >
            {isLoading ? (
              <span className="auth-spinner">Processing...</span>
            ) : (
              <>
                <span>{mode === "login" ? "Sign In to Travora" : "Create My Account"}</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </button>
        </form>

        <div className="auth-footer-security">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald mr-1.5 inline" />
          <span>Secured with JWT authentication & MongoDB database persistence</span>
        </div>
      </div>
    </div>
  );
}
export default AuthModal;
