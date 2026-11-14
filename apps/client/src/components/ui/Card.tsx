import React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  elevation?: "flat" | "elevated";
  interactive?: boolean;
  className?: string;
}

export function Card({
  children,
  elevation = "elevated",
  interactive = false,
  className = "",
  ...props
}: CardProps) {
  return (
    <div
      className={`editorial-card card-${elevation} ${interactive ? "is-interactive" : ""} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
