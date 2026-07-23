import express from "express";
import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import { AppError } from "./errors/AppError.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { expectErrorShape } from "./test/errorShape.js";

function createTestApp() {
  const app = express();

  app.get("/api/boom", () => {
    throw new Error("Database connection pool exhausted");
  });

  app.get("/api/app-error", () => {
    throw new AppError(500, "Prisma query failed: relation does not exist");
  });

  app.use(errorHandler);

  return app;
}

describe("Task 7.2 — prevent stack trace leakage", () => {
  it("returns a generic 500 response for unexpected errors", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const app = createTestApp();

    const response = await request(app).get("/api/boom");

    expect(response.status).toBe(500);
    expectErrorShape(response.body);
    expect(response.body).toEqual({ error: "Internal server error" });
    expect(JSON.stringify(response.body)).not.toContain("stack");
    expect(JSON.stringify(response.body)).not.toContain(
      "Database connection pool exhausted"
    );

    const loggedOutput = consoleError.mock.calls.flat().join(" ");
    expect(loggedOutput).toContain("GET /api/boom");
    expect(loggedOutput).toContain("Database connection pool exhausted");
    expect(loggedOutput).toContain("at ");

    consoleError.mockRestore();
  });

  it("returns a generic 500 response for AppError instances with status 500", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const app = createTestApp();

    const response = await request(app).get("/api/app-error");

    expect(response.status).toBe(500);
    expectErrorShape(response.body);
    expect(response.body).toEqual({ error: "Internal server error" });
    expect(JSON.stringify(response.body)).not.toContain("Prisma");
    expect(JSON.stringify(response.body)).not.toContain("stack");

    const loggedOutput = consoleError.mock.calls.flat().join(" ");
    expect(loggedOutput).toContain("Prisma query failed");

    consoleError.mockRestore();
  });
});
