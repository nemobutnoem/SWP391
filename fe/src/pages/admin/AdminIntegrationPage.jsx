import React, { useEffect, useState } from "react";
import { http } from "../../services/http/httpClient.js";
import { PageHeader } from "../../components/common/PageHeader.jsx";
import { Button } from "../../components/common/Button.jsx";
import { Badge } from "../../components/common/Badge.jsx";
import "./integrationConfig.css";

export function AdminIntegrationPage() {
    const [config, setConfig] = useState(null);
    const [form, setForm] = useState({
        jira_base_url: "",
        jira_email: "",
        jira_api_token: "",
        github_token: "",
    });
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState(null);

    const load = async () => {
        try {
            const res = await http.get("/admin/integrations");
            setConfig(res.data);
            setForm({
                jira_base_url: res.data.jira_base_url || "",
                jira_email: res.data.jira_email || "",
                jira_api_token: "",
                github_token: "",
            });
        } catch (e) {
            setMsg({ type: "error", text: "Failed to load config" });
        }
    };

    useEffect(() => { load(); }, []);

    const handleChange = (field) => (e) => {
        setForm((prev) => ({ ...prev, [field]: e.target.value }));
        setMsg(null);
    };

    const handleSave = async () => {
        setSaving(true);
        setMsg(null);
        try {
            const payload = {};
            if (form.jira_base_url !== (config?.jira_base_url || "")) payload.jira_base_url = form.jira_base_url;
            if (form.jira_email !== (config?.jira_email || "")) payload.jira_email = form.jira_email;
            if (form.jira_api_token) payload.jira_api_token = form.jira_api_token;
            if (form.github_token) payload.github_token = form.github_token;

            if (Object.keys(payload).length === 0) {
                setMsg({ type: "info", text: "No changes to save" });
                setSaving(false);
                return;
            }

            const res = await http.put("/admin/integrations", payload);
            setConfig(res.data);
            setForm((prev) => ({ ...prev, jira_api_token: "", github_token: "" }));
            setMsg({ type: "success", text: "Configuration saved successfully!" });
        } catch (e) {
            setMsg({ type: "error", text: e?.data?.message || "Failed to save" });
        }
        setSaving(false);
    };

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
                            onChange={handleChange("jira_base_url")}
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
                            onChange={handleChange("jira_email")}
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
                            onChange={handleChange("jira_api_token")}
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
                            onChange={handleChange("github_token")}
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
                <Button variant="primary" size="md" onClick={handleSave} disabled={saving}>
                    {saving ? "Saving..." : "Save Configuration"}
                </Button>
            </div>
        </div>
    );
}
