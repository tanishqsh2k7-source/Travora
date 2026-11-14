import React from "react";

export interface FieldProps {
  label: string;
  id?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function Field({
  label,
  id,
  hint,
  error,
  required = false,
  children,
  className = "",
}: FieldProps) {
  return (
    <div className={`form-field ${error ? "has-error" : ""} ${className}`}>
      <div className="field-header">
        <label htmlFor={id} className="field-label">
          {label}
          {required && <span className="field-required" aria-hidden="true">*</span>}
        </label>
        {hint && <span className="field-hint">{hint}</span>}
      </div>

      <div className="field-control">{children}</div>

      {error && (
        <p className="field-error-msg" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
