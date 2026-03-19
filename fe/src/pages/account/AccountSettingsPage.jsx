import React, { useEffect, useMemo, useState } from "react";
import { PageHeader } from "../../components/common/PageHeader.jsx";
import { Button } from "../../components/common/Button.jsx";
import { useAuth } from "../../store/auth/useAuth.jsx";
import { ROLES } from "../../routes/access/roles.js";
import { lecturerService } from "../../services/lecturers/lecturer.service.js";
import { studentService } from "../../services/students/student.service.js";
import { groupService } from "../../services/groups/group.service.js";
import "./accountSettings.css";

function readValue(obj, ...keys) {
  for (const key of keys) {
    const value = obj?.[key];
    if (value !== undefined && value !== null) return value;
  }
  return "";
}

function roleDescription(role) {
  switch (role) {
    case ROLES.ADMIN:
      return "System-wide access and management privileges.";
    case ROLES.LECTURER:
      return "Supervises classes, groups, and academic progress.";
    case ROLES.TEAM_LEAD:
      return "Coordinates the team and manages shared tasks.";
    case ROLES.TEAM_MEMBER:
      return "Works on assigned tasks and updates daily progress.";
    default:
      return "Signed-in account";
  }
}

function normalizeTeamPosition(rawRoleInGroup) {
  const value = String(rawRoleInGroup || "").trim().toUpperCase();
  if (value === "LEADER") return "Team Lead";
  if (value === "MEMBER") return "Team Member";
  return "User";
}

export function AccountSettingsPage() {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [profileType, setProfileType] = useState("account");
  const [profileRecordId, setProfileRecordId] = useState(null);
  const [teamPosition, setTeamPosition] = useState("User");
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    department: "",
    studentCode: "",
    major: "",
  });

  const isLecturer = user?.role === ROLES.LECTURER;
  const isStudentRole =
    user?.role === ROLES.TEAM_MEMBER || user?.role === ROLES.TEAM_LEAD;
  const canSave = isLecturer && profileRecordId != null;

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      setLoading(true);
      setMessage(null);
      try {
        if (isLecturer) {
          const lecturers = await lecturerService.list();
          const matched = (Array.isArray(lecturers) ? lecturers : []).find(
            (item) => Number(readValue(item, "user_id", "userId")) === Number(user?.id),
          );
          if (!mounted) return;
          setProfileType("lecturer");
          setProfileRecordId(readValue(matched, "id") || null);
          setForm({
            fullName: readValue(matched, "full_name", "fullName", "name") || user?.name || "",
            email: readValue(matched, "email"),
            department: readValue(matched, "department"),
            studentCode: "",
            major: "",
          });
          setTeamPosition("User");
          return;
        }

        if (isStudentRole) {
          const students = await studentService.list();
          const matched = (Array.isArray(students) ? students : []).find(
            (item) => Number(readValue(item, "user_id", "userId")) === Number(user?.id),
          );
          if (!mounted) return;
          setProfileType("student");
          setProfileRecordId(readValue(matched, "id") || null);
          setForm({
            fullName: readValue(matched, "full_name", "fullName", "name") || user?.name || "",
            email: readValue(matched, "email"),
            department: "",
            studentCode: readValue(matched, "student_code", "studentCode"),
            major: readValue(matched, "major"),
          });

          const studentId = Number(readValue(matched, "id"));
          if (Number.isFinite(studentId)) {
            const members = await groupService.listMembers();
            const myMemberships = (Array.isArray(members) ? members : []).filter(
              (item) => Number(readValue(item, "student_id", "studentId")) === studentId,
            );
            const teamRoleInGroup = myMemberships.find(
              (item) => String(readValue(item, "role_in_group", "roleInGroup")).trim().toUpperCase() === "LEADER",
            )
              ? "LEADER"
              : readValue(myMemberships[0], "role_in_group", "roleInGroup");
            setTeamPosition(normalizeTeamPosition(teamRoleInGroup));
          } else {
            setTeamPosition("User");
          }
          return;
        }

        setProfileType("account");
        setProfileRecordId(null);
        setTeamPosition("User");
        setForm({
          fullName: user?.name || "",
          email: "",
          department: "",
          studentCode: "",
          major: "",
        });
      } catch (error) {
        if (!mounted) return;
        setMessage({
          type: "error",
          text: error?.response?.data?.message || error?.message || "Failed to load account settings.",
        });
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadProfile();
    return () => {
      mounted = false;
    };
  }, [isLecturer, isStudentRole, user?.id, user?.name]);

  const summaryItems = useMemo(
    () => [
      { label: "Role", value: user?.role || "Unknown" },
      { label: "Team Position", value: teamPosition },
      { label: "User ID", value: user?.id || "-" },
      { label: "Profile Type", value: profileType },
    ],
    [profileType, teamPosition, user?.id, user?.role],
  );

  const handleChange = (field) => (event) => {
    const value = event.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
    setMessage(null);
  };

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    setMessage(null);
    try {
      await lecturerService.update(profileRecordId, {
        full_name: form.fullName.trim(),
        email: form.email.trim(),
        department: form.department.trim(),
        github_username: null,
        status: "Active",
      });

      updateUser?.({ name: form.fullName.trim() });
      setMessage({ type: "success", text: "Account settings updated." });
    } catch (error) {
      setMessage({
        type: "error",
        text: error?.response?.data?.message || error?.message || "Failed to save account settings.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="account-settings-page">
      <PageHeader
        title="Account Settings"
        description="Review your profile information and manage the details shown in your workspace."
      />

      <div className="account-settings-shell">
        <aside className="account-settings-sidebar">
          <div className="account-profile-card">
            <div className="account-profile-card__avatar">
              {String(form.fullName || user?.name || "U")
                .trim()
                .slice(0, 1)
                .toUpperCase()}
            </div>
            <div className="account-profile-card__body">
              <h2>{form.fullName || user?.name || "Member"}</h2>
              <p>{roleDescription(user?.role)}</p>
            </div>
          </div>

          <div className="account-summary-card">
            {summaryItems.map((item) => (
              <div key={item.label} className="account-summary-row">
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </aside>

        <section className="account-settings-main">
          {message && (
            <div className={`account-message account-message--${message.type}`}>
              {message.text}
            </div>
          )}

          <div className="account-panel">
            <div className="account-panel__header">
              <div>
                <h3>Profile Details</h3>
                <p>
                  {canSave
                    ? "Keep your lecturer profile up to date."
                    : "Your current profile information is shown below."}
                </p>
              </div>
            </div>

            {loading ? (
              <div className="account-loading">Loading account details...</div>
            ) : (
              <div className="account-form-grid">
                <label className="account-field">
                  <span>Full Name</span>
                  <input
                    value={form.fullName}
                    onChange={handleChange("fullName")}
                    readOnly={!canSave}
                    placeholder="Full name"
                  />
                </label>

                <label className="account-field">
                  <span>Email</span>
                  <input
                    value={form.email}
                    onChange={handleChange("email")}
                    readOnly={!canSave}
                    placeholder="Email address"
                  />
                </label>

                {profileType === "lecturer" && (
                  <label className="account-field">
                    <span>Department</span>
                    <input
                      value={form.department}
                      onChange={handleChange("department")}
                      readOnly={!canSave}
                      placeholder="Department"
                    />
                  </label>
                )}

                {profileType === "student" && (
                  <>
                    <label className="account-field">
                      <span>Student Code</span>
                      <input value={form.studentCode} readOnly placeholder="Student code" />
                    </label>

                    <label className="account-field">
                      <span>Major</span>
                      <input value={form.major} readOnly placeholder="Major" />
                    </label>
                  </>
                )}
              </div>
            )}

            {canSave && (
              <div className="account-actions">
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            )}
          </div>

          <div className="account-panel account-panel--soft">
            <div className="account-panel__header">
              <div>
                <h3>Access Notes</h3>
                <p>What you can manage from this page right now.</p>
              </div>
            </div>

            <ul className="account-notes">
              <li>Lecturer accounts can update their own profile details here.</li>
              <li>Student accounts are currently shown as read-only in this build.</li>
              <li>Admin accounts use system-managed profile data and do not have a personal record form yet.</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
