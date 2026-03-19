import React, { useState } from "react";
import { Modal } from "../../components/common/Modal.jsx";
import { Button } from "../../components/common/Button.jsx";

const normalizeStudentCode = (value, email = "") => {
  const rawValue = String(value || "").trim();
  const fallback = !rawValue && email.includes("@") ? email.split("@")[0] : rawValue;
  if (!fallback) return "";
  const trimmed = fallback.length <= 8 ? fallback : fallback.slice(-8);
  return trimmed.toUpperCase();
};

export function UserFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  defaultRole = "STUDENT",
  forcedRole = null,
  classes = [],
}) {
  const resolvedRole = forcedRole || (initialData?.student_code ? "STUDENT" : initialData?.department ? "LECTURER" : defaultRole);

  const [formData, setFormData] = useState(() =>
    initialData
      ? {
          user_id: initialData.user_id || initialData.id || null,
          full_name: initialData.full_name || initialData.account || "",
          email: initialData.email || "",
          role: resolvedRole,
          student_code: resolvedRole === "STUDENT" ? normalizeStudentCode(initialData.student_code, initialData.email || "") : "",
          major: initialData.major || "SE",
          department: initialData.department || "Software Engineering",
          github_username: initialData.github_username || "",
          class_id: initialData.class_id || "",
          status: initialData.status || "Active",
        }
      : {
          user_id: null,
          full_name: "",
          email: "",
          role: resolvedRole,
          student_code: "",
          major: "SE",
          department: "Software Engineering",
          github_username: "",
          class_id: "",
          status: "Active",
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
      } else if (formData.role === "STUDENT") {
        if (!/^[a-zA-Z0-9._%+-]+@fpt\.edu\.vn$/.test(value)) {
          error = "Student email must end with @fpt.edu.vn";
        }
      } else if (!/^[a-zA-Z0-9._%+-]+@fu\.edu\.vn$/.test(value)) {
        error = "Lecturer email must end with @fu.edu.vn";
      }
    }
    if (name === "student_code" && formData.role === "STUDENT") {
      if (!value.trim()) error = "Student code is required";
      else if (!/^[A-Z]{2}\d{6}$/i.test(value)) error = "Format: SE123456";
    }
    return error;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let nextValue = value;
    let nextFormData = null;

    if (name === "student_code") {
      nextValue = normalizeStudentCode(value, formData.email);
    }

    if (name === "email" && formData.role === "STUDENT") {
      nextFormData = {
        ...formData,
        email: value,
        student_code: normalizeStudentCode(formData.student_code, value),
      };
    } else {
      nextFormData = { ...formData, [name]: nextValue };
    }

    setFormData(nextFormData);

    const error = validate(name, nextValue);
    const nextErrors = { ...errors, [name]: error };
    if (name === "email" && formData.role === "STUDENT") {
      nextErrors.student_code = validate("student_code", nextFormData.student_code);
    }
    setErrors(nextErrors);
    if (submitError) setSubmitError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");

    const payload = {
      ...formData,
      student_code: formData.role === "STUDENT" ? normalizeStudentCode(formData.student_code, formData.email) : formData.student_code,
    };

    const newErrors = {};
    Object.keys(payload).forEach((key) => {
      if (key === "user_id") return;
      const error = validate(key, payload[key]);
      if (error) newErrors[key] = error;
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setSubmitError("Please correct the errors in the form before submitting.");
      return;
    }

    try {
      await onSubmit(payload);
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
            <span className="error-icon">!</span>
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
            <select name="role" value={formData.role} onChange={handleChange} disabled={Boolean(forcedRole)}>
              <option value="STUDENT">Student</option>
              <option value="LECTURER">Lecturer</option>
            </select>
          </div>
          <div className="form-group">
            <label>Status</label>
            <select name="status" value={formData.status} onChange={handleChange}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
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
                <option value="">No Class</option>
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
            <select name="department" value={formData.department} onChange={handleChange}>
              <option value="Software Engineering">Software Engineering</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Business Administration">Business Administration</option>
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
