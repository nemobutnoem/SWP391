import React, { useEffect, useState } from "react";
import { http } from "../../services/http/httpClient.js";
import { groupService } from "../../services/groups/group.service.js";
import { PageHeader } from "../../components/common/PageHeader.jsx";
import { Button } from "../../components/common/Button.jsx";
import { Badge } from "../../components/common/Badge.jsx";
import "./integrationConfig.css";

export function GroupIntegrationPage() {
    const [groups, setGroups] = useState([]);
    const [selectedGroupId, setSelectedGroupId] = useState(null);
    const [config, setConfig] = useState(null);
    const [form, setForm] = useState({
        jiraBaseUrl: "",
        jiraEmail: "",
        jiraApiToken: "",
        githubToken: "",
    });
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState(null);

    useEffect(() => {
        groupService.list().then((data) => {
            setGroups(data);
            if (data.length > 0) setSelectedGroupId(data[0].id);
        });
    }, []);

    const loadConfig = async (groupId) => {
        if (!groupId) return;
        setMsg(null);
        try {
            const res = await http.get(`/groups/${groupId}/settings/integrations`);
            setConfig(res.data);
            setForm({
                jiraBaseUrl: res.data.jiraBaseUrl || "",
                jiraEmail: res.data.jiraEmail || "",
                jiraApiToken: "",
                githubToken: "",
            });
        } catch (e) {
            setConfig(null);
            setMsg({ type: "error", text: "Failed to load group config" });
        }
    };

    useEffect(() => {
        if (selectedGroupId) loadConfig(selectedGroupId);
    }, [selectedGroupId]);

    const handleChange = (field) => (e) => {
        setForm((prev) => ({ ...prev, [field]: e.target.value }));
        setMsg(null);
    };

    const handleSave = async () => {
        if (!selectedGroupId) return;
        setSaving(true);
        setMsg(null);
        try {
            const payload = {};
            if (form.jiraBaseUrl !== (config?.jiraBaseUrl || "")) payload.jiraBaseUrl = form.jiraBaseUrl;
            if (form.jiraEmail !== (config?.jiraEmail || "")) payload.jiraEmail = form.jiraEmail;
            if (form.jiraApiToken) payload.jiraApiToken = form.jiraApiToken;
            if (form.githubToken) payload.githubToken = form.githubToken;

            if (Object.keys(payload).length === 0) {
                setMsg({ type: "info", text: "No changes to save" });
                setSaving(false);
                return;
            }

            const res = await http.put(`/groups/${selectedGroupId}/settings/integrations`, payload);
            setConfig(res.data);
            setForm((prev) => ({ ...prev, jiraApiToken: "", githubToken: "" }));
            setMsg({ type: "success", text: "Group configuration saved!" });
        } catch (e) {
            setMsg({ type: "error", text: e?.data?.message || "Failed to save" });
        }
        setSaving(false);
    };

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
                    onChange={(e) => setSelectedGroupId(Number(e.target.value))}
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
                                onChange={handleChange("jiraBaseUrl")}
                            />
                        </div>

                        <div className="integration-field">
                            <label className="integration-label">Jira Email</label>
                            <input
                                className="integration-input"
                                type="email"
                                placeholder="Leave blank to use admin default"
                                value={form.jiraEmail}
                                onChange={handleChange("jiraEmail")}
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
                                onChange={handleChange("jiraApiToken")}
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
                                onChange={handleChange("githubToken")}
                            />
                        </div>
                    </section>
                </div>
            )}

            <div className="integration-actions">
                <Button variant="primary" size="md" onClick={handleSave} disabled={saving || !selectedGroupId}>
                    {saving ? "Saving..." : "Save Group Config"}
                </Button>
            </div>
        </div>
    );
}
