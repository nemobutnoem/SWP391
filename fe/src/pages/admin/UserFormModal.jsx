import React, { useState } from "react";
import { Modal } from "../../components/common/Modal.jsx";
import { Button } from "../../components/common/Button.jsx";

export function UserFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  defaultRole = "STUDENT",
}) {
  // Parent truyền `key` để remount khi initialData thay đổi,
  // nên lazy init chạy fresh mỗi lần mở modal – không cần useEffect.
  const [formData, setFormData] = useState(() =>
    initialData
      ? {
          full_name: initialData.full_name || "",
          email: initialData.email || "",
          role: initialData.student_code ? "STUDENT" : "LECTURER",
          student_code: initialData.student_code || "",
          major: initialData.major || "SE",
          department: initialData.department || "Software Engineering",
          github_username: initialData.github_username || "",
        }
      : {
          full_name: "",
          email: "",
          role: defaultRole,
          student_code: "",
          major: "SE",
          department: "Software Engineering",
          github_username: "",
        },
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Edit User Profile" : "Invite New User"}
    >
      <form onSubmit={handleSubmit} className="task-form">
        <div className="form-group">
          <label>Full Name</label>
          <input
            name="full_name"
            type="text"
            placeholder="E.g., Nguyen Van A"
            value={formData.full_name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Email Address</label>
            <input
              name="email"
              type="email"
              placeholder="user@fpt.edu.vn"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>System Role</label>
            <select name="role" value={formData.role} onChange={handleChange}>
              <option value="STUDENT">Student</option>
              <option value="LECTURER">Lecturer</option>
            </select>
          </div>
        </div>

        {formData.role === "STUDENT" ? (
          <div className="form-row">
            <div className="form-group">
              <label>Student Code</label>
              <input
                name="student_code"
                type="text"
                placeholder="SE123456"
                value={formData.student_code}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Major</label>
              <select
                name="major"
                value={formData.major}
                onChange={handleChange}
              >
                <option value="SE">Software Engineering</option>
                <option value="AI">Artificial Intelligence</option>
                <option value="GD">Graphic Design</option>
              </select>
            </div>
          </div>
        ) : (
          <div className="form-group">
            <label>Department</label>
            <select
              name="department"
              value={formData.department}
              onChange={handleChange}
            >
              <option value="Software Engineering">Software Engineering</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Business Administration">
                Business Administration
              </option>
            </select>
          </div>
        )}

        <div className="form-group">
          <label>GitHub Username (Optional)</label>
          <input
            name="github_username"
            type="text"
            placeholder="e.g., anhnv_dev"
            value={formData.github_username}
            onChange={handleChange}
          />
        </div>

        <div className="form-actions">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit">
            {initialData ? "Save Changes" : "Create User"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
