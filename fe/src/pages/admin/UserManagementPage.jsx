import React, { useState, useMemo } from "react";
import {
  getStudents,
  getLecturers,
  getGroups,
  getProjects,
} from "../../services/mockDb.service.js";
import { PageHeader } from "../../components/common/PageHeader.jsx";
import { Badge } from "../../components/common/Badge.jsx";
import { Button } from "../../components/common/Button.jsx";
import { UserFormModal } from "./UserFormModal.jsx";
import "./adminManagement.css";

export function UserManagementPage() {
  const [activeTab, setActiveTab] = useState("STUDENTS"); // STUDENTS or LECTURERS
  const [searchQuery, setSearchQuery] = useState("");
  const [majorFilter, setMajorFilter] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const [localStudents, setLocalStudents] = useState(() => getStudents());
  const [localLecturers, setLocalLecturers] = useState(() => getLecturers());
  const groups = useMemo(() => getGroups(), []);
  const projects = useMemo(() => getProjects(), []);

  const handleOpenCreate = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleSubmit = (formData) => {
    if (formData.role === "STUDENT") {
      if (editingUser) {
        setLocalStudents((prev) =>
          prev.map((s) =>
            s.id === editingUser.id ? { ...formData, id: s.id } : s,
          ),
        );
      } else {
        setLocalStudents((prev) => [{ ...formData, id: Date.now() }, ...prev]);
      }
    } else {
      if (editingUser) {
        setLocalLecturers((prev) =>
          prev.map((l) =>
            l.id === editingUser.id ? { ...formData, id: l.id } : l,
          ),
        );
      } else {
        setLocalLecturers((prev) => [{ ...formData, id: Date.now() }, ...prev]);
      }
    }
    setIsModalOpen(false);
    alert(
      `Successfully ${editingUser ? "updated" : "created"} user: ${formData.full_name}`,
    );
  };

  // Enrich data
  const enrichedStudents = useMemo(() => {
    return localStudents.map((s) => {
      const group =
        groups.find((g) => g.id === s.group_id) ||
        groups.find((g) => g.leader_student_id === s.id);
      const project = group
        ? projects.find((p) => p.id === group.project_id)
        : null;
      return {
        ...s,
        group_name: group?.group_name || "Unassigned",
        project_name: project?.project_name || "No Project",
      };
    });
  }, [localStudents, groups, projects]);

  const filteredData = useMemo(() => {
    const data = activeTab === "STUDENTS" ? enrichedStudents : localLecturers;
    return data.filter((u) => {
      const nameMatch = u.full_name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const codeMatch =
        u.student_code &&
        u.student_code.toLowerCase().includes(searchQuery.toLowerCase());
      const majorMatch = majorFilter === "ALL" || u.major === majorFilter;
      return (nameMatch || codeMatch) && majorMatch;
    });
  }, [activeTab, enrichedStudents, localLecturers, searchQuery, majorFilter]);

  const handleDelete = (user) => {
    if (window.confirm(`Are you sure you want to delete ${user.full_name}?`)) {
      if (activeTab === "STUDENTS") {
        setLocalStudents((prev) => prev.filter((s) => s.id !== user.id));
      } else {
        setLocalLecturers((prev) => prev.filter((l) => l.id !== user.id));
      }
      alert("User deleted successfully.");
    }
  };

  return (
    <div className="user-mgmt-page">
      <PageHeader
        title="User Management"
        description="Comprehensive management of students and lecturers. Monitor group assignments and project status."
        actions={
          <Button variant="primary" size="sm" onClick={handleOpenCreate}>
            Add {activeTab === "STUDENTS" ? "Student" : "Lecturer"}
          </Button>
        }
      />

      <UserFormModal
        key={editingUser ? `edit-${editingUser.id}` : "create"}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        initialData={editingUser}
        defaultRole={activeTab === "STUDENTS" ? "STUDENT" : "LECTURER"}
      />

      <div className="admin-tabs">
        <div
          className={`tab-item ${
            activeTab === "STUDENTS" ? "tab-item--active" : ""
          }`}
          onClick={() => {
            setActiveTab("STUDENTS");
            setMajorFilter("ALL");
          }}
        >
          Students ({localStudents.length})
        </div>
        <div
          className={`tab-item ${
            activeTab === "LECTURERS" ? "tab-item--active" : ""
          }`}
          onClick={() => {
            setActiveTab("LECTURERS");
            setMajorFilter("ALL");
          }}
        >
          Lecturers ({localLecturers.length})
        </div>
      </div>

      <div className="filter-bar">
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder={`Search ${activeTab.toLowerCase()} by name or code...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="filter-controls">
          {activeTab === "STUDENTS" && (
            <select
              className="filter-select"
              value={majorFilter}
              onChange={(e) => setMajorFilter(e.target.value)}
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
                    <Badge variant="info" size="sm">
                      2 Groups
                    </Badge>
                  )}
                </td>
                <td>
                  <Badge variant="success" size="sm">
                    Active
                  </Badge>
                </td>
                <td className="action-cell">
                  <div className="action-buttons">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEdit(u)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(u)}
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
