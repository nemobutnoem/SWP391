import React from "react";
import "./activityHeatmap.css";

export function ActivityHeatmap({ activities = [] }) {
  // Generate mock days for the last 30 days
  const days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    const dateStr = date.toISOString().split("T")[0];

    const count = activities.filter((a) =>
      a.occurred_at.startsWith(dateStr),
    ).length;

    return { date: dateStr, count };
  });

  const getLevel = (count) => {
    if (count === 0) return 0;
    if (count < 2) return 1;
    if (count < 4) return 2;
    if (count < 6) return 3;
    return 4;
  };

  return (
    <div className="activity-heatmap">
      <div className="heatmap-header">
        <h3 className="heatmap-title">Code Contribution Heatmap</h3>
        <span className="heatmap-subtitle">Past 30 days of activity</span>
      </div>
      <div className="heatmap-grid">
        {days.map((day) => (
          <div
            key={day.date}
            className={`heatmap-cell heatmap-cell--level-${getLevel(day.count)}`}
            title={`${day.date}: ${day.count} activities`}
          />
        ))}
      </div>
      <div className="heatmap-legend">
        <span>Less</span>
        <div className="legend-cells">
          <div className="heatmap-cell heatmap-cell--level-0" />
          <div className="heatmap-cell heatmap-cell--level-1" />
          <div className="heatmap-cell heatmap-cell--level-2" />
          <div className="heatmap-cell heatmap-cell--level-3" />
          <div className="heatmap-cell heatmap-cell--level-4" />
        </div>
        <span>More</span>
      </div>
    </div>
  );
}
