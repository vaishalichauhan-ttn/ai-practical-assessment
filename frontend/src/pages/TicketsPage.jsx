import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ApiError } from "../api/client.js";
import { listTickets } from "../api/tickets.js";
import CreateTicketModal from "../components/CreateTicketModal.jsx";
import { formatDate } from "../utils/formatDate.js";

function toListItem(ticket) {
  return {
    id: ticket.id,
    title: ticket.title,
    priority: ticket.priority,
    status: ticket.status,
    assignedTo: ticket.assignedTo,
    createdAt: ticket.createdAt,
    updatedAt: ticket.updatedAt,
  };
}

function TicketsPage() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadTickets = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await listTickets();
      setTickets(data);
    } catch (err) {
      setTickets([]);
      if (err instanceof ApiError) {
        setError(err.message || "Failed to load tickets.");
      } else {
        setError("Failed to load tickets. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  function handleTicketCreated(ticket) {
    setTickets((current) => [toListItem(ticket), ...current]);
  }

  function openTicket(ticketId) {
    navigate(`/tickets/${ticketId}`);
  }

  function handleRowKeyDown(event, ticketId) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openTicket(ticketId);
    }
  }

  return (
    <>
      <section className="card">
        <div className="page-header">
          <div>
            <h2>Tickets</h2>
            <p className="muted">View and manage support requests.</p>
          </div>
          <button type="button" onClick={() => setIsModalOpen(true)}>
            Create Ticket
          </button>
        </div>

        {loading && <p className="muted">Loading tickets...</p>}

        {!loading && error && <p className="form-error-banner">{error}</p>}

        {!loading && !error && tickets.length === 0 && (
          <div className="empty-state">
            <p className="muted">No tickets yet.</p>
          </div>
        )}

        {!loading && !error && tickets.length > 0 && (
          <div className="ticket-table-wrapper">
            <table className="ticket-table">
              <thead>
                <tr>
                  <th scope="col">Title</th>
                  <th scope="col">Priority</th>
                  <th scope="col">Status</th>
                  <th scope="col">Assignee</th>
                  <th scope="col">Created</th>
                  <th scope="col">Updated</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className="ticket-row"
                    onClick={() => openTicket(ticket.id)}
                    onKeyDown={(event) => handleRowKeyDown(event, ticket.id)}
                    tabIndex={0}
                    role="link"
                    aria-label={`View ticket: ${ticket.title}`}
                  >
                    <td>
                      <Link
                        className="ticket-link"
                        to={`/tickets/${ticket.id}`}
                        onClick={(event) => event.stopPropagation()}
                      >
                        {ticket.title}
                      </Link>
                    </td>
                    <td>{ticket.priority}</td>
                    <td>{ticket.status}</td>
                    <td>{ticket.assignedTo?.name ?? "Unassigned"}</td>
                    <td>{formatDate(ticket.createdAt)}</td>
                    <td>{formatDate(ticket.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <CreateTicketModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={handleTicketCreated}
      />
    </>
  );
}

export default TicketsPage;
