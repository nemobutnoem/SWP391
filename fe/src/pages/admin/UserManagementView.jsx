import React from "react";
import { PageHeader } from "../../components/common/PageHeader.jsx";
import { Badge } from "../../components/common/Badge.jsx";
import { Button } from "../../components/common/Button.jsx";
import { UserFormModal } from "./UserFormModal.jsx";
import "./adminManagement.css";

/**
 * Presentation layer – nhận tất cả data và handler qua props.
 * Không có state, không gọi service.
 */
export function UserManagementView({
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  majorFilter,
  onMajorFilterChange,
  filteredData,
  isModalOpen,
  editingUser,
  onOpenCreate,
  onOpenEdit,
  onCloseModal,
  onSubmit,
  onDelete,
  studentCount,
  lecturerCount,
}) {
  return (
    <div className="user-mgmt-page">
      <PageHeader
        title="User Management"
        description="Comprehensive management of students and lecturers. Monitor group assignments and project status."
        actions={
          <Button variant="primary" size="sm" onClick={onOpenCreate}>
            Add {activeTab === "STUDENTS" ? "Student" : "Lecturer"}
          </Button>
        }
      />

      <UserFormModal
        key={editingUser ? `edit-${editingUser.id}` : "create"}
        isOpen={isModalOpen}
        onClose={onCloseModal}
        onSubmit={onSubmit}
        initialData={editingUser}
        defaultRole={activeTab === "STUDENTS" ? "STUDENT" : "LECTURER"}
      />

      <div className="admin-tabs">
        <div
          className={`tab-item ${activeTab === "STUDENTS" ? "tab-item--active" : ""}`}
          onClick={() => onTabChange("STUDENTS")}
        >
          Students ({studentCount})
        </div>
        <div
          className={`tab-item ${activeTab === "LECTURERS" ? "tab-item--active" : ""}`}
          onClick={() => onTabChange("LECTURERS")}
        >
          Lecturers ({lecturerCount})
        </div>
      </div>

      <div className="filter-bar">
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder={`Search ${activeTab.toLowerCase()} by name or code...`}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <div className="filter-controls">
          {activeTab === "STUDENTS" && (
            <select
              className="filter-select"
              value={majorFilter}
              onChange={(e) => onMajorFilterChange(e.target.value)}
            >
              <option value="ALL">All Majors</option>
              <option value="SE">Software Engineering</option>
              <option value="AI">Artificial Intelligence</option>
              <option value="GD">Graphic Design</option>
            </select>
          )}
          <select className="filter-select">
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
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
            {filteredData.map((u) => (
              <tr key={u.id}>
                <td>
                  <div className="user-profile-cell">
                    <div className="avatar-small">{u.full_name[0]}</div>
                    <div className="profile-info">
                      <span className="profile-name">{u.full_name}</span>
                      <span className="profile-email">
                        {u.email || `@${u.github_username}`}
                      </span>
                    </div>
                  </div>
                </td>
                <td>
                  {activeTab === "STUDENTS" ? (
                    <code className="code-badge">{u.student_code}</code>
                  ) : (
                    <span className="text-secondary">{u.department}</span>
                  )}
                </td>
                <td>
                  {activeTab === "STUDENTS" ? (
                    <div className="group-project-cell">
                      <span className="group-name">{u.group_name}</span>
                      <div className="group-meta">{u.project_name}</div>
                    </div>
                  ) : (
                    <Badge variant="info" size="sm">2 Groups</Badge>
                  )}
                </td>
                <td>
                  <Badge variant="success" size="sm">Active</Badge>
                </td>
                <td className="action-cell">
                  <div className="action-buttons">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onOpenEdit(u)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(u)}
                      className="btn--danger-ghost"
                    >
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
