import React, { useMemo, useState } from "react";
import "./githubInsights.css";

/**
 * Reusable GitHub Insights component.
 * Renders:
 *   1) Contribution heatmap (GitHub-style green squares calendar)
 *   2) Contributor bar chart (commits per user)
 *
 * Props:
 *   activities: [{ github_username, occurred_at, pushed_commit_count }]
 *   weeks: number of weeks to show (default 12)
 */
export function GitHubInsights({ activities = [], weeks: initialWeeks = 12 }) {
    const [weeks, setWeeks] = useState(initialWeeks);

    const PERIOD_OPTIONS = [
        { value: 4, label: "1 month" },
        { value: 8, label: "2 months" },
        { value: 12, label: "3 months" },
        { value: 24, label: "6 months" },
        { value: 52, label: "1 year" },
    ];
    // Deduplicate activities by commit_sha to avoid counting the same commit on multiple branches
    const uniqueActivities = useMemo(() => {
        const seen = new Set();
        return activities.filter((a) => {
            if (!a.commit_sha || seen.has(a.commit_sha)) return false;
            seen.add(a.commit_sha);
            return true;
        });
    }, [activities]);

    // ===== Heatmap Data =====
    const { heatmapWeeks, maxCount, totalCommits } = useMemo(() => {
        const now = new Date();
        const dayMs = 86400000;
        // Start from `weeks` weeks ago, aligned to Monday
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const dayOfWeek = today.getDay() === 0 ? 6 : today.getDay() - 1; // Mon=0
        const startDate = new Date(today.getTime() - (weeks * 7 + dayOfWeek) * dayMs);

        // Count commits per date
        const dateCounts = {};
        let total = 0;
        uniqueActivities.forEach((a) => {
            if (!a.occurred_at) return;
            const d = new Date(a.occurred_at);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
            const count = a.pushed_commit_count || 1;
            dateCounts[key] = (dateCounts[key] || 0) + count;
            total += count;
        });

        // Build weeks grid
        const result = [];
        let max = 0;
        for (let w = 0; w <= weeks; w++) {
            const weekDays = [];
            for (let d = 0; d < 7; d++) {
                const date = new Date(startDate.getTime() + (w * 7 + d) * dayMs);
                if (date > today) {
                    weekDays.push({ date: null, count: 0 });
                    continue;
                }
                const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
                const count = dateCounts[key] || 0;
                if (count > max) max = count;
                weekDays.push({ date: key, count });
            }
            result.push(weekDays);
        }

        return { heatmapWeeks: result, maxCount: max, totalCommits: total };
    }, [uniqueActivities, weeks]);

    // ===== Contributor Data =====
    const contributors = useMemo(() => {
        const map = {};
        uniqueActivities.forEach((a) => {
            const user = a.github_username || "unknown";
            const count = a.pushed_commit_count || 1;
            map[user] = (map[user] || 0) + count;
        });
        return Object.entries(map)
            .map(([username, commits]) => ({ username, commits }))
            .sort((a, b) => b.commits - a.commits);
    }, [uniqueActivities]);

    const maxContrib = contributors.length > 0 ? contributors[0].commits : 1;

    // Color scale
    const getColor = (count) => {
        if (count === 0) return "var(--heatmap-empty, #ebedf0)";
        const ratio = count / Math.max(maxCount, 1);
        if (ratio <= 0.25) return "var(--heatmap-l1, #9be9a8)";
        if (ratio <= 0.5) return "var(--heatmap-l2, #40c463)";
        if (ratio <= 0.75) return "var(--heatmap-l3, #30a14e)";
        return "var(--heatmap-l4, #216e39)";
    };

    // Bar colors for contributors
    const barColors = [
        "#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b",
        "#10b981", "#6366f1", "#ef4444", "#14b8a6",
    ];

    if (activities.length === 0) {
        return (
            <div className="github-insights">
                <div className="github-insights__empty">
                    No GitHub activity data available. Sync GitHub data first.
                </div>
            </div>
        );
    }

    return (
        <div className="github-insights">
            {/* Contribution Heatmap */}
            <div className="github-insights__heatmap-section">
                <div className="github-insights__heatmap-header">
                    <h3 className="github-insights__title">
                        📊 Contribution Activity
                    </h3>
                    <div className="github-insights__controls">
                        <span className="github-insights__total">
                            {totalCommits} contributions
                        </span>
                        <select
                            className="github-insights__period-select"
                            value={weeks}
                            onChange={(e) => setWeeks(Number(e.target.value))}
                        >
                            {PERIOD_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="github-insights__heatmap-wrapper">
                    <div className="github-insights__day-labels">
                        <span>Mon</span>
                        <span>Wed</span>
                        <span>Fri</span>
                    </div>
                    <div className="github-insights__heatmap">
                        {heatmapWeeks.map((week, wi) => (
                            <div key={wi} className="github-insights__week">
                                {week.map((day, di) => (
                                    <div
                                        key={di}
                                        className="github-insights__cell"
                                        style={{ backgroundColor: day.date ? getColor(day.count) : "transparent" }}
                                        title={day.date ? `${day.date}: ${day.count} commit(s)` : ""}
                                    />
                                ))}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Legend */}
                <div className="github-insights__legend">
                    <span className="github-insights__legend-label">Less</span>
                    <div className="github-insights__cell" style={{ backgroundColor: "var(--heatmap-empty, #ebedf0)" }} />
                    <div className="github-insights__cell" style={{ backgroundColor: "var(--heatmap-l1, #9be9a8)" }} />
                    <div className="github-insights__cell" style={{ backgroundColor: "var(--heatmap-l2, #40c463)" }} />
                    <div className="github-insights__cell" style={{ backgroundColor: "var(--heatmap-l3, #30a14e)" }} />
                    <div className="github-insights__cell" style={{ backgroundColor: "var(--heatmap-l4, #216e39)" }} />
                    <span className="github-insights__legend-label">More</span>
                </div>
            </div>

            {/* Contributor Bar Chart */}
            <div className="github-insights__contributors">
                <h3 className="github-insights__title">
                    👥 Contributors ({contributors.length})
                </h3>
                <div className="github-insights__bars">
                    {contributors.map((c, i) => (
                        <div key={c.username} className="github-insights__bar-row">
                            <div className="github-insights__bar-label">
                                <span className="github-insights__bar-avatar">
                                    {c.username.charAt(0).toUpperCase()}
                                </span>
                                <span className="github-insights__bar-name">{c.username}</span>
                            </div>
                            <div className="github-insights__bar-track">
                                <div
                                    className="github-insights__bar-fill"
                                    style={{
                                        width: `${Math.max(8, (c.commits / maxContrib) * 100)}%`,
                                        backgroundColor: barColors[i % barColors.length],
                                    }}
                                />
                            </div>
                            <span className="github-insights__bar-count">
                                {c.commits}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
