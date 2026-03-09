import React from "react";
import { PageHeader } from "../../components/common/PageHeader.jsx";
import { Button } from "../../components/common/Button.jsx";
import { Badge } from "../../components/common/Badge.jsx";
import "./integrationConfig.css";

/**
 * Presentation layer – nhận tất cả data và handler qua props.
 * Không có state, không gọi service.
 */
export function GroupIntegrationView({
    groups,
    selectedGroupId,
    config,
    form,
    saving,
    msg,
    onGroupChange,
    onFieldChange,
    onSave,
}) {
    return (
        <div className="integration-page">
            <PageHeader
                title="Group Integration Settings"
                description="Configure Jira and GitHub tokens for your group. Group-level tokens override admin defaults."
            />

            {/* Group Selector */}
            <div className="integration-group-selector">
                <label className="integration-label">Select Group</label>
                <select
                    className="integration-input"
                    value={selectedGroupId || ""}
                    onChange={(e) => onGroupChange(Number(e.target.value))}
                >
                    {groups.map((g) => (
                        <option key={g.id} value={g.id}>
                            {g.group_name || `Group ${g.id}`}
                        </option>
                    ))}
                </select>
            </div>

            {msg && (
                <div className={`integration-msg integration-msg--${msg.type}`}>
                    {msg.text}
                </div>
            )}

            {config && (
                <div className="integration-cards">
                    {/* Jira Config */}
                    <section className="integration-card">
                        <div className="integration-card__header">
                            <span className="integration-card__icon">🔵</span>
                            <h3 className="integration-card__title">Jira Configuration</h3>
                            <Badge variant={config.jiraApiTokenSet ? "success" : "warning"} size="sm">
                                {config.jiraApiTokenSet ? "Token Set" : "Using Default"}
                            </Badge>
                        </div>

                        <div className="integration-field">
                            <label className="integration-label">Jira Base URL</label>
                            <input
                                className="integration-input"
                                type="url"
                                placeholder="https://yourteam.atlassian.net (leave blank for admin default)"
                                value={form.jiraBaseUrl}
                                onChange={onFieldChange("jiraBaseUrl")}
                            />
                        </div>

                        <div className="integration-field">
                            <label className="integration-label">Jira Email</label>
                            <input
                                className="integration-input"
                                type="email"
                                placeholder="Leave blank to use admin default"
                                value={form.jiraEmail}
                                onChange={onFieldChange("jiraEmail")}
                            />
                        </div>

                        <div className="integration-field">
                            <label className="integration-label">
                                Jira API Token
                                {config.jiraApiTokenSet && (
                                    <span className="integration-label-badge">● Set for this group</span>
                                )}
                            </label>
                            <input
                                className="integration-input"
                                type="password"
                                placeholder={config.jiraApiTokenSet ? "••••••••• (leave blank to keep)" : "Leave blank to use admin default"}
                                value={form.jiraApiToken}
                                onChange={onFieldChange("jiraApiToken")}
                            />
                        </div>
                    </section>

                    {/* GitHub Config */}
                    <section className="integration-card">
                        <div className="integration-card__header">
                            <span className="integration-card__icon">⚫</span>
                            <h3 className="integration-card__title">GitHub Configuration</h3>
                            <Badge variant={config.githubTokenSet ? "success" : "warning"} size="sm">
                                {config.githubTokenSet ? "Token Set" : "Using Default"}
                            </Badge>
                        </div>

                        <div className="integration-field">
                            <label className="integration-label">
                                GitHub Personal Access Token
                                {config.githubTokenSet && (
                                    <span className="integration-label-badge">● Set for this group</span>
                                )}
                            </label>
                            <input
                                className="integration-input"
                                type="password"
                                placeholder={config.githubTokenSet ? "••••••••• (leave blank to keep)" : "Leave blank to use admin default"}
                                value={form.githubToken}
                                onChange={onFieldChange("githubToken")}
                            />
                        </div>
                    </section>
                </div>
            )}

            <div className="integration-actions">
                <Button variant="primary" size="md" onClick={onSave} disabled={saving || !selectedGroupId}>
                    {saving ? "Saving..." : "Save Group Config"}
                </Button>
            </div>
        </div>
    );
}
