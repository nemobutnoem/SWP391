import React, { useEffect, useState } from "react";
import { http } from "../../services/http/httpClient.js";
import { groupService } from "../../services/groups/group.service.js";
import { GroupIntegrationView } from "./GroupIntegrationView.jsx";

/**
 * Container layer – quản lý state, gọi service, truyền data + handler xuống View.
 * Không chứa JSX UI trực tiếp.
 */
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
        <GroupIntegrationView
            groups={groups}
            selectedGroupId={selectedGroupId}
            config={config}
            form={form}
            saving={saving}
            msg={msg}
            onGroupChange={setSelectedGroupId}
            onFieldChange={handleChange}
            onSave={handleSave}
        />
    );
}
