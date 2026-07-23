import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ApiError, ERROR_MESSAGES, NetworkError } from "../api/client.js";
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
  addComment: vi.fn(),
  listComments: vi.fn(),
}));

vi.mock("../api/users.js", () => ({
  listUsers: vi.fn(),
}));

import { getTicket, updateTicket, addComment, listComments } from "../api/tickets.js";
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
    listComments.mockResolvedValue([]);
    listUsers.mockResolvedValue(mockUsers);
  });

  it("shows loading state while fetching ticket", () => {
    getTicket.mockImplementation(
      () => new Promise(() => {})
    );
    listComments.mockImplementation(
      () => new Promise(() => {})
    );
    listUsers.mockImplementation(
      () => new Promise(() => {})
    );

    renderDetailPage();

    expect(screen.getByText(/loading ticket/i)).toBeInTheDocument();
    expect(listUsers).toHaveBeenCalled();
  });

  it("renders ticket details in a two-column layout with assignee dropdown", async () => {
    renderDetailPage();

    expect(await screen.findByText("Cannot log in")).toBeInTheDocument();
    expect(screen.getByText("User reports 401 error.")).toBeInTheDocument();
    expect(screen.getByText("High")).toBeInTheDocument();
    expect(screen.getByLabelText(/assignee/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/assignee/i)).toHaveValue("");
    expect(screen.getByLabelText(/^status$/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /^comments$/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/add a comment/i)).toBeInTheDocument();
    expect(listComments).toHaveBeenCalledWith(mockTicket.id);
    expect(listUsers).toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /edit ticket/i })).toBeInTheDocument();
  });

  it("loads users when entering edit mode if initial load failed", async () => {
    const user = userEvent.setup();
    listUsers.mockRejectedValueOnce(new ApiError(500, "Internal server error"));
    renderDetailPage();

    await screen.findByText("Cannot log in");
    await user.click(screen.getByRole("button", { name: /edit ticket/i }));

    await waitFor(() => {
      expect(listUsers).toHaveBeenCalledTimes(2);
    });
    expect(screen.getByLabelText(/assignee/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^status$/i)).toBeInTheDocument();
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

    await user.clear(screen.getByLabelText(/^title$/i));
    await user.type(screen.getByLabelText(/^title$/i), "Updated title");
    await user.clear(screen.getByLabelText(/^description$/i));
    await user.type(screen.getByLabelText(/^description$/i), "Updated description");
    await user.selectOptions(screen.getByLabelText(/^priority$/i), "Critical");
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
    expect(screen.getByLabelText(/assignee/i)).toHaveValue(mockUsers[1].id);
  });

  it("includes status in save payload when changed in edit mode", async () => {
    const user = userEvent.setup();
    updateTicket.mockResolvedValue({
      ...mockTicket,
      status: "In Progress",
      updatedAt: "2026-07-23T10:00:00.000Z",
    });

    renderDetailPage();

    await screen.findByText("Cannot log in");
    await user.click(screen.getByRole("button", { name: /edit ticket/i }));
    await waitFor(() => {
      expect(listUsers).toHaveBeenCalled();
    });

    const statusSelects = screen.getAllByLabelText(/^status$/i);
    await user.selectOptions(statusSelects[statusSelects.length - 1], "In Progress");
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      expect(updateTicket).toHaveBeenCalledWith(mockTicket.id, {
        title: mockTicket.title,
        description: mockTicket.description,
        priority: mockTicket.priority,
        assignedTo: null,
        status: "In Progress",
      });
    });
  });

  it("supports unassigning a ticket from the view dropdown", async () => {
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

    await screen.findByText("Cannot log in");
    await user.selectOptions(screen.getByLabelText(/assignee/i), "");

    await waitFor(() => {
      expect(updateTicket).toHaveBeenCalledWith(mockTicket.id, {
        assignedTo: null,
      });
    });

    expect(screen.getByLabelText(/assignee/i)).toHaveValue("");
  });

  it("supports unassigning a ticket from edit mode", async () => {
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

    await screen.findByText("Cannot log in");
    expect(screen.getByLabelText(/assignee/i)).toHaveValue(mockUsers[1].id);
    await user.click(screen.getByRole("button", { name: /edit ticket/i }));
    await waitFor(() => {
      expect(screen.getByLabelText(/^title$/i)).toBeInTheDocument();
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

    expect(screen.getByLabelText(/assignee/i)).toHaveValue("");
  });

  it("changes ticket assignee via dropdown and updates the displayed assignee", async () => {
    const user = userEvent.setup();
    updateTicket.mockResolvedValue({
      ...mockTicket,
      assignedTo: { id: mockUsers[1].id, name: mockUsers[1].name },
      updatedAt: "2026-07-23T10:00:00.000Z",
    });

    renderDetailPage();

    await screen.findByText("Cannot log in");
    await user.selectOptions(screen.getByLabelText(/assignee/i), mockUsers[1].id);

    await waitFor(() => {
      expect(updateTicket).toHaveBeenCalledWith(mockTicket.id, {
        assignedTo: mockUsers[1].id,
      });
    });

    expect(screen.getByLabelText(/assignee/i)).toHaveValue(mockUsers[1].id);
  });

  it("displays API error when assignee update fails", async () => {
    const user = userEvent.setup();
    updateTicket.mockRejectedValue(
      new ApiError(400, "Validation failed", [
        { field: "assignedTo", message: "Invalid assignee" },
      ])
    );

    renderDetailPage();

    await screen.findByText("Cannot log in");
    await user.selectOptions(screen.getByLabelText(/assignee/i), mockUsers[1].id);

    expect(await screen.findByText("Invalid assignee")).toBeInTheDocument();
    expect(screen.getByLabelText(/assignee/i)).toHaveValue("");
  });

  it("cancels editing and returns to read-only view", async () => {
    const user = userEvent.setup();
    renderDetailPage();

    await screen.findByText("Cannot log in");
    await user.click(screen.getByRole("button", { name: /edit ticket/i }));
    await waitFor(() => {
      expect(screen.getByLabelText(/^title$/i)).toBeInTheDocument();
    });

    await user.clear(screen.getByLabelText(/^title$/i));
    await user.type(screen.getByLabelText(/^title$/i), "Discarded change");
    await user.click(screen.getByRole("button", { name: /cancel/i }));

    expect(screen.getByText("Cannot log in")).toBeInTheDocument();
    expect(screen.queryByLabelText(/^title$/i)).not.toBeInTheDocument();
    expect(updateTicket).not.toHaveBeenCalled();
  });

  it("shows client-side validation errors for empty fields", async () => {
    const user = userEvent.setup();
    renderDetailPage();

    await screen.findByText("Cannot log in");
    await user.click(screen.getByRole("button", { name: /edit ticket/i }));
    await user.clear(screen.getByLabelText(/^title$/i));
    await user.clear(screen.getByLabelText(/^description$/i));
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

  it("shows a generic form error when ticket update fails with a non-API error", async () => {
    const user = userEvent.setup();
    updateTicket.mockRejectedValue(new Error("boom"));

    renderDetailPage();

    await screen.findByText("Cannot log in");
    await user.click(screen.getByRole("button", { name: /edit ticket/i }));
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    expect(
      await screen.findByText(/failed to update ticket\. please try again/i)
    ).toBeInTheDocument();
  });

  it("shows targeted error when assignee list fails to load", async () => {
    listUsers.mockRejectedValue(new ApiError(500, "Internal server error"));

    renderDetailPage();

    expect(await screen.findByText("Cannot log in")).toBeInTheDocument();
    expect(await screen.findByText(ERROR_MESSAGES.SERVER)).toBeInTheDocument();
    expect(screen.getByLabelText(/assignee/i)).toBeInTheDocument();
  });

  it("shows not found message for missing tickets", async () => {
    getTicket.mockRejectedValue(new ApiError(404, "Ticket not found"));
    listComments.mockRejectedValue(new ApiError(404, "Ticket not found"));

    renderDetailPage();

    expect(await screen.findByText("Ticket not found.")).toBeInTheDocument();
  });

  it("shows a network error message when ticket loading fails offline", async () => {
    getTicket.mockRejectedValue(new NetworkError());
    listComments.mockRejectedValue(new NetworkError());
    listUsers.mockRejectedValue(new NetworkError());

    renderDetailPage();

    expect(
      await screen.findByText(ERROR_MESSAGES.NETWORK)
    ).toBeInTheDocument();
  });

  it("disables invalid status options based on the current status", async () => {
    renderDetailPage();

    await screen.findByText("Cannot log in");

    expect(screen.getByRole("option", { name: "Open" })).toBeEnabled();
    expect(screen.getByRole("option", { name: "In Progress" })).toBeEnabled();
    expect(screen.getByRole("option", { name: "Cancelled" })).toBeEnabled();
    expect(screen.getByRole("option", { name: "Closed" })).toBeDisabled();
    expect(screen.getByRole("option", { name: "Resolved" })).toBeDisabled();
  });

  it("changes ticket status via dropdown and updates the displayed status", async () => {
    const user = userEvent.setup();
    updateTicket.mockResolvedValue({
      ...mockTicket,
      status: "In Progress",
      updatedAt: "2026-07-23T10:00:00.000Z",
    });

    renderDetailPage();

    await screen.findByText("Cannot log in");
    await user.selectOptions(screen.getByLabelText(/^status$/i), "In Progress");

    await waitFor(() => {
      expect(updateTicket).toHaveBeenCalledWith(mockTicket.id, {
        status: "In Progress",
      });
    });

    expect(screen.getByLabelText(/^status$/i)).toHaveValue("In Progress");
  });

  it("displays API error when status transition fails", async () => {
    const user = userEvent.setup();
    updateTicket.mockRejectedValue(
      new ApiError(400, "Cannot transition from Open to In Progress", [
        {
          field: "status",
          message: "Cannot transition from Open to In Progress",
        },
      ])
    );

    renderDetailPage();

    await screen.findByText("Cannot log in");
    await user.selectOptions(screen.getByLabelText(/^status$/i), "In Progress");

    expect(
      await screen.findByText("Cannot transition from Open to In Progress")
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/^status$/i)).toHaveValue("Open");
  });

  it("shows a generic status error for non-API failures", async () => {
    const user = userEvent.setup();
    updateTicket.mockRejectedValue(new Error("boom"));

    renderDetailPage();

    await screen.findByText("Cannot log in");
    await user.selectOptions(screen.getByLabelText(/^status$/i), "In Progress");

    expect(
      await screen.findByText(/failed to update status\. please try again/i)
    ).toBeInTheDocument();
  });

  it("shows inline status field error in edit mode when transition fails", async () => {
    const user = userEvent.setup();
    updateTicket.mockRejectedValue(
      new ApiError(400, "Cannot transition from Open to Cancelled", [
        {
          field: "status",
          message: "Cannot transition from Open to Cancelled",
        },
      ])
    );

    renderDetailPage();

    await screen.findByText("Cannot log in");
    await user.click(screen.getByRole("button", { name: /edit ticket/i }));
    await waitFor(() => {
      expect(listUsers).toHaveBeenCalled();
    });

    const statusSelects = screen.getAllByLabelText(/^status$/i);
    await user.selectOptions(statusSelects[statusSelects.length - 1], "Cancelled");
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      expect(document.getElementById("edit-status-error")).toHaveTextContent(
        "Cannot transition from Open to Cancelled"
      );
    });
    expect(screen.getByRole("button", { name: /save changes/i })).toBeInTheDocument();
  });

  it("keeps status dropdown available for terminal tickets", async () => {
    getTicket.mockResolvedValue({
      ...mockTicket,
      status: "Closed",
    });

    renderDetailPage();

    await screen.findByText("Closed");
    expect(screen.getByLabelText(/^status$/i)).toHaveValue("Closed");
    expect(screen.getByRole("option", { name: "Closed" })).toBeEnabled();
    expect(screen.getByRole("option", { name: "Open" })).toBeDisabled();
  });

  it("renders comments in chronological order with author and timestamp", async () => {
    listComments.mockResolvedValue([
      {
        id: "comment-1",
        message: "First comment",
        createdBy: { id: mockUsers[0].id, name: mockUsers[0].name },
        createdAt: "2026-07-23T09:00:00.000Z",
        updatedAt: "2026-07-23T09:00:00.000Z",
      },
      {
        id: "comment-2",
        message: "Second comment",
        createdBy: { id: mockUsers[1].id, name: mockUsers[1].name },
        createdAt: "2026-07-23T10:00:00.000Z",
        updatedAt: "2026-07-23T10:00:00.000Z",
      },
    ]);

    renderDetailPage();

    expect(await screen.findByText("First comment")).toBeInTheDocument();
    expect(screen.getByText("Second comment")).toBeInTheDocument();

    const commentItems = document.querySelectorAll(".ticket-comment-item");
    expect(commentItems).toHaveLength(2);
    expect(commentItems[0]).toHaveTextContent("First comment");
    expect(commentItems[0]).toHaveTextContent("Alice Johnson");
    expect(commentItems[1]).toHaveTextContent("Second comment");
    expect(commentItems[1]).toHaveTextContent("Bob Smith");
  });

  it("adds a comment and appends it to the list without reloading", async () => {
    const user = userEvent.setup();
    addComment.mockResolvedValue({
      id: "comment-new",
      message: "New follow-up",
      createdBy: { id: mockUsers[0].id, name: mockUsers[0].name },
      createdAt: "2026-07-23T11:00:00.000Z",
      updatedAt: "2026-07-23T11:00:00.000Z",
    });

    renderDetailPage();

    await screen.findByRole("heading", { name: /^comments$/i });
    await user.type(screen.getByLabelText(/add a comment/i), "New follow-up");
    await user.click(screen.getByRole("button", { name: /post comment/i }));

    await waitFor(() => {
      expect(addComment).toHaveBeenCalledWith(mockTicket.id, {
        message: "New follow-up",
      });
    });

    expect(await screen.findByText("New follow-up")).toBeInTheDocument();
    expect(screen.getByLabelText(/add a comment/i)).toHaveValue("");
  });

  it("shows client-side validation error for empty comment", async () => {
    const user = userEvent.setup();
    renderDetailPage();

    await screen.findByRole("heading", { name: /^comments$/i });
    await user.click(screen.getByRole("button", { name: /post comment/i }));

    expect(await screen.findByText("Message is required")).toBeInTheDocument();
    expect(addComment).not.toHaveBeenCalled();
  });

  it("limits comment input to the API max length", async () => {
    renderDetailPage();

    const commentField = await screen.findByLabelText(/add a comment/i);
    expect(commentField).toHaveAttribute("maxLength", "5000");
  });

  it("shows client-side validation when a comment exceeds the max length", async () => {
    const user = userEvent.setup();
    renderDetailPage();

    const commentField = await screen.findByLabelText(/add a comment/i);
    fireEvent.change(commentField, {
      target: { value: "x".repeat(5001) },
    });
    await user.click(screen.getByRole("button", { name: /post comment/i }));

    expect(
      await screen.findByText(/message must be at most 5000 characters/i)
    ).toBeInTheDocument();
    expect(addComment).not.toHaveBeenCalled();
  });

  it("shows a generic comment error for non-API failures", async () => {
    const user = userEvent.setup();
    addComment.mockRejectedValue(new Error("boom"));

    renderDetailPage();

    await screen.findByRole("heading", { name: /^comments$/i });
    await user.type(screen.getByLabelText(/add a comment/i), "Follow-up note");
    await user.click(screen.getByRole("button", { name: /post comment/i }));

    expect(
      await screen.findByText(/failed to add comment\. please try again/i)
    ).toBeInTheDocument();
  });

  it("shows a generic assignee error for non-API failures", async () => {
    const user = userEvent.setup();
    updateTicket.mockRejectedValue(new Error("boom"));

    renderDetailPage();

    await screen.findByText("Cannot log in");
    await user.selectOptions(screen.getByLabelText(/assignee/i), mockUsers[1].id);

    expect(
      await screen.findByText(/failed to update assignee\. please try again/i)
    ).toBeInTheDocument();
  });

  it("displays API validation error when comment submission fails", async () => {
    const user = userEvent.setup();
    addComment.mockRejectedValue(
      new ApiError(400, "Validation failed", [
        { field: "message", message: "message is required" },
      ])
    );

    renderDetailPage();

    await screen.findByRole("heading", { name: /^comments$/i });
    await user.type(screen.getByLabelText(/add a comment/i), "Server rejected this");
    await user.click(screen.getByRole("button", { name: /post comment/i }));

    expect(await screen.findByText("Validation failed")).toBeInTheDocument();
    expect(screen.getByText("message is required")).toBeInTheDocument();
    expect(screen.getByLabelText(/add a comment/i)).toHaveValue(
      "Server rejected this"
    );
  });

  it("shows inline error when comment list fails to load but ticket loads", async () => {
    listComments.mockRejectedValue(new ApiError(500, "Internal server error"));

    renderDetailPage();

    expect(await screen.findByText("Cannot log in")).toBeInTheDocument();
    expect(await screen.findByText(ERROR_MESSAGES.SERVER)).toBeInTheDocument();
    expect(screen.getByLabelText(/add a comment/i)).toBeInTheDocument();
  });
});
