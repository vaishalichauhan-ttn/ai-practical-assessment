import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { ERROR_MESSAGES, NetworkError } from "../api/client.js";
import HomePage from "./HomePage.jsx";

vi.mock("../api/client.js", async () => {
  const actual = await vi.importActual("../api/client.js");
  return {
    ...actual,
    getHealth: vi.fn(),
  };
});

import { getHealth } from "../api/client.js";

describe("HomePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows a loading message while checking API health", () => {
    getHealth.mockImplementation(() => new Promise(() => {}));

    render(<HomePage />);

    expect(screen.getByText(/checking backend health/i)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /welcome/i })
    ).toBeInTheDocument();
  });

  it("displays backend status when the health check succeeds", async () => {
    getHealth.mockResolvedValue({ status: "ok" });

    render(<HomePage />);

    expect(await screen.findByText(/backend status: ok/i)).toBeInTheDocument();
    expect(screen.queryByText(/checking backend health/i)).not.toBeInTheDocument();
  });

  it("displays an error when the health check fails", async () => {
    getHealth.mockRejectedValue(new NetworkError());

    render(<HomePage />);

    expect(
      await screen.findByText(
        new RegExp(`Backend unavailable: ${ERROR_MESSAGES.NETWORK}`, "i")
      )
    ).toBeInTheDocument();
  });

  it("ignores health responses after unmount", async () => {
    let resolveHealth;
    getHealth.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveHealth = resolve;
        })
    );

    const { unmount } = render(<HomePage />);
    unmount();

    resolveHealth({ status: "ok" });

    await waitFor(() => {
      expect(getHealth).toHaveBeenCalled();
    });

    expect(screen.queryByText(/backend status/i)).not.toBeInTheDocument();
  });
});
