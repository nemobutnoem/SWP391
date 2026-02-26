import React, { useState } from "react";
import { Modal } from "../../components/common/Modal.jsx";
import { Button } from "../../components/common/Button.jsx";

export function TopicFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
}) {
  // Reset state when modal opens or initialData changes
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    code: initialData?.code || "",
    description: initialData?.description || "",
    status: initialData?.status || "ACTIVE",
  });

  // Since we want the form to reset when initialData changes (e.g. switching from Edit to Create)
  // or when the modal closes, we can't just rely on the initial state of the modal isn't unmounted.
  // Actually, the parent can just use a `key` to remount the component.
  // I will update the parent to use `key={editingTopic?.id || 'new'}`

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
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Code</label>
            <input
              name="code"
              type="text"
              placeholder="E.g., AI-H-01"
              value={formData.code}
              onChange={handleChange}
              required
            />
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
        </div>

        <div className="form-actions">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit">
            {initialData ? "Save Changes" : "Create Topic"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
