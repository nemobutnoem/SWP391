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
  const [formData, setFormData] = useState(() =>
    initialData
      ? {
<<<<<<< Updated upstream
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
=======
        full_name: initialData.full_name || "",
        email: initialData.email || "",
        role: initialData.student_code ? "STUDENT" : "LECTURER",
        student_code: initialData.student_code || "",
        major: initialData.major || "SE",
        department: initialData.department || "Software Engineering",
        github_username: initialData.github_username || "",
        jira_account_id: initialData.jira_account_id || "",
        class_id: initialData.class_id || "",
        status: initialData.status || "Active",
      }
      : {
        full_name: "",
        email: "",
        role: defaultRole,
        student_code: "",
        major: "SE",
        department: "Software Engineering",
        github_username: "",
        jira_account_id: "",
        class_id: "",
        status: "Active",
      },
>>>>>>> Stashed changes
  );

  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const formatName = (name) => {
    return name
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let finalValue = value;

    if (name === "student_code") {
      finalValue = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    } else if (name === "full_name") {
      // Don't format on every keystroke, maybe just trim multiple spaces
      finalValue = value.replace(/\s\s+/g, " ");
    } else if (name === "email") {
      finalValue = value.toLowerCase();
    }

    setFormData((prev) => ({ ...prev, [name]: finalValue }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateLocal = () => {
    const errors = {};
    if (!formData.email.match(/^[a-zA-Z0-9._%+-]+@(fpt\.edu\.vn|fe\.edu\.vn)$/)) {
      errors.email = "Email must be from @fpt.edu.vn or @fe.edu.vn domain";
    }
    if (formData.role === "STUDENT" && !formData.student_code.match(/^[A-Z]{2}\d{6}$/)) {
      errors.student_code = "Student code must be 2 letters followed by 6 digits (e.g., SE123456)";
    }
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});

    const localErrors = validateLocal();
    if (Object.keys(localErrors).length > 0) {
      setFieldErrors(localErrors);
      return;
    }

    setSubmitting(true);
    // Auto-format full name on submit
    const finalData = {
      ...formData,
      full_name: formatName(formData.full_name.trim()),
    };

    try {
      await onSubmit(finalData);
      onClose();
    } catch (err) {
      const data = err.response?.data;
      if (data?.details?.fields) {
        setFieldErrors(data.details.fields);
      } else if (data && typeof data === "object" && !Array.isArray(data)) {
        setFieldErrors(data);
      } else {
        alert("Error: " + (data?.message || err.message || "Something went wrong"));
      }
    } finally {
      setSubmitting(false);
    }
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
            autoComplete="off"
          />
          {fieldErrors.full_name && <span className="field-error">{fieldErrors.full_name}</span>}
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
            {fieldErrors.email && <span className="field-error">{fieldErrors.email}</span>}
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
<<<<<<< Updated upstream
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
=======
          <>
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
                {fieldErrors.student_code && <span className="field-error">{fieldErrors.student_code}</span>}
              </div>
              <div className="form-group">
                <label>Major</label>
                <select name="major" value={formData.major} onChange={handleChange}>
                  <option value="SE">Software Engineering</option>
                  <option value="AI">Artificial Intelligence</option>
                  <option value="GD">Graphic Design</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Class</label>
              <select name="class_id" value={formData.class_id} onChange={handleChange}>
                <option value="">— No Class —</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.class_code} {c.class_name ? `- ${c.class_name}` : ""}
                  </option>
                ))}
>>>>>>> Stashed changes
              </select>
            </div>
          </div>
        ) : (
          <div className="form-row">
            <div className="form-group">
              <label>Department</label>
              <select name="department" value={formData.department} onChange={handleChange}>
                <option value="Software Engineering">Software Engineering</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Business Administration">Business Administration</option>
              </select>
            </div>
            <div className="form-group">
              <label>Status</label>
              <select name="status" value={formData.status} onChange={handleChange}>
                <option value="Active">Active</option>
                <option value="Suspended">Suspended</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
        )}

        <div className="form-group">
          <label>GitHub Username {formData.role === "STUDENT" ? "" : "(Optional)"}</label>
          <input
            name="github_username"
            type="text"
            placeholder="e.g., anhnv_dev"
            value={formData.github_username}
            onChange={handleChange}
            required={formData.role === "STUDENT"}
          />
          {fieldErrors.github_username && <span className="field-error">{fieldErrors.github_username}</span>}
        </div>

        {formData.role === "STUDENT" && (
          <div className="form-group">
            <label>Jira Account ID</label>
            <input
              name="jira_account_id"
              type="text"
              placeholder="e.g., 5b10ac23..."
              value={formData.jira_account_id}
              onChange={handleChange}
              required
            />
            {fieldErrors.jira_account_id && <span className="field-error">{fieldErrors.jira_account_id}</span>}
          </div>
        )}

        <div className="form-actions">
          <Button variant="secondary" type="button" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={submitting}>
            {submitting ? "Saving..." : initialData ? "Save Changes" : "Create User"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
