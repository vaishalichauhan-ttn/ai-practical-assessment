import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ApiError } from "../api/client.js";
import { getTicket, updateTicket } from "../api/tickets.js";
import { listUsers } from "../api/users.js";
import { PRIORITY_OPTIONS } from "../constants/ticket.js";
import { formatDate } from "../utils/formatDate.js";

const UNASSIGNED_VALUE = "";

function toFormState(ticket) {
  return {
    title: ticket.title,
    description: ticket.description,
    priority: ticket.priority,
    assignedTo: ticket.assignedTo?.id ?? UNASSIGNED_VALUE,
  };
}

function TicketDetailPage() {
  const { id } = useParams();
  const [ticket, setTicket] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadTicket() {
      setLoading(true);
      setError("");
      setTicket(null);
      setIsEditing(false);
      setForm(null);
      setFieldErrors({});
      setFormError("");
      setUsers([]);
      setUsersError("");

      try {
        const ticketData = await getTicket(id);
        if (!cancelled) {
          setTicket(ticketData);
        }
      } catch (err) {
        if (!cancelled) {
          if (err instanceof ApiError && err.status === 404) {
            setError("Ticket not found.");
          } else {
            setError(err.message || "Failed to load ticket.");
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadTicket();

    return () => {
      cancelled = true;
    };
  }, [id]);

  async function loadUsers() {
    if (users.length > 0 || usersLoading) {
      return;
    }

    setUsersLoading(true);
    setUsersError("");

    try {
      const usersData = await listUsers();
      setUsers(usersData);
    } catch (err) {
      setUsersError(
        err instanceof ApiError
          ? err.message || "Failed to load assignees."
          : "Failed to load assignees. Please try again."
      );
    } finally {
      setUsersLoading(false);
    }
  }

  async function startEditing() {
    if (!ticket) {
      return;
    }

    setForm(toFormState(ticket));
    setFieldErrors({});
    setFormError("");
    setUsersError("");
    setIsEditing(true);
    await loadUsers();
  }

  function cancelEditing() {
    setIsEditing(false);
    setForm(null);
    setFieldErrors({});
    setFormError("");
    setUsersError("");
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

    return errors;
  }

  async function handleSave(event) {
    event.preventDefault();
    setFormError("");

    const clientErrors = validateClientFields();
    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors);
      return;
    }

    setFieldErrors({});
    setSubmitting(true);

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      priority: form.priority,
      assignedTo:
        form.assignedTo === UNASSIGNED_VALUE ? null : form.assignedTo,
    };

    try {
      const updated = await updateTicket(id, payload);
      setTicket((current) => ({
        ...current,
        ...updated,
        comments: current.comments,
      }));
      setIsEditing(false);
      setForm(null);
    } catch (err) {
      if (err instanceof ApiError) {
        const nextFieldErrors = {};
        for (const detail of err.details) {
          if (detail.field && detail.field !== "body") {
            nextFieldErrors[detail.field] = detail.message;
          }
        }

        setFieldErrors(nextFieldErrors);
        setFormError(err.message || "Failed to update ticket");
      } else {
        setFormError("Failed to update ticket. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="card">
      <div className="page-header">
        <div>
          <p className="breadcrumb">
            <Link to="/tickets">Tickets</Link>
          </p>
          <h2>Ticket Details</h2>
        </div>
        {ticket && !isEditing && (
          <button type="button" onClick={startEditing}>
            Edit Ticket
          </button>
        )}
      </div>

      {loading && <p className="muted">Loading ticket...</p>}

      {!loading && error && (
        <div className="empty-state">
          <p className="status-error">{error}</p>
          <p>
            <Link to="/tickets">Back to tickets</Link>
          </p>
        </div>
      )}

      {!loading && ticket && !isEditing && (
        <>
          <h3 className="ticket-detail-title">{ticket.title}</h3>

          <dl className="ticket-summary ticket-detail-summary">
            <div>
              <dt>Description</dt>
              <dd>{ticket.description}</dd>
            </div>
            <div>
              <dt>Priority</dt>
              <dd>{ticket.priority}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{ticket.status}</dd>
            </div>
            <div>
              <dt>Assignee</dt>
              <dd>{ticket.assignedTo?.name ?? "Unassigned"}</dd>
            </div>
            <div>
              <dt>Created By</dt>
              <dd>{ticket.createdBy.name}</dd>
            </div>
            <div>
              <dt>Created</dt>
              <dd>{formatDate(ticket.createdAt)}</dd>
            </div>
            <div>
              <dt>Updated</dt>
              <dd>{formatDate(ticket.updatedAt)}</dd>
            </div>
          </dl>
        </>
      )}

      {!loading && ticket && isEditing && form && (
        <>
          <h3 className="ticket-detail-title">Edit Ticket</h3>

          {formError && <p className="form-error-banner">{formError}</p>}

          <form className="ticket-form" onSubmit={handleSave} noValidate>
            <div className="form-field">
              <label htmlFor="edit-title">Title</label>
              <input
                id="edit-title"
                name="title"
                type="text"
                value={form.title}
                onChange={(event) => updateField("title", event.target.value)}
                aria-invalid={Boolean(fieldErrors.title)}
                aria-describedby={
                  fieldErrors.title ? "edit-title-error" : undefined
                }
              />
              {fieldErrors.title && (
                <p id="edit-title-error" className="field-error">
                  {fieldErrors.title}
                </p>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="edit-description">Description</label>
              <textarea
                id="edit-description"
                name="description"
                rows={5}
                value={form.description}
                onChange={(event) =>
                  updateField("description", event.target.value)
                }
                aria-invalid={Boolean(fieldErrors.description)}
                aria-describedby={
                  fieldErrors.description ? "edit-description-error" : undefined
                }
              />
              {fieldErrors.description && (
                <p id="edit-description-error" className="field-error">
                  {fieldErrors.description}
                </p>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="edit-priority">Priority</label>
              <select
                id="edit-priority"
                name="priority"
                value={form.priority}
                onChange={(event) =>
                  updateField("priority", event.target.value)
                }
                aria-invalid={Boolean(fieldErrors.priority)}
                aria-describedby={
                  fieldErrors.priority ? "edit-priority-error" : undefined
                }
              >
                {PRIORITY_OPTIONS.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
              {fieldErrors.priority && (
                <p id="edit-priority-error" className="field-error">
                  {fieldErrors.priority}
                </p>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="edit-assignee">Assignee</label>
              <select
                id="edit-assignee"
                name="assignedTo"
                value={form.assignedTo}
                onChange={(event) =>
                  updateField("assignedTo", event.target.value)
                }
                disabled={usersLoading}
                aria-invalid={Boolean(fieldErrors.assignedTo || usersError)}
                aria-describedby={
                  fieldErrors.assignedTo || usersError
                    ? "edit-assignee-error"
                    : undefined
                }
              >
                <option value={UNASSIGNED_VALUE}>Unassigned</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
              {usersLoading && (
                <p className="muted">Loading assignees...</p>
              )}
              {(usersError || fieldErrors.assignedTo) && (
                <p id="edit-assignee-error" className="field-error">
                  {fieldErrors.assignedTo || usersError}
                </p>
              )}
            </div>

            <div className="form-actions">
              <button type="submit" disabled={submitting}>
                {submitting ? "Saving..." : "Save Changes"}
              </button>
              <button
                type="button"
                className="button-secondary"
                onClick={cancelEditing}
                disabled={submitting}
              >
                Cancel
              </button>
            </div>
          </form>
        </>
      )}
    </section>
  );
}

export default TicketDetailPage;
