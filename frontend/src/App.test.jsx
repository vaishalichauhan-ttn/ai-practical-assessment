import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "./App.jsx";

vi.mock("./api/tickets.js", () => ({
  listTickets: vi.fn().mockResolvedValue([]),
  getTicket: vi.fn(),
  createTicket: vi.fn(),
}));

function renderApp(initialRoute = "/tickets") {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <App />
    </MemoryRouter>
  );
}

describe("App", () => {
  it("renders the application header and navigation", async () => {
    renderApp();

    expect(
      screen.getByRole("heading", { name: /support ticket management/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /tickets/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /home/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/no tickets yet/i)).toBeInTheDocument();
    });
  });
});
