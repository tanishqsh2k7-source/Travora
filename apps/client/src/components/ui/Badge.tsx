import React from "react";

export interface BadgeProps {
  children: React.ReactNode;
  variant?: "neutral" | "terracotta" | "teal" | "success" | "warning" | "demo";
  size?: "sm" | "md";
  className?: string;
}

export function Badge({
  children,
  variant = "neutral",
  size = "md",
  className = "",
}: BadgeProps) {
  return (
    <span className={`editorial-badge badge-${variant} badge-size-${size} ${className}`}>
      {children}
    </span>
  );
}
