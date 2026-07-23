import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ApiError, ERROR_MESSAGES, NetworkError } from "../api/client.js";
import CreateTicketModal from "./CreateTicketModal.jsx";

vi.mock("../api/tickets.js", () => ({
  createTicket: vi.fn(),
}));

import { createTicket } from "../api/tickets.js";

function renderModal(props = {}) {
  const onClose = props.onClose ?? vi.fn();
  const onCreated = props.onCreated ?? vi.fn();

  return {
    onClose,
    onCreated,
    ...render(
      <CreateTicketModal
        isOpen={props.isOpen ?? true}
        onClose={onClose}
        onCreated={onCreated}
      />
    ),
  };
}

describe("CreateTicketModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing when closed", () => {
    const { container } = render(
      <CreateTicketModal isOpen={false} onClose={vi.fn()} onCreated={vi.fn()} />
    );

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders the create ticket form when open", () => {
    renderModal();

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /create ticket/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/^title$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^description$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^priority$/i)).toBeInTheDocument();
  });

  it("shows client-side validation errors for empty required fields", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole("button", { name: /^create ticket$/i }));

    expect(screen.getByText("Title is required")).toBeInTheDocument();
    expect(screen.getByText("Description is required")).toBeInTheDocument();
    expect(screen.getByText("Priority is required")).toBeInTheDocument();
    expect(createTicket).not.toHaveBeenCalled();
  });

  it("clears a field error when the user edits that field", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole("button", { name: /^create ticket$/i }));
    expect(screen.getByText("Title is required")).toBeInTheDocument();

    await user.type(screen.getByLabelText(/^title$/i), "New ticket");

    expect(screen.queryByText("Title is required")).not.toBeInTheDocument();
    expect(screen.getByText("Description is required")).toBeInTheDocument();
  });

  it("submits a valid ticket and closes on success", async () => {
    const user = userEvent.setup();
    const createdTicket = {
      id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
      title: "Cannot print",
      description: "Printer jammed",
      priority: "High",
      status: "Open",
    };
    createTicket.mockResolvedValue(createdTicket);

    const { onClose, onCreated } = renderModal();

    await user.type(screen.getByLabelText(/^title$/i), "Cannot print");
    await user.type(screen.getByLabelText(/^description$/i), "Printer jammed");
    await user.selectOptions(screen.getByLabelText(/^priority$/i), "High");
    await user.click(screen.getByRole("button", { name: /^create ticket$/i }));

    await waitFor(() => {
      expect(createTicket).toHaveBeenCalledWith({
        title: "Cannot print",
        description: "Printer jammed",
        priority: "High",
      });
    });

    expect(onCreated).toHaveBeenCalledWith(createdTicket);
    expect(onClose).toHaveBeenCalled();
  });

  it("shows field-level API validation errors", async () => {
    const user = userEvent.setup();
    createTicket.mockRejectedValue(
      new ApiError(400, "Validation failed", [
        { field: "title", message: "title must be at most 200 characters" },
        { field: "body", message: "ignored body-level detail" },
      ])
    );

    renderModal();

    await user.type(screen.getByLabelText(/^title$/i), "Too long title");
    await user.type(screen.getByLabelText(/^description$/i), "Details");
    await user.selectOptions(screen.getByLabelText(/^priority$/i), "Low");
    await user.click(screen.getByRole("button", { name: /^create ticket$/i }));

    expect(
      await screen.findByText("title must be at most 200 characters")
    ).toBeInTheDocument();
    expect(screen.getByText("Validation failed")).toBeInTheDocument();
  });

  it("shows a network error banner when create fails offline", async () => {
    const user = userEvent.setup();
    createTicket.mockRejectedValue(new NetworkError());

    renderModal();

    await user.type(screen.getByLabelText(/^title$/i), "Offline ticket");
    await user.type(screen.getByLabelText(/^description$/i), "Details");
    await user.selectOptions(screen.getByLabelText(/^priority$/i), "Medium");
    await user.click(screen.getByRole("button", { name: /^create ticket$/i }));

    expect(await screen.findByText(ERROR_MESSAGES.NETWORK)).toBeInTheDocument();
  });

  it("closes when Cancel or the close button is clicked", async () => {
    const user = userEvent.setup();
    const { onClose } = renderModal();

    await user.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onClose).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: /close/i }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("closes when Escape is pressed", async () => {
    const user = userEvent.setup();
    const { onClose } = renderModal();

    await user.keyboard("{Escape}");

    expect(onClose).toHaveBeenCalled();
  });

  it("closes when the backdrop is clicked", async () => {
    const user = userEvent.setup();
    const { onClose } = renderModal();

    await user.click(document.querySelector(".modal-backdrop"));

    expect(onClose).toHaveBeenCalled();
  });

  it("does not close when the dialog content is clicked", async () => {
    const user = userEvent.setup();
    const { onClose } = renderModal();

    await user.click(screen.getByRole("dialog"));

    expect(onClose).not.toHaveBeenCalled();
  });

  it("resets form state when reopened after closing", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onCreated = vi.fn();
    const { rerender } = render(
      <CreateTicketModal isOpen onClose={onClose} onCreated={onCreated} />
    );

    await user.type(screen.getByLabelText(/^title$/i), "Draft title");
    rerender(
      <CreateTicketModal isOpen={false} onClose={onClose} onCreated={onCreated} />
    );
    rerender(
      <CreateTicketModal isOpen onClose={onClose} onCreated={onCreated} />
    );

    expect(screen.getByLabelText(/^title$/i)).toHaveValue("");
    expect(screen.getByLabelText(/^description$/i)).toHaveValue("");
    expect(screen.getByLabelText(/^priority$/i)).toHaveValue("");
  });
});
