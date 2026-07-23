import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { getErrorMessage } from "../api/client.js";
import { listTickets } from "../api/tickets.js";
import CreateTicketModal from "../components/CreateTicketModal.jsx";
import { TICKET_STATUSES } from "../constants/ticket.js";
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

function readFiltersFromParams(searchParams) {
  return {
    search: searchParams.get("search") ?? "",
    status: searchParams.get("status") ?? "",
  };
}

function TicketsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(
    () => searchParams.get("search") ?? ""
  );
  const [statusFilter, setStatusFilter] = useState(
    () => searchParams.get("status") ?? ""
  );

  const filters = readFiltersFromParams(searchParams);
  const hasActiveFilters = Boolean(filters.search || filters.status);

  const loadTickets = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await listTickets({
        search: filters.search || undefined,
        status: filters.status || undefined,
      });
      setTickets(data);
    } catch (err) {
      setTickets([]);
      setError(getErrorMessage(err, "Failed to load tickets. Please try again."));
    } finally {
      setLoading(false);
    }
  }, [filters.search, filters.status]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  useEffect(() => {
    setSearchInput(filters.search);
    setStatusFilter(filters.status);
  }, [filters.search, filters.status]);

  function applyFilters(nextSearch, nextStatus) {
    const params = new URLSearchParams();

    if (nextSearch.trim()) {
      params.set("search", nextSearch.trim());
    }

    if (nextStatus) {
      params.set("status", nextStatus);
    }

    setSearchParams(params, { replace: false });
  }

  function handleSearchSubmit(event) {
    event.preventDefault();
    applyFilters(searchInput, statusFilter);
  }

  function handleStatusChange(event) {
    const nextStatus = event.target.value;
    setStatusFilter(nextStatus);
    applyFilters(searchInput, nextStatus);
  }

  function handleClearFilters() {
    setSearchInput("");
    setStatusFilter("");
    setSearchParams({}, { replace: false });
  }

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

        <form className="ticket-filters" onSubmit={handleSearchSubmit}>
          <div className="form-field ticket-filters__search">
            <label htmlFor="ticket-search">Search</label>
            <input
              id="ticket-search"
              type="search"
              placeholder="Search by title or description"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
          </div>

          <div className="form-field ticket-filters__status">
            <label htmlFor="ticket-status-filter">Status</label>
            <select
              id="ticket-status-filter"
              value={statusFilter}
              onChange={handleStatusChange}
            >
              <option value="">All statuses</option>
              {TICKET_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <div className="ticket-filters__actions">
            <button type="submit">Search</button>
            {hasActiveFilters && (
              <button type="button" className="button-secondary" onClick={handleClearFilters}>
                Clear filters
              </button>
            )}
          </div>
        </form>

        {loading && <p className="muted">Loading tickets...</p>}

        {!loading && error && <p className="form-error-banner">{error}</p>}

        {!loading && !error && tickets.length === 0 && (
          <div className="empty-state">
            <p className="muted">
              {hasActiveFilters
                ? "No tickets match your filters."
                : "No tickets yet."}
            </p>
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
