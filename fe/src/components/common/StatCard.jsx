import React from "react";
import "./statCard.css";

export function StatCard({ title, value, subtext, trend, trendValue, icon }) {
  const isPositive = trend === "success";
  const isNegative = trend === "danger";

  return (
    <div className="stat-card">
      <div className="stat-card__header">
        <span className="stat-card__title">{title}</span>
        {icon && <div className="stat-card__icon">{icon}</div>}
      </div>
      <div className="stat-card__body">
        <div className="stat-card__value">{value}</div>
        {(subtext || trend) && (
          <div className="stat-card__footer">
            {trend && (
              <span className={`stat-card__trend stat-card__trend--${trend}`}>
                {isPositive ? "↑" : isNegative ? "↓" : "•"} {trendValue}
              </span>
            )}
            {subtext && <span className="stat-card__subtext">{subtext}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
