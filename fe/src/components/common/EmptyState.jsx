import React from "react";
import "./emptyState.css";

export function EmptyState({
  title = "No data available",
  description = "We couldn't find what you're looking for.",
  icon = "📭",
  action,
}) {
  return (
    <div className="empty-state">
      <div className="empty-state__icon">{icon}</div>
      <h3 className="empty-state__title">{title}</h3>
      <p className="empty-state__desc">{description}</p>
      {action && <div className="empty-state__action">{action}</div>}
    </div>
  );
}
