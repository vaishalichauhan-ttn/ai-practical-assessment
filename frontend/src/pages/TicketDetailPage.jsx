import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ApiError } from "../api/client.js";
import { getTicket, updateTicket, addComment, listComments } from "../api/tickets.js";
import { listUsers } from "../api/users.js";
import { PRIORITY_OPTIONS, TICKET_STATUSES, isStatusOptionEnabled } from "../constants/ticket.js";
import { MESSAGE_MAX_LENGTH } from "../constants/comment.js";
import { formatDate } from "../utils/formatDate.js";

const UNASSIGNED_VALUE = "";

function toFormState(ticket) {
  return {
    title: ticket.title,
    description: ticket.description,
    priority: ticket.priority,
    status: ticket.status,
    assignedTo: ticket.assignedTo?.id ?? UNASSIGNED_VALUE,
  };
}

function StatusSelect({
  id,
  label,
  value,
  currentStatus,
  onChange,
  disabled,
  error,
  describedById,
}) {
  return (
    <div className="ticket-meta-item form-field">
      <label htmlFor={id}>{label}</label>
      <select
        id={id}
        name="status"
        value={value}
        onChange={onChange}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? describedById : undefined}
      >
        {TICKET_STATUSES.map((status) => (
          <option
            key={status}
            value={status}
            disabled={!isStatusOptionEnabled(currentStatus, status)}
          >
            {status}
          </option>
        ))}
      </select>
      {error && (
        <p id={describedById} className="field-error">
          {error}
        </p>
      )}
    </div>
  );
}

function getStatusErrorMessage(err) {
  if (!(err instanceof ApiError)) {
    return null;
  }

  const statusDetail = err.details.find((detail) => detail.field === "status");
  if (statusDetail?.message) {
    return statusDetail.message;
  }

  if (
    err.message.includes("Cannot transition") ||
    err.message.includes("Status change not allowed")
  ) {
    return err.message;
  }

  return null;
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
  const [statusError, setStatusError] = useState("");
  const [statusSubmitting, setStatusSubmitting] = useState(false);
  const [commentMessage, setCommentMessage] = useState("");
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentsError, setCommentsError] = useState("");
  const [commentError, setCommentError] = useState("");
  const [commentFieldError, setCommentFieldError] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);

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
      setStatusError("");
      setComments([]);
      setCommentsLoading(true);
      setCommentsError("");
      setCommentMessage("");
      setCommentError("");
      setCommentFieldError("");

      try {
        const [ticketResult, commentsResult] = await Promise.allSettled([
          getTicket(id),
          listComments(id),
        ]);

        if (cancelled) {
          return;
        }

        if (ticketResult.status === "rejected") {
          const err = ticketResult.reason;
          if (err instanceof ApiError && err.status === 404) {
            setError("Ticket not found.");
          } else {
            setError(
              err instanceof ApiError
                ? err.message || "Failed to load ticket."
                : "Failed to load ticket."
            );
          }
        } else {
          setTicket(ticketResult.value);

          if (commentsResult.status === "fulfilled") {
            setComments(commentsResult.value);
          } else {
            const err = commentsResult.reason;
            setCommentsError(
              err instanceof ApiError
                ? err.message || "Failed to load comments."
                : "Failed to load comments. Please try again."
            );
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setCommentsLoading(false);
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
    setStatusError("");
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

    if (form.status !== ticket.status) {
      payload.status = form.status;
    }

    try {
      const updated = await updateTicket(id, payload);
      setTicket((current) => ({
        ...current,
        ...updated,
      }));
      setIsEditing(false);
      setForm(null);
      setStatusError("");
    } catch (err) {
      if (err instanceof ApiError) {
        const nextFieldErrors = {};
        for (const detail of err.details) {
          if (detail.field && detail.field !== "body") {
            nextFieldErrors[detail.field] = detail.message;
          }
        }

        const statusMessage = getStatusErrorMessage(err);
        if (statusMessage) {
          nextFieldErrors.status = statusMessage;
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

  async function handleStatusChange(nextStatus) {
    if (!ticket || nextStatus === ticket.status) {
      return;
    }

    setStatusError("");
    setStatusSubmitting(true);

    try {
      const updated = await updateTicket(id, { status: nextStatus });
      setTicket((current) => ({
        ...current,
        ...updated,
      }));
    } catch (err) {
      if (err instanceof ApiError) {
        setStatusError(
          getStatusErrorMessage(err) || err.message || "Failed to update status"
        );
      } else {
        setStatusError("Failed to update status. Please try again.");
      }
    } finally {
      setStatusSubmitting(false);
    }
  }

  async function handleAddComment(event) {
    event.preventDefault();
    setCommentError("");
    setCommentFieldError("");

    if (!commentMessage.trim()) {
      setCommentFieldError("Message is required");
      return;
    }

    if (commentMessage.trim().length > MESSAGE_MAX_LENGTH) {
      setCommentFieldError(
        `Message must be at most ${MESSAGE_MAX_LENGTH} characters`
      );
      return;
    }

    setCommentSubmitting(true);

    try {
      const created = await addComment(id, {
        message: commentMessage.trim(),
      });
      setComments((current) => [...current, created]);
      setCommentMessage("");
    } catch (err) {
      if (err instanceof ApiError) {
        const messageDetail = err.details.find(
          (detail) => detail.field === "message"
        );
        if (messageDetail?.message) {
          setCommentFieldError(messageDetail.message);
        }
        setCommentError(err.message || "Failed to add comment");
      } else {
        setCommentError("Failed to add comment. Please try again.");
      }
    } finally {
      setCommentSubmitting(false);
    }
  }

  return (
    <section className="card ticket-detail-card">
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
        <div className="ticket-detail-layout">
          <div className="ticket-detail-main">
            <div className="ticket-detail-panel ticket-detail-title-panel">
              <h3 className="ticket-detail-title">{ticket.title}</h3>
            </div>
            <section className="ticket-detail-section">
              <h4>Description</h4>
              <p className="ticket-description">{ticket.description}</p>
            </section>
            <section className="ticket-detail-section ticket-comments-section">
              <h4>Comments</h4>

              {commentsLoading && (
                <p className="muted">Loading comments...</p>
              )}

              {!commentsLoading && commentsError && (
                <p className="status-error">{commentsError}</p>
              )}

              {!commentsLoading && !commentsError && comments.length > 0 ? (
                <ul className="ticket-comment-list">
                  {comments.map((comment) => (
                    <li key={comment.id} className="ticket-comment-item">
                      <p className="ticket-comment-message">{comment.message}</p>
                      <p className="ticket-comment-meta">
                        <span>{comment.createdBy.name}</span>
                        <span aria-hidden="true">·</span>
                        <time dateTime={comment.createdAt}>
                          {formatDate(comment.createdAt)}
                        </time>
                      </p>
                    </li>
                  ))}
                </ul>
              ) : null}

              <form
                className="ticket-comment-form"
                onSubmit={handleAddComment}
                noValidate
              >
                {commentError && (
                  <p className="form-error-banner">{commentError}</p>
                )}

                <div className="form-field">
                  <label htmlFor="comment-message">Add a comment</label>
                  <textarea
                    id="comment-message"
                    name="message"
                    rows={4}
                    maxLength={MESSAGE_MAX_LENGTH}
                    value={commentMessage}
                    onChange={(event) => {
                      setCommentMessage(event.target.value);
                      setCommentFieldError("");
                      setCommentError("");
                    }}
                    disabled={commentSubmitting}
                    aria-invalid={Boolean(commentFieldError)}
                    aria-describedby={
                      commentFieldError ? "comment-message-error" : undefined
                    }
                  />
                  {commentFieldError && (
                    <p id="comment-message-error" className="field-error">
                      {commentFieldError}
                    </p>
                  )}
                </div>

                <div className="form-actions">
                  <button type="submit" disabled={commentSubmitting}>
                    {commentSubmitting ? "Posting..." : "Post Comment"}
                  </button>
                </div>
              </form>
            </section>
          </div>

          <aside className="ticket-detail-panel ticket-detail-sidebar">
            <StatusSelect
              id="view-status"
              label="Status"
              value={ticket.status}
              currentStatus={ticket.status}
              onChange={(event) => handleStatusChange(event.target.value)}
              disabled={statusSubmitting}
              error={statusError}
              describedById="view-status-error"
            />

            <dl className="ticket-meta-list">
              <div className="ticket-meta-item">
                <dt>Priority</dt>
                <dd>{ticket.priority}</dd>
              </div>
              <div className="ticket-meta-item">
                <dt>Assignee</dt>
                <dd>{ticket.assignedTo?.name ?? "Unassigned"}</dd>
              </div>
              <div className="ticket-meta-item">
                <dt>Created By</dt>
                <dd>{ticket.createdBy.name}</dd>
              </div>
              <div className="ticket-meta-item">
                <dt>Created</dt>
                <dd>{formatDate(ticket.createdAt)}</dd>
              </div>
              <div className="ticket-meta-item">
                <dt>Updated</dt>
                <dd>{formatDate(ticket.updatedAt)}</dd>
              </div>
            </dl>
          </aside>
        </div>
      )}

      {!loading && ticket && isEditing && form && (
        <form className="ticket-detail-layout ticket-edit-form" onSubmit={handleSave} noValidate>
          <div className="ticket-detail-main">
            <h3 className="ticket-detail-title">Edit Ticket</h3>

            {formError && <p className="form-error-banner">{formError}</p>}

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
                rows={8}
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
          </div>

          <aside className="ticket-detail-panel ticket-detail-sidebar">
            <StatusSelect
              id="edit-status"
              label="Status"
              value={form.status}
              currentStatus={ticket.status}
              onChange={(event) => updateField("status", event.target.value)}
              disabled={submitting}
              error={fieldErrors.status}
              describedById="edit-status-error"
            />

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

            <div className="form-actions ticket-sidebar-actions">
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
          </aside>
        </form>
      )}
    </section>
  );
}

export default TicketDetailPage;
