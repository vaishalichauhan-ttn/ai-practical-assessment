import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ApiError, ERROR_MESSAGES, NetworkError } from "../api/client.js";
import TicketsPage from "./TicketsPage.jsx";

const mockTickets = [
  {
    id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    title: "Cannot log in to dashboard",
    priority: "High",
    status: "Open",
    assignedTo: null,
    createdAt: "2026-07-23T09:00:00.000Z",
    updatedAt: "2026-07-23T09:00:00.000Z",
  },
  {
    id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    title: "Printer offline",
    priority: "Low",
    status: "In Progress",
    assignedTo: null,
    createdAt: "2026-07-22T14:30:00.000Z",
    updatedAt: "2026-07-23T08:45:00.000Z",
  },
];

vi.mock("../api/tickets.js", () => ({
  listTickets: vi.fn(),
}));

vi.mock("../components/CreateTicketModal.jsx", () => ({
  default: () => null,
}));

import { listTickets } from "../api/tickets.js";

function renderTicketsPage(initialRoute = "/tickets") {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <Routes>
        <Route path="/tickets" element={<TicketsPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("TicketsPage search and filter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listTickets.mockResolvedValue(mockTickets);
  });

  it("loads tickets without filters on initial render", async () => {
    renderTicketsPage();

    await waitFor(() => {
      expect(listTickets).toHaveBeenCalledWith({
        search: undefined,
        status: undefined,
      });
    });

    expect(screen.getByText("Cannot log in to dashboard")).toBeInTheDocument();
    expect(screen.getByText("Printer offline")).toBeInTheDocument();
  });

  it("applies search filter when the search form is submitted", async () => {
    const user = userEvent.setup();
    listTickets.mockResolvedValue([mockTickets[0]]);

    renderTicketsPage();

    await waitFor(() => {
      expect(screen.getByText("Cannot log in to dashboard")).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText(/search/i), "login");
    await user.click(screen.getByRole("button", { name: /^search$/i }));

    await waitFor(() => {
      expect(listTickets).toHaveBeenLastCalledWith({
        search: "login",
        status: undefined,
      });
    });
  });

  it("applies status filter when the status dropdown changes", async () => {
    const user = userEvent.setup();
    listTickets.mockResolvedValue([mockTickets[1]]);

    renderTicketsPage();

    await waitFor(() => {
      expect(screen.getByText("Printer offline")).toBeInTheDocument();
    });

    await user.selectOptions(screen.getByLabelText(/status/i), "In Progress");

    await waitFor(() => {
      expect(listTickets).toHaveBeenLastCalledWith({
        search: undefined,
        status: "In Progress",
      });
    });
  });

  it("loads filters from URL query params on initial render", async () => {
    listTickets.mockResolvedValue([mockTickets[0]]);

    renderTicketsPage("/tickets?search=login&status=Open");

    await waitFor(() => {
      expect(listTickets).toHaveBeenCalledWith({
        search: "login",
        status: "Open",
      });
    });

    expect(screen.getByLabelText(/search/i)).toHaveValue("login");
    expect(screen.getByLabelText(/status/i)).toHaveValue("Open");
  });

  it("clears filters when Clear filters is clicked", async () => {
    const user = userEvent.setup();
    listTickets.mockResolvedValue([mockTickets[0]]);

    renderTicketsPage("/tickets?search=login&status=Open");

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /clear filters/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /clear filters/i }));

    await waitFor(() => {
      expect(listTickets).toHaveBeenLastCalledWith({
        search: undefined,
        status: undefined,
      });
    });

    expect(screen.getByLabelText(/search/i)).toHaveValue("");
    expect(screen.getByLabelText(/status/i)).toHaveValue("");
  });

  it("shows a no-results message when filters return an empty list", async () => {
    listTickets.mockResolvedValue([]);

    renderTicketsPage("/tickets?search=missing");

    await waitFor(() => {
      expect(screen.getByText(/no tickets match your filters/i)).toBeInTheDocument();
    });
  });

  it("shows a network error message when ticket loading fails offline", async () => {
    listTickets.mockRejectedValue(new NetworkError());

    renderTicketsPage();

    expect(
      await screen.findByText(ERROR_MESSAGES.NETWORK)
    ).toBeInTheDocument();
  });

  it("shows a generic server error message when ticket loading returns 500", async () => {
    listTickets.mockRejectedValue(new ApiError(500, "Internal server error"));

    renderTicketsPage();

    expect(
      await screen.findByText(ERROR_MESSAGES.SERVER)
    ).toBeInTheDocument();
  });
});
