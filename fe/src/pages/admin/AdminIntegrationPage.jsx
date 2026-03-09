import React, { useEffect, useState } from "react";
import { http } from "../../services/http/httpClient.js";
import { AdminIntegrationView } from "./AdminIntegrationView.jsx";

/**
 * Container layer – quản lý state, gọi service, truyền data + handler xuống View.
 * Không chứa JSX UI trực tiếp.
 */
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

    return (
        <AdminIntegrationView
            config={config}
            form={form}
            saving={saving}
            msg={msg}
            onFieldChange={handleChange}
            onSave={handleSave}
        />
    );
}
