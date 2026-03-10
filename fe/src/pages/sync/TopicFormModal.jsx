import React, { useState } from "react";
import { Modal } from "../../components/common/Modal.jsx";
import { Button } from "../../components/common/Button.jsx";

export function TopicFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
}) {
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    code: initialData?.code || "",
    description: initialData?.description || "",
    status: initialData?.status || "ACTIVE",
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Force uppercase for code field
    const finalValue = name === "code" ? value.toUpperCase() : value;
    setFormData((prev) => ({ ...prev, [name]: finalValue }));
    // Clear error on edit
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});
    setSubmitting(true);
    try {
      await onSubmit(formData);
      // Chỉ đóng modal khi API thành công
      onClose();
    } catch (err) {
      const data = err.response?.data;
      if (data?.details?.fields) {
        // Handle standard project ApiError format
        setFieldErrors(data.details.fields);
      } else if (data && typeof data === "object" && !Array.isArray(data)) {
        // Lỗi field-level (400 validation hoặc 409 duplicate) trực tiếp
        setFieldErrors(data);
      } else {
        // Lỗi khác: mạng, 500, v.v.
        const msg =
          typeof data === "string"
            ? data
            : err.message || "An unexpected error occurred. Please try again.";
        alert("Error: " + msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Edit Project Topic" : "Create New Topic"}
    >
      <form onSubmit={handleSubmit} className="task-form">
        <div className="form-group">
          <label>Topic Name</label>
          <input
            name="name"
            type="text"
            placeholder="E.g., AI-Powered Health Tracker"
            value={formData.name}
            onChange={handleChange}
            required
          />
          {fieldErrors.name && (
            <span className="field-error">{fieldErrors.name}</span>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Code</label>
            <input
              name="code"
              type="text"
              placeholder="E.g., SE1234 | AI-H-01 | SWP-2025-001"
              value={formData.code}
              onChange={handleChange}
              required
            />
            {fieldErrors.code ? (
              <span className="field-error">{fieldErrors.code}</span>
            ) : (
              <span className="field-hint">
                Uppercase letters &amp; digits, separated by hyphens (auto-uppercased)
              </span>
            )}
          </div>
          <div className="form-group">
            <label>Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea
            name="description"
            placeholder="Briefly describe the topic requirements..."
            value={formData.description}
            onChange={handleChange}
            rows={4}
            style={{
              padding: "0.75rem 1rem",
              border: "1px solid var(--slate-200)",
              borderRadius: "var(--radius-md)",
              fontSize: "0.875rem",
              fontFamily: "inherit",
              resize: "none",
            }}
          />
          {fieldErrors.description && (
            <span className="field-error">{fieldErrors.description}</span>
          )}
        </div>

        <div className="form-actions">
          <Button variant="secondary" type="button" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={submitting}>
            {submitting
              ? "Saving..."
              : initialData
                ? "Save Changes"
                : "Create Topic"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
