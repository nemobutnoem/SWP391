import React from "react";
import { Badge } from "./Badge.jsx";
import "./statusComponents.css";

const PRIORITY_MAP = {
  HIGH: { variant: "danger", icon: "🔴", label: "High" },
  MEDIUM: { variant: "warning", icon: "🟠", label: "Medium" },
  LOW: { variant: "success", icon: "🟢", label: "Low" },
};

const STATUS_MAP = {
  TODO: { variant: "neutral", label: "To Do" },
  IN_PROGRESS: { variant: "info", label: "In Progress" },
  IN_REVIEW: { variant: "primary", label: "In Review" },
  DONE: { variant: "success", label: "Completed" },
  OVERDUE: { variant: "danger", label: "Overdue" },
};

export function PriorityIcon({ priority }) {
  const meta = PRIORITY_MAP[priority] || PRIORITY_MAP.MEDIUM;
  return (
    <div className={`priority priority--${meta.variant}`} title={meta.label}>
      <span className="priority__icon">{meta.icon}</span>
      <span className="priority__label">{meta.label}</span>
    </div>
  );
}

export function StatusBadge({ status }) {
  const meta = STATUS_MAP[status] || { variant: "neutral", label: status };
  return (
    <Badge variant={meta.variant} size="md">
      {meta.label}
    </Badge>
  );
}
