import React from "react";
import "./loading.css";

export function LoadingSpinner() {
  return (
    <div className="loading-wrap">
      <div className="spinner" />
      <div className="loading-text">Synchronizing data...</div>
    </div>
  );
}

export function Skeleton({
  width = "100%",
  height = "1rem",
  borderRadius = "4px",
  className = "",
}) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{ width, height, borderRadius }}
    />
  );
}
