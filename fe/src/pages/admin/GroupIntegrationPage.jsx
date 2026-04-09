import React, { useEffect, useMemo, useState } from "react";
import { http } from "../../services/http/httpClient.js";
import { groupService } from "../../services/groups/group.service.js";
import { semesterService } from "../../services/semesters/semester.service.js";
import { classService } from "../../services/classes/class.service.js";
import { PageHeader } from "../../components/common/PageHeader.jsx";
import { Button } from "../../components/common/Button.jsx";
import { Badge } from "../../components/common/Badge.jsx";
import { useAuth } from "../../store/auth/useAuth.jsx";
import { ROLES } from "../../routes/access/roles.js";
import "./integrationConfig.css";

export function GroupIntegrationPage() {
    const { user } = useAuth();
    const userRole = user?.role;
    const isAdmin = userRole === ROLES.ADMIN;
    const isLecturer = userRole === ROLES.LECTURER;
    const canEdit = userRole === ROLES.TEAM_LEAD || isAdmin || userRole === ROLES.LECTURER;

    // All groups (for both admin and team lead)
    const [groups, setGroups] = useState([]);
    const [selectedGroupId, setSelectedGroupId] = useState(null);

    // Admin hierarchical filters
    const [semesters, setSemesters] = useState([]);
    const [classes, setClasses] = useState([]);
    const [selectedSemesterId, setSelectedSemesterId] = useState(null);
    const [selectedClassId, setSelectedClassId] = useState(null);

    // Config form
    const [config, setConfig] = useState(null);
    const [form, setForm] = useState({
        jiraBaseUrl: "",
        jiraEmail: "",
        jiraApiToken: "",
        githubToken: "",
        jiraProjectKey: "",
        githubRepoUrl: "",
    });
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState(null);

    const dedupeGroupsById = (list) => {
        const seen = new Set();
        return (Array.isArray(list) ? list : []).filter((g) => {
            const id = Number(g?.id);
            if (!Number.isFinite(id)) return false;
            if (seen.has(id)) return false;
            seen.add(id);
            return true;
        });
    };

    // ── Load initial data ──
    useEffect(() => {
        if (isAdmin) {
            // Admin: load semesters + all groups
            Promise.all([
                semesterService.list().catch(() => []),
                groupService.list().catch(() => []),
            ]).then(([semData, groupData]) => {
                setSemesters(semData);
                setGroups(groupData);
                // Auto-select active semester
                const active = semData.find((s) => s.status?.toLowerCase() === "active");
                if (active) setSelectedSemesterId(active.id);
                else if (semData.length > 0) setSelectedSemesterId(semData[0].id);
            });
        } else {
            // Non-admin: show only groups in ACTIVE semester + ACTIVE class
            Promise.all([
                groupService.list().catch(() => []),
                semesterService.list().catch(() => []),
                classService.list().catch(() => []),
            ]).then(([groupData, semData, classData]) => {
                const normalizedGroups = dedupeGroupsById(groupData);
                const normalizedSemesters = Array.isArray(semData) ? semData : [];
                const normalizedClasses = Array.isArray(classData) ? classData : [];

                setGroups(normalizedGroups);
                setSemesters(normalizedSemesters);
                setClasses(normalizedClasses);

                const activeSemester = normalizedSemesters.find((s) => String(s?.status || "").toLowerCase() === "active");
                const activeSemesterId = activeSemester?.id ?? null;
                setSelectedSemesterId(activeSemesterId);

                const activeClassIds = new Set(
                    normalizedClasses
                        .filter((c) => String(c?.status || "").toLowerCase() === "active")
                        .filter((c) => activeSemesterId == null || Number(c?.semester_id ?? c?.semesterId) === Number(activeSemesterId))
                        .map((c) => Number(c.id)),
                );

                const scopedGroups = normalizedGroups.filter((g) => {
                    const gSemesterId = Number(g?.semester_id ?? g?.semesterId);
                    const gClassId = Number(g?.class_id ?? g?.classId);
                    const semOk = activeSemesterId == null || gSemesterId === Number(activeSemesterId);
                    const classOk = activeClassIds.size === 0 || activeClassIds.has(gClassId);
                    return semOk && classOk;
                });

                setSelectedGroupId(scopedGroups.length > 0 ? scopedGroups[0].id : null);
            });
        }
    }, [isAdmin]);

    // ── Admin: load classes when semester changes ──
    useEffect(() => {
        if (!isAdmin || !selectedSemesterId) return;
        setSelectedClassId(null);
        setSelectedGroupId(null);
        setConfig(null);
        classService.list(selectedSemesterId).then((data) => {
            setClasses(data);
            if (data.length > 0) setSelectedClassId(data[0].id);
        }).catch(() => setClasses([]));
    }, [isAdmin, selectedSemesterId]);

    // ── Admin: filter groups when class changes ──
    const filteredGroups = useMemo(() => {
        if (isAdmin) {
            if (!selectedClassId) return [];
            return dedupeGroupsById(groups.filter((g) => Number(g.class_id ?? g.classId) === Number(selectedClassId)));
        }

        const activeSemester = semesters.find((s) => String(s?.status || "").toLowerCase() === "active");
        const activeSemesterId = activeSemester?.id ?? null;
        const activeClassIds = new Set(
            (Array.isArray(classes) ? classes : [])
                .filter((c) => String(c?.status || "").toLowerCase() === "active")
                .filter((c) => activeSemesterId == null || Number(c?.semester_id ?? c?.semesterId) === Number(activeSemesterId))
                .map((c) => Number(c.id)),
        );

        return dedupeGroupsById(
            groups.filter((g) => {
                const gSemesterId = Number(g?.semester_id ?? g?.semesterId);
                const gClassId = Number(g?.class_id ?? g?.classId);
                const semOk = activeSemesterId == null || gSemesterId === Number(activeSemesterId);
                const classOk = activeClassIds.size === 0 || activeClassIds.has(gClassId);
                return semOk && classOk;
            }),
        );
    }, [isAdmin, groups, selectedClassId, semesters, classes]);

    // Auto-select first group when class changes
    useEffect(() => {
        if (filteredGroups.length > 0) {
            const exists = filteredGroups.some((g) => Number(g.id) === Number(selectedGroupId));
            if (!exists) {
                setSelectedGroupId(filteredGroups[0].id);
            }
        } else {
            setSelectedGroupId(null);
            setConfig(null);
        }
    }, [filteredGroups, selectedGroupId]);

    // ── Load config when group changes ──
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
                jiraProjectKey: res.data.jiraProjectKey || "",
                githubRepoUrl: res.data.githubRepoUrl || "",
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
            if (form.jiraProjectKey !== (config?.jiraProjectKey || "")) payload.jiraProjectKey = form.jiraProjectKey;
            if (form.githubRepoUrl !== (config?.githubRepoUrl || "")) payload.githubRepoUrl = form.githubRepoUrl;

            if (Object.keys(payload).length === 0) {
                setMsg({ type: "info", text: "No changes to save" });
                setSaving(false);
                return;
            }

            const res = await http.put(`/groups/${selectedGroupId}/settings/integrations`, payload);
            setConfig(res.data);
            setForm((prev) => ({ ...prev, jiraApiToken: "", githubToken: "", jiraProjectKey: res.data.jiraProjectKey || "", githubRepoUrl: res.data.githubRepoUrl || "" }));
            setMsg({
                type: "success",
                text: `Saved configuration for Group #${selectedGroupId}${res.data.jiraProjectKey ? ` (Jira Key: ${res.data.jiraProjectKey})` : ""}.`,
            });
        } catch (e) {
            setMsg({ type: "error", text: e?.data?.message || "Failed to save" });
        }
        setSaving(false);
    };

    // Display groups for the selector (admin uses filtered, others use all)
    const displayGroups = isAdmin ? filteredGroups : groups;
    const showGroupSelector = isAdmin || isLecturer || displayGroups.length > 1;

    const selectedGroup = displayGroups.find((g) => Number(g.id) === Number(selectedGroupId)) || null;
    const selectedGroupClassId = Number(selectedGroup?.class_id ?? selectedGroup?.classId);
    const selectedGroupClass = (Array.isArray(classes) ? classes : []).find((c) => Number(c.id) === selectedGroupClassId);
    const isSelectedClassActive = String(selectedGroupClass?.status || "").toLowerCase() === "active";
    const canEditSelectedGroup = canEdit && (selectedGroup ? isSelectedClassActive : true);

    const getStatusLabel = (value) => {
        const s = String(value || "").toLowerCase();
        return s === "active" ? "Active" : "Inactive";
    };

    const getGroupOptionLabel = (g) => {
        const classId = Number(g?.class_id ?? g?.classId);
        const semesterId = Number(g?.semester_id ?? g?.semesterId);
        const clazz = (Array.isArray(classes) ? classes : []).find((c) => Number(c.id) === classId);
        const semester = (Array.isArray(semesters) ? semesters : []).find((s) => Number(s.id) === semesterId);

        const groupName = g.group_name || `Group ${g.id}`;
        const classCode = clazz?.class_code || clazz?.classCode || `Class ${classId}`;
        const semCode = semester?.code || semester?.semester_name || semester?.name || `Sem ${semesterId}`;

        const groupStatus = getStatusLabel(g?.status);
        const classStatus = getStatusLabel(clazz?.status);
        const semesterStatus = getStatusLabel(semester?.status);

        return `#${g.id} - ${groupName} - ${classCode} (${classStatus}) - ${semCode} (${semesterStatus}) - Group ${groupStatus}`;
    };

    return (
        <div className="integration-page">
            <PageHeader
                title="Group Integration Settings"
                description="Configure Jira and GitHub tokens for your group. Group-level tokens override admin defaults."
            />

            {/* ── Admin: Semester → Class → Group selectors ── */}
            {isAdmin && (
                <div className="integration-admin-filters">
                    <div className="integration-filter-row">
                        <div className="integration-filter-group">
                            <label className="integration-label">Semester</label>
                            <select
                                className="integration-input"
                                value={selectedSemesterId || ""}
                                onChange={(e) => setSelectedSemesterId(Number(e.target.value))}
                            >
                                <option value="" disabled>-- Select Semester --</option>
                                {semesters.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.semester_name || s.name || `Semester ${s.id}`}
                                        {s.status?.toLowerCase() === "active" ? " (Active)" : ""}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="integration-filter-group">
                            <label className="integration-label">Class</label>
                            <select
                                className="integration-input"
                                value={selectedClassId || ""}
                                onChange={(e) => setSelectedClassId(Number(e.target.value))}
                                disabled={!selectedSemesterId || classes.length === 0}
                            >
                                <option value="" disabled>-- Select Class --</option>
                                {classes.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.class_code || c.name || `Class ${c.id}`}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="integration-filter-group">
                            <label className="integration-label">Group</label>
                            <select
                                className="integration-input"
                                value={selectedGroupId || ""}
                                onChange={(e) => setSelectedGroupId(Number(e.target.value))}
                                disabled={displayGroups.length === 0}
                            >
                                <option value="" disabled>-- Select Group --</option>
                                {displayGroups.map((g) => (
                                    <option key={g.id} value={g.id}>
                                        {getGroupOptionLabel(g)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Non-admin: allow selecting group when user has multiple groups (especially lecturers) ── */}
            {!isAdmin && displayGroups.length > 0 && showGroupSelector && (
                <div className="integration-group-info">
                    <label className="integration-label">Group</label>
                    <select
                        className="integration-input"
                        value={selectedGroupId || ""}
                        onChange={(e) => setSelectedGroupId(Number(e.target.value))}
                        disabled={displayGroups.length === 0}
                    >
                        <option value="" disabled>-- Select Group --</option>
                        {displayGroups.map((g) => (
                            <option key={g.id} value={g.id}>
                                {getGroupOptionLabel(g)}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {!isAdmin && displayGroups.length > 0 && !showGroupSelector && (
                <div className="integration-group-info">
                    <label className="integration-label">Your Group</label>
                    <div className="integration-group-name">
                        {displayGroups[0]?.group_name || `Group ${displayGroups[0]?.id}`}
                    </div>
                </div>
            )}

            {msg && (
                <div className={`integration-msg integration-msg--${msg.type}`}>
                    {msg.text}
                </div>
            )}

            {selectedGroup && !isSelectedClassActive && (
                <div className="integration-msg integration-msg--warning">
                    This group's class is inactive. Integration settings are read-only.
                </div>
            )}

            {selectedGroup && (
                <div className="integration-msg integration-msg--info">
                    Editing Group #{selectedGroup.id}
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
                                readOnly={!canEditSelectedGroup}
                            />
                            <span className="integration-hint">Copy from your Jira board URL (the part before /jira/...)</span>
                        </div>

                        <div className="integration-field">
                            <label className="integration-label">Jira Email</label>
                            <input
                                className="integration-input"
                                type="email"
                                placeholder="Leave blank to use admin default"
                                value={form.jiraEmail}
                                onChange={handleChange("jiraEmail")}
                                readOnly={!canEditSelectedGroup}
                            />
                            <span className="integration-hint">The email you use to login Jira</span>
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
                                readOnly={!canEditSelectedGroup}
                            />
                            <span className="integration-hint">
                                <a href="https://id.atlassian.com/manage-profile/security/api-tokens" target="_blank" rel="noopener noreferrer">
                                    → Create Jira API Token here
                                </a>
                            </span>
                        </div>

                        <div className="integration-field">
                            <label className="integration-label">Jira Project Key</label>
                            <input
                                className="integration-input"
                                type="text"
                                placeholder="e.g. SWP, FPTTEAM"
                                value={form.jiraProjectKey}
                                onChange={handleChange("jiraProjectKey")}
                                readOnly={!canEditSelectedGroup}
                            />
                            <span className="integration-hint">
                                Find in your Jira board URL: yourteam.atlassian.net/jira/software/projects/<strong>KEY</strong>/board
                            </span>
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
                            <label className="integration-label">GitHub Repository URL</label>
                            <input
                                className="integration-input"
                                type="url"
                                placeholder="https://github.com/owner/repo"
                                value={form.githubRepoUrl}
                                onChange={handleChange("githubRepoUrl")}
                                readOnly={!canEditSelectedGroup}
                            />
                            <span className="integration-hint">Copy the full URL from your GitHub repository page</span>
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
                                readOnly={!canEditSelectedGroup}
                            />
                            <span className="integration-hint">
                                <a href="https://github.com/settings/tokens?type=beta" target="_blank" rel="noopener noreferrer">
                                    → Create GitHub Token here
                                </a>
                                {" "}(Fine-grained token, select your repo, grant Contents read access)
                            </span>
                        </div>
                    </section>
                </div>
            )}

            {canEdit && (
                <div className="integration-actions">
                    <Button variant="primary" size="md" onClick={handleSave} disabled={saving || !selectedGroupId || !canEditSelectedGroup}>
                        {saving ? "Saving..." : "Save Group Config"}
                    </Button>
                </div>
            )}
        </div>
    );
}
