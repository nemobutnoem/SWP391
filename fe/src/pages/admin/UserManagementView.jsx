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
}) {
  return (
    <div className="user-mgmt-page">
      <PageHeader
        title="User Management"
        description="Comprehensive management of students and lecturers in the system."
        actions={
          <Button variant="primary" size="sm" onClick={onOpenCreate}>
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
        classes={classes || []}
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
            <select className="filter-select" value={majorFilter} onChange={(e) => onMajorFilterChange(e.target.value)}>
              <option value="ALL">All Majors</option>
              <option value="SE">Software Engineering</option>
              <option value="AI">Artificial Intelligence</option>
              <option value="GD">Graphic Design</option>
            </select>
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
                <td colSpan={6} className="text-secondary" style={{ padding: "1.25rem" }}>
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
                      <span className="profile-email">{u.email || `@${u.github_username}`}</span>
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
                        <Button variant="ghost" size="sm" onClick={() => onOpenEdit(u)}>Edit</Button>
                        <Button variant="ghost" size="sm" onClick={() => onDelete(u)} className="btn--danger-ghost">Delete</Button>
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
