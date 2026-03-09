import React from "react";
import { PageHeader } from "../../components/common/PageHeader.jsx";
import { Button } from "../../components/common/Button.jsx";
import { Badge } from "../../components/common/Badge.jsx";
import "./integrationConfig.css";

/**
 * Presentation layer – nhận tất cả data và handler qua props.
 * Không có state, không gọi service.
 */
export function AdminIntegrationView({ config, form, saving, msg, onFieldChange, onSave }) {
    if (!config) return <div className="integration-loading">Loading configuration...</div>;

    return (
        <div className="integration-page">
            <PageHeader
                title="Integration Settings"
                description="Configure system-level Jira and GitHub tokens. These are used as defaults for all groups."
            />

            {msg && (
                <div className={`integration-msg integration-msg--${msg.type}`}>
                    {msg.text}
                </div>
            )}

            <div className="integration-cards">
                {/* Jira Config */}
                <section className="integration-card">
                    <div className="integration-card__header">
                        <span className="integration-card__icon">🔵</span>
                        <h3 className="integration-card__title">Jira Configuration</h3>
                        <Badge variant={config.jira_api_token_set ? "success" : "warning"} size="sm">
                            {config.jira_api_token_set ? "Token Set" : "Not Configured"}
                        </Badge>
                    </div>

                    <div className="integration-field">
                        <label className="integration-label">Jira Base URL</label>
                        <input
                            className="integration-input"
                            type="url"
                            placeholder="https://yourteam.atlassian.net"
                            value={form.jira_base_url}
                            onChange={onFieldChange("jira_base_url")}
                        />
                        <span className="integration-hint">Your Jira instance URL</span>
                    </div>

                    <div className="integration-field">
                        <label className="integration-label">Jira Email</label>
                        <input
                            className="integration-input"
                            type="email"
                            placeholder="admin@example.com"
                            value={form.jira_email}
                            onChange={onFieldChange("jira_email")}
                        />
                        <span className="integration-hint">Email associated with your Jira account</span>
                    </div>

                    <div className="integration-field">
                        <label className="integration-label">
                            Jira API Token
                            {config.jira_api_token_set && (
                                <span className="integration-label-badge">● Currently set</span>
                            )}
                        </label>
                        <input
                            className="integration-input"
                            type="password"
                            placeholder={config.jira_api_token_set ? "••••••••• (leave blank to keep)" : "Paste your Jira API token"}
                            value={form.jira_api_token}
                            onChange={onFieldChange("jira_api_token")}
                        />
                        <span className="integration-hint">
                            Generate from{" "}
                            <a href="https://id.atlassian.com/manage-profile/security/api-tokens" target="_blank" rel="noreferrer">
                                Atlassian API Tokens
                            </a>
                        </span>
                    </div>
                </section>

                {/* GitHub Config */}
                <section className="integration-card">
                    <div className="integration-card__header">
                        <span className="integration-card__icon">⚫</span>
                        <h3 className="integration-card__title">GitHub Configuration</h3>
                        <Badge variant={config.github_token_set ? "success" : "warning"} size="sm">
                            {config.github_token_set ? "Token Set" : "Not Configured"}
                        </Badge>
                    </div>

                    <div className="integration-field">
                        <label className="integration-label">
                            GitHub Personal Access Token
                            {config.github_token_set && (
                                <span className="integration-label-badge">● Currently set</span>
                            )}
                        </label>
                        <input
                            className="integration-input"
                            type="password"
                            placeholder={config.github_token_set ? "••••••••• (leave blank to keep)" : "ghp_xxxxxxxxxxxx"}
                            value={form.github_token}
                            onChange={onFieldChange("github_token")}
                        />
                        <span className="integration-hint">
                            Generate from{" "}
                            <a href="https://github.com/settings/tokens" target="_blank" rel="noreferrer">
                                GitHub Settings → Developer settings → Personal access tokens
                            </a>
                        </span>
                    </div>
                </section>
            </div>

            <div className="integration-actions">
                <Button variant="primary" size="md" onClick={onSave} disabled={saving}>
                    {saving ? "Saving..." : "Save Configuration"}
                </Button>
            </div>
        </div>
    );
}
