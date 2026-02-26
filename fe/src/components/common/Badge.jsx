import React from "react";
import "./badge.css";

export function Badge({
  children,
  variant = "neutral",
  size = "md",
  className = "",
}) {
  return (
    <span className={`badge badge--${variant} badge--${size} ${className}`}>
      {children}
    </span>
  );
}
