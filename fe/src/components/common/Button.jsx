import React from "react";
import "./button.css";

export function Button({
  children,
  variant = "primary",
  size = "md",
  icon,
  className = "",
  disabled = false,
  ...props
}) {
  return (
    <button
      className={`btn btn--${variant} btn--${size} ${className}`}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="btn__icon">{icon}</span>}
      {children}
    </button>
  );
}
