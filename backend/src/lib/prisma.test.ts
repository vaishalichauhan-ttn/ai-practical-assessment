import { describe, it, expect, vi, afterEach } from "vitest";
import { prisma, checkDatabaseConnection } from "./prisma.js";

describe("checkDatabaseConnection", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns true when the database responds", async () => {
    await expect(checkDatabaseConnection()).resolves.toBe(true);
  });

  it("returns false when the database query fails", async () => {
    vi.spyOn(prisma, "$queryRaw").mockRejectedValueOnce(
      new Error("connection refused")
    );

    await expect(checkDatabaseConnection()).resolves.toBe(false);
  });
});
