import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "./App.jsx";

vi.mock("./api/tickets.js", () => ({
  listTickets: vi.fn().mockResolvedValue([]),
  getTicket: vi.fn(),
  createTicket: vi.fn(),
  updateTicket: vi.fn(),
}));

vi.mock("./api/client.js", async () => {
  const actual = await vi.importActual("./api/client.js");
  return {
    ...actual,
    getHealth: vi.fn().mockResolvedValue({ status: "ok" }),
  };
});

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

  it("redirects the root path to tickets", async () => {
    renderApp("/");

    await waitFor(() => {
      expect(screen.getByText(/no tickets yet/i)).toBeInTheDocument();
    });
  });

  it("renders the home page route", async () => {
    renderApp("/home");

    expect(
      await screen.findByRole("heading", { name: /welcome/i })
    ).toBeInTheDocument();
    expect(await screen.findByText(/backend status: ok/i)).toBeInTheDocument();
  });
});
