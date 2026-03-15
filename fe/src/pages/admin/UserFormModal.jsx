import React, { useState } from "react";
import { Modal } from "../../components/common/Modal.jsx";
import { Button } from "../../components/common/Button.jsx";

export function UserFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  defaultRole = "STUDENT",
  classes = [],
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
          class_id: initialData.class_id || "",
        }
      : {
          full_name: "",
          email: "",
          role: defaultRole,
          student_code: "",
          major: "SE",
          department: "Software Engineering",
          github_username: "",
          class_id: "",
        },
  );

  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");

  const validate = (name, value) => {
    let error = "";
    if (name === "full_name") {
      if (!value.trim()) error = "Full name is required";
      else if (value.trim().length < 2) error = "Name is too short";
    }
    if (name === "email") {
      if (!value.trim()) {
        error = "Email is required";
      } else {
        if (formData.role === "STUDENT") {
          if (!/^[a-zA-Z0-9._%+-]+@fpt\.edu\.vn$/.test(value)) {
            error = "Student email must end with @fpt.edu.vn";
          }
        } else {
          if (!/^[a-zA-Z0-9._%+-]+@fu\.edu\.vn$/.test(value)) {
            error = "Lecturer email must end with @fu.edu.vn";
          }
        }
      }
    }
    if (name === "student_code" && formData.role === "STUDENT") {
      if (!value.trim()) error = "Student code is required";
      // e.g., SE123456
      else if (!/^[A-Z]{2}\d{6}$/i.test(value)) error = "Format: SE123456";
    }
    return error;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    const error = validate(name, value);
    setErrors((prev) => ({ ...prev, [name]: error }));
    if (submitError) setSubmitError(""); // Clear general error when user types
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");
    
    // Final validation check
    const newErrors = {};
    Object.keys(formData).forEach(key => {
      const error = validate(key, formData[key]);
      if (error) newErrors[key] = error;
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setSubmitError("Please correct the errors in the form before submitting.");
      return;
    }

    try {
      await onSubmit(formData);
      onClose();
    } catch (err) {
      setSubmitError(err.message || "Failed to save user. Please check your data.");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Edit User Profile" : "Invite New User"}
    >
      <form onSubmit={handleSubmit} className="task-form">
        {submitError && (
          <div className="form-summary-error">
            <span className="error-icon">⚠️</span>
            {submitError}
          </div>
        )}
        <div className="form-group">
          <label>Full Name</label>
          <input
            name="full_name"
            type="text"
            placeholder="E.g., Nguyen Van A"
            value={formData.full_name}
            onChange={handleChange}
            className={errors.full_name ? "input-error" : ""}
            required
          />
          {errors.full_name && <span className="error-text">{errors.full_name}</span>}
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
              className={errors.email ? "input-error" : ""}
              required
            />
            {errors.email && <span className="error-text">{errors.email}</span>}
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
                  className={errors.student_code ? "input-error" : ""}
                  required
                />
                {errors.student_code && <span className="error-text">{errors.student_code}</span>}
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
            <div className="form-group">
              <label>Class</label>
              <select
                name="class_id"
                value={formData.class_id}
                onChange={handleChange}
              >
                <option value="">— No Class —</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.class_code} {c.class_name ? `- ${c.class_name}` : ""}
                  </option>
                ))}
              </select>
            </div>
          </>
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
