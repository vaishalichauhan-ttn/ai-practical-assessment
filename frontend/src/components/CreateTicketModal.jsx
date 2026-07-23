import { useEffect, useState } from "react";
import { ApiError } from "../api/client.js";
import { createTicket } from "../api/tickets.js";

const PRIORITY_OPTIONS = ["Low", "Medium", "High", "Critical"];

const EMPTY_FORM = {
  title: "",
  description: "",
  priority: "",
};

function CreateTicketModal({ isOpen, onClose, onCreated }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleKeyDown(event) {
      if (event.key === "Escape" && !submitting) {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, submitting]);

  useEffect(() => {
    if (!isOpen) {
      setForm(EMPTY_FORM);
      setFieldErrors({});
      setFormError("");
      setSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => {
      if (!current[field]) {
        return current;
      }
      const next = { ...current };
      delete next[field];
      return next;
    });
    setFormError("");
  }

  function validateClientFields() {
    const errors = {};

    if (!form.title.trim()) {
      errors.title = "Title is required";
    }

    if (!form.description.trim()) {
      errors.description = "Description is required";
    }

    if (!form.priority) {
      errors.priority = "Priority is required";
    }

    return errors;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");

    const clientErrors = validateClientFields();
    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors);
      return;
    }

    setFieldErrors({});
    setSubmitting(true);

    try {
      const ticket = await createTicket({
        title: form.title.trim(),
        description: form.description.trim(),
        priority: form.priority,
      });
      onCreated(ticket);
      onClose();
    } catch (error) {
      if (error instanceof ApiError) {
        const nextFieldErrors = {};
        for (const detail of error.details) {
          if (detail.field && detail.field !== "body") {
            nextFieldErrors[detail.field] = detail.message;
          }
        }

        setFieldErrors(nextFieldErrors);
        setFormError(error.message || "Failed to create ticket");
      } else {
        setFormError("Failed to create ticket. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  function handleBackdropClick(event) {
    if (event.target === event.currentTarget && !submitting) {
      onClose();
    }
  }

  return (
    <div
      className="modal-backdrop"
      onClick={handleBackdropClick}
      role="presentation"
    >
      <div
        className="modal card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-ticket-title"
      >
        <div className="modal-header">
          <h2 id="create-ticket-title">Create Ticket</h2>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <p className="muted">Submit a new support request.</p>

        {formError && <p className="form-error-banner">{formError}</p>}

        <form className="ticket-form" onSubmit={handleSubmit} noValidate>
          <div className="form-field">
            <label htmlFor="modal-title">Title</label>
            <input
              id="modal-title"
              name="title"
              type="text"
              value={form.title}
              onChange={(event) => updateField("title", event.target.value)}
              aria-invalid={Boolean(fieldErrors.title)}
              aria-describedby={fieldErrors.title ? "modal-title-error" : undefined}
            />
            {fieldErrors.title && (
              <p id="modal-title-error" className="field-error">
                {fieldErrors.title}
              </p>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="modal-description">Description</label>
            <textarea
              id="modal-description"
              name="description"
              rows={5}
              value={form.description}
              onChange={(event) =>
                updateField("description", event.target.value)
              }
              aria-invalid={Boolean(fieldErrors.description)}
              aria-describedby={
                fieldErrors.description ? "modal-description-error" : undefined
              }
            />
            {fieldErrors.description && (
              <p id="modal-description-error" className="field-error">
                {fieldErrors.description}
              </p>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="modal-priority">Priority</label>
            <select
              id="modal-priority"
              name="priority"
              value={form.priority}
              onChange={(event) => updateField("priority", event.target.value)}
              aria-invalid={Boolean(fieldErrors.priority)}
              aria-describedby={
                fieldErrors.priority ? "modal-priority-error" : undefined
              }
            >
              <option value="">Select priority</option>
              {PRIORITY_OPTIONS.map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </select>
            {fieldErrors.priority && (
              <p id="modal-priority-error" className="field-error">
                {fieldErrors.priority}
              </p>
            )}
          </div>

          <div className="form-actions">
            <button type="submit" disabled={submitting}>
              {submitting ? "Creating..." : "Create Ticket"}
            </button>
            <button
              type="button"
              className="button-secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateTicketModal;
