import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ApiError } from "../api/client.js";
import TicketDetailPage from "./TicketDetailPage.jsx";

const mockTicket = {
  id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  title: "Cannot log in",
  description: "User reports 401 error.",
  priority: "High",
  status: "Open",
  assignedTo: null,
  createdBy: { id: "11111111-1111-1111-1111-111111111111", name: "Alice Johnson" },
  createdAt: "2026-07-23T09:00:00.000Z",
  updatedAt: "2026-07-23T09:00:00.000Z",
  comments: [],
};

const mockUsers = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    name: "Alice Johnson",
    email: "alice@example.com",
    role: "agent",
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    name: "Bob Smith",
    email: "bob@example.com",
    role: "admin",
  },
];

vi.mock("../api/tickets.js", () => ({
  getTicket: vi.fn(),
  updateTicket: vi.fn(),
}));

vi.mock("../api/users.js", () => ({
  listUsers: vi.fn(),
}));

import { getTicket, updateTicket } from "../api/tickets.js";
import { listUsers } from "../api/users.js";

function renderDetailPage(ticketId = mockTicket.id) {
  return render(
    <MemoryRouter initialEntries={[`/tickets/${ticketId}`]}>
      <Routes>
        <Route path="/tickets/:id" element={<TicketDetailPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("TicketDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getTicket.mockResolvedValue(mockTicket);
    listUsers.mockResolvedValue(mockUsers);
  });

  it("shows loading state while fetching ticket", () => {
    getTicket.mockImplementation(
      () => new Promise(() => {})
    );

    renderDetailPage();

    expect(screen.getByText(/loading ticket/i)).toBeInTheDocument();
    expect(listUsers).not.toHaveBeenCalled();
  });

  it("renders ticket details in read-only view without loading users", async () => {
    renderDetailPage();

    expect(await screen.findByText("Cannot log in")).toBeInTheDocument();
    expect(screen.getByText("User reports 401 error.")).toBeInTheDocument();
    expect(screen.getByText("High")).toBeInTheDocument();
    expect(screen.getByText("Unassigned")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /edit ticket/i })).toBeInTheDocument();
    expect(listUsers).not.toHaveBeenCalled();
  });

  it("loads users when entering edit mode", async () => {
    const user = userEvent.setup();
    renderDetailPage();

    await screen.findByText("Cannot log in");
    await user.click(screen.getByRole("button", { name: /edit ticket/i }));

    await waitFor(() => {
      expect(listUsers).toHaveBeenCalledTimes(1);
    });
    expect(screen.getByLabelText(/assignee/i)).toBeInTheDocument();
  });

  it("shows edit form and saves updated fields", async () => {
    const user = userEvent.setup();
    updateTicket.mockResolvedValue({
      ...mockTicket,
      title: "Updated title",
      description: "Updated description",
      priority: "Critical",
      assignedTo: { id: mockUsers[1].id, name: mockUsers[1].name },
      updatedAt: "2026-07-23T10:00:00.000Z",
    });

    renderDetailPage();

    await screen.findByText("Cannot log in");
    await user.click(screen.getByRole("button", { name: /edit ticket/i }));

    await waitFor(() => {
      expect(listUsers).toHaveBeenCalled();
    });

    await user.clear(screen.getByLabelText(/title/i));
    await user.type(screen.getByLabelText(/title/i), "Updated title");
    await user.clear(screen.getByLabelText(/description/i));
    await user.type(screen.getByLabelText(/description/i), "Updated description");
    await user.selectOptions(screen.getByLabelText(/priority/i), "Critical");
    await user.selectOptions(screen.getByLabelText(/assignee/i), mockUsers[1].id);
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      expect(updateTicket).toHaveBeenCalledWith(mockTicket.id, {
        title: "Updated title",
        description: "Updated description",
        priority: "Critical",
        assignedTo: mockUsers[1].id,
      });
    });

    expect(await screen.findByText("Updated title")).toBeInTheDocument();
    expect(screen.getByText("Updated description")).toBeInTheDocument();
    expect(screen.getByText("Critical")).toBeInTheDocument();
    expect(screen.getByText("Bob Smith")).toBeInTheDocument();
  });

  it("supports unassigning a ticket", async () => {
    const user = userEvent.setup();
    getTicket.mockResolvedValue({
      ...mockTicket,
      assignedTo: { id: mockUsers[1].id, name: mockUsers[1].name },
    });
    updateTicket.mockResolvedValue({
      ...mockTicket,
      assignedTo: null,
      updatedAt: "2026-07-23T10:00:00.000Z",
    });

    renderDetailPage();

    await screen.findByText("Bob Smith");
    await user.click(screen.getByRole("button", { name: /edit ticket/i }));
    await waitFor(() => {
      expect(listUsers).toHaveBeenCalled();
    });
    await user.selectOptions(screen.getByLabelText(/assignee/i), "");
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      expect(updateTicket).toHaveBeenCalledWith(mockTicket.id, {
        title: mockTicket.title,
        description: mockTicket.description,
        priority: mockTicket.priority,
        assignedTo: null,
      });
    });

    expect(await screen.findByText("Unassigned")).toBeInTheDocument();
  });

  it("cancels editing and returns to read-only view", async () => {
    const user = userEvent.setup();
    renderDetailPage();

    await screen.findByText("Cannot log in");
    await user.click(screen.getByRole("button", { name: /edit ticket/i }));
    await waitFor(() => {
      expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    });

    await user.clear(screen.getByLabelText(/title/i));
    await user.type(screen.getByLabelText(/title/i), "Discarded change");
    await user.click(screen.getByRole("button", { name: /cancel/i }));

    expect(screen.getByText("Cannot log in")).toBeInTheDocument();
    expect(screen.queryByLabelText(/title/i)).not.toBeInTheDocument();
    expect(updateTicket).not.toHaveBeenCalled();
  });

  it("shows client-side validation errors for empty fields", async () => {
    const user = userEvent.setup();
    renderDetailPage();

    await screen.findByText("Cannot log in");
    await user.click(screen.getByRole("button", { name: /edit ticket/i }));
    await user.clear(screen.getByLabelText(/title/i));
    await user.clear(screen.getByLabelText(/description/i));
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    expect(await screen.findByText("Title is required")).toBeInTheDocument();
    expect(screen.getByText("Description is required")).toBeInTheDocument();
    expect(updateTicket).not.toHaveBeenCalled();
  });

  it("displays API validation errors on update failure", async () => {
    const user = userEvent.setup();
    updateTicket.mockRejectedValue(
      new ApiError(400, "Validation failed", [
        { field: "assignedTo", message: "Invalid assignee" },
        { field: "priority", message: "Invalid priority value" },
      ])
    );

    renderDetailPage();

    await screen.findByText("Cannot log in");
    await user.click(screen.getByRole("button", { name: /edit ticket/i }));
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    expect(await screen.findByText("Validation failed")).toBeInTheDocument();
    expect(screen.getByText("Invalid assignee")).toBeInTheDocument();
    expect(screen.getByText("Invalid priority value")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /save changes/i })).toBeInTheDocument();
  });

  it("shows targeted error when assignee list fails to load", async () => {
    const user = userEvent.setup();
    listUsers.mockRejectedValue(new ApiError(500, "Internal server error"));

    renderDetailPage();

    await screen.findByText("Cannot log in");
    expect(screen.getByText("Cannot log in")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /edit ticket/i }));

    expect(await screen.findByText("Internal server error")).toBeInTheDocument();
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
  });

  it("shows not found message for missing tickets", async () => {
    getTicket.mockRejectedValue(new ApiError(404, "Ticket not found"));

    renderDetailPage();

    expect(await screen.findByText("Ticket not found.")).toBeInTheDocument();
    expect(listUsers).not.toHaveBeenCalled();
  });
});
