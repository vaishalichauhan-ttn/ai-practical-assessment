import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response } from "express";
import { getHealth } from "./healthController.js";

vi.mock("../lib/prisma.js", () => ({
  checkDatabaseConnection: vi.fn(),
}));

import { checkDatabaseConnection } from "../lib/prisma.js";

function createMockResponse() {
  const res = {
    statusCode: 0,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
  };
  return res as Response & { statusCode: number; body: unknown };
}

describe("getHealth", () => {
  beforeEach(() => {
    vi.mocked(checkDatabaseConnection).mockReset();
  });

  it("returns 200 when the database is connected", async () => {
    vi.mocked(checkDatabaseConnection).mockResolvedValue(true);
    const res = createMockResponse();

    await getHealth({} as Request, res);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });

  it("returns 503 when the database is unavailable", async () => {
    vi.mocked(checkDatabaseConnection).mockResolvedValue(false);
    const res = createMockResponse();

    await getHealth({} as Request, res);

    expect(res.statusCode).toBe(503);
    expect(res.body).toEqual({
      status: "error",
      error: "Database connection unavailable",
    });
  });
});
