import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ApiError } from "../api/client.js";
import { getTicket } from "../api/tickets.js";
import { formatDate } from "../utils/formatDate.js";

function TicketDetailPage() {
  const { id } = useParams();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadTicket() {
      setLoading(true);
      setError("");
      setTicket(null);

      try {
        const data = await getTicket(id);
        if (!cancelled) {
          setTicket(data);
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

  return (
    <section className="card">
      <div className="page-header">
        <div>
          <p className="breadcrumb">
            <Link to="/tickets">Tickets</Link>
          </p>
          <h2>Ticket Details</h2>
        </div>
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

      {!loading && ticket && (
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
    </section>
  );
}

export default TicketDetailPage;
