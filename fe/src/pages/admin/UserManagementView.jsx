import React from "react";
import { PageHeader } from "../../components/common/PageHeader.jsx";
import { Badge } from "../../components/common/Badge.jsx";
import { Button } from "../../components/common/Button.jsx";
import { UserFormModal } from "./UserFormModal.jsx";
import "./adminManagement.css";

export function UserManagementView({
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  majorFilter,
  onMajorFilterChange,
  statusFilter,
  onStatusFilterChange,
  semesterFilter,
  onSemesterFilterChange,
  blockFilter,
  onBlockFilterChange,
  filteredData,
  isModalOpen,
  editingUser,
  modalRole,
  onOpenCreate,
  onOpenEdit,
  onCloseModal,
  onSubmit,
  onDelete,
  studentCount,
  lecturerCount,
  classes,
  semesters,
  isCrudLocked,
  studentClassHistory,
  studentClassHistoryLoading,
}) {
  const semesterOptions = Array.isArray(semesters) ? [...semesters] : [];
  semesterOptions.sort((a, b) => Number(b?.id ?? 0) - Number(a?.id ?? 0));

  const getSemesterStatus = (semesterId) => {
    const sem = (Array.isArray(semesters) ? semesters : []).find((s) => String(s?.id) === String(semesterId));
    return String(sem?.status ?? "").toUpperCase();
  };

  const getClassType = (cls) => String(cls?.class_type ?? cls?.classType ?? "MAIN").toUpperCase();

  const classesForModal = (() => {
    const allClasses = Array.isArray(classes) ? classes : [];
    if (activeTab !== "STUDENTS") return allClasses;

    const sems = Array.isArray(semesters) ? semesters : [];
    const activeSemester = sems.find((s) => String(s?.status ?? "").toUpperCase() === "ACTIVE") || null;

    const selectedSemester = semesterFilter !== "ALL"
      ? (sems.find((s) => String(s?.id) === String(semesterFilter)) || null)
      : null;

    const currentSemester = selectedSemester || activeSemester;
    const currentSemesterId = currentSemester?.id ?? null;
    const currentStart = String(currentSemester?.start_date ?? "");

    const upcomingSemesters = sems
      .filter((s) => String(s?.status ?? "").toUpperCase() === "UPCOMING")
      .sort((a, b) => {
        const cmp = String(a?.start_date ?? "").localeCompare(String(b?.start_date ?? ""));
        if (cmp !== 0) return cmp;
        return Number(a?.id ?? 0) - Number(b?.id ?? 0);
      });
    const nextSemester = currentStart
      ? (upcomingSemesters.find((s) => String(s?.start_date ?? "") > currentStart) || upcomingSemesters[0] || null)
      : (upcomingSemesters[0] || null);
    const nextUpcomingSemesterId = nextSemester?.id ?? null;

    const byCode = (a, b) => String(a?.class_code ?? a?.classCode ?? "").localeCompare(String(b?.class_code ?? b?.classCode ?? ""));
    const semIdOf = (c) => c?.semester_id ?? c?.semesterId;

    // Exactly as requested: prioritize 3w of current semester, then 10w of next semester.
    const capstoneCurrent = currentSemesterId == null
      ? []
      : allClasses
          .filter((c) => String(semIdOf(c)) === String(currentSemesterId) && getClassType(c) === "CAPSTONE")
          .sort(byCode);

    const mainNext = nextUpcomingSemesterId == null
      ? []
      : allClasses
          .filter((c) => String(semIdOf(c)) === String(nextUpcomingSemesterId) && getClassType(c) === "MAIN")
          .sort(byCode);

    return [...capstoneCurrent, ...mainNext];
  })();

  return (
    <div className="user-mgmt-page">
      <PageHeader
        title="User Management"
        description="Comprehensive management of students and lecturers in the system."
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={onOpenCreate}
            disabled={Boolean(isCrudLocked) && activeTab === "STUDENTS"}
            title={Boolean(isCrudLocked) && activeTab === "STUDENTS" ? "Completed semester is view-only" : undefined}
          >
            Add {activeTab === "STUDENTS" ? "Student" : "Lecturer"}
          </Button>
        }
      />

      <UserFormModal
        key={editingUser ? `edit-${editingUser.id}-${modalRole}` : `create-${modalRole}`}
        isOpen={isModalOpen}
        onClose={onCloseModal}
        onSubmit={onSubmit}
        initialData={editingUser}
        defaultRole={modalRole}
        classes={classesForModal}
        classHistory={studentClassHistory}
        classHistoryLoading={studentClassHistoryLoading}
      />

      <div className="admin-tabs">
        <div className={`tab-item ${activeTab === "STUDENTS" ? "tab-item--active" : ""}`} onClick={() => onTabChange("STUDENTS")}>
          Students ({studentCount})
        </div>
        <div className={`tab-item ${activeTab === "LECTURERS" ? "tab-item--active" : ""}`} onClick={() => onTabChange("LECTURERS")}>
          Lecturers ({lecturerCount})
        </div>
      </div>

      <div className="filter-bar">
        <div className="search-input-wrapper">
          <span className="search-icon" aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M10.68 11.74a6 6 0 1 1 1.06-1.06l3.29 3.29a.75.75 0 1 1-1.06 1.06l-3.29-3.29ZM11.5 7a4.5 4.5 0 1 0-9 0 4.5 4.5 0 0 0 9 0Z" />
            </svg>
          </span>
          <input
            type="text"
            placeholder={`Search ${activeTab.toLowerCase()} by name or code...`}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <div className="filter-controls">
          {activeTab === "STUDENTS" && (
            <>
              <select className="filter-select" value={majorFilter} onChange={(e) => onMajorFilterChange(e.target.value)}>
                <option value="ALL">All Majors</option>
                <option value="SE">Software Engineering</option>
                <option value="AI">Artificial Intelligence</option>
                <option value="GD">Graphic Design</option>
              </select>

              <select className="filter-select" value={semesterFilter} onChange={(e) => onSemesterFilterChange(e.target.value)}>
                <option value="ALL">All Semesters</option>
                {semesterOptions.map((sem) => (
                  <option key={sem.id} value={String(sem.id)}>
                    {sem.name || `Semester ${sem.id}`}
                  </option>
                ))}
              </select>

              <select className="filter-select" value={blockFilter} onChange={(e) => onBlockFilterChange(e.target.value)}>
                <option value="ALL">All Blocks</option>
                <option value="MAIN">10 weeks (Main)</option>
                <option value="CAPSTONE">3 weeks (Capstone)</option>
              </select>
            </>
          )}
          <select className="filter-select" value={statusFilter} onChange={(e) => onStatusFilterChange(e.target.value)}>
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </div>

      <div className="table-container">
        <table className="admin-table">
          <thead>
            {activeTab === "STUDENTS" ? (
              <tr>
                <th>Student Info</th>
                <th>Mssv</th>
                <th>Class / Semester</th>
                <th>Group / Project</th>
                <th>Status</th>
                <th className="action-cell">Actions</th>
              </tr>
            ) : (
              <tr>
                <th>Lecturer Info</th>
                <th>Department</th>
                <th>Managed Groups</th>
                <th>Status</th>
                <th className="action-cell">Actions</th>
              </tr>
            )}
          </thead>
          <tbody>
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={activeTab === "STUDENTS" ? 6 : 5} className="text-secondary" style={{ padding: "1.25rem" }}>
                  No records found.
                </td>
              </tr>
            ) : filteredData.map((u) => (
              <tr key={`${activeTab}-${u.id}`}>
                <td>
                  <div className="user-profile-cell">
                    <div className="avatar-small">{(u.full_name || u.account || "U")[0]}</div>
                    <div className="profile-info">
                      <span className="profile-name">{u.full_name || u.account}</span>
                      <span className="profile-email">{u.email || (u.github_username ? `@${u.github_username}` : "No email")}</span>
                    </div>
                  </div>
                </td>

                {activeTab === "STUDENTS" ? (
                  <>
                    <td><code className="code-badge">{u.student_code}</code></td>
                    <td>
                      <div className="class-semester-cell">
                        <span className="font-semibold">{u.class_name}</span>
                        <div className="text-xs text-secondary mt-1">{u.semester_name}</div>
                      </div>
                    </td>
                    <td>
                      <div className="group-project-cell">
                        <span className="group-name">{u.group_name}</span>
                        <div className="group-meta">{u.project_name}</div>
                      </div>
                    </td>
                    <td>
                      <Badge variant={String(u.status || "").toLowerCase() === "active" ? "success" : "warning"} size="sm">
                        {u.status || "Unknown"}
                      </Badge>
                    </td>
                    <td className="action-cell">
                      <div className="action-buttons">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onOpenEdit(u)}
                          disabled={Boolean(isCrudLocked)}
                          title={Boolean(isCrudLocked) ? "Completed semester is view-only" : undefined}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(u)}
                          className="btn--danger-ghost"
                          disabled={Boolean(isCrudLocked)}
                          title={Boolean(isCrudLocked) ? "Completed semester is view-only" : undefined}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td><span className="text-secondary">{u.department}</span></td>
                    <td>
                      <Badge variant="info" size="sm">
                        {u.managed_group_count || 0} Group{(u.managed_group_count || 0) !== 1 ? "s" : ""}
                      </Badge>
                    </td>
                    <td>
                      <Badge variant={String(u.status || "").toLowerCase() === "active" ? "success" : "warning"} size="sm">
                        {u.status || "Unknown"}
                      </Badge>
                    </td>
                    <td className="action-cell">
                      <div className="action-buttons">
                        <Button variant="ghost" size="sm" onClick={() => onOpenEdit(u)}>Edit</Button>
                        <Button variant="ghost" size="sm" onClick={() => onDelete(u)} className="btn--danger-ghost">Delete</Button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
