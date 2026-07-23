import { describe, it, expect, vi, beforeEach } from "vitest";
import { listUsers } from "./users.js";

vi.mock("./client.js", () => ({
  apiRequest: vi.fn(),
}));

import { apiRequest } from "./client.js";

describe("listUsers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requests the users collection from the API", async () => {
    const users = [
      {
        id: "11111111-1111-1111-1111-111111111111",
        name: "Alice Johnson",
        email: "alice@example.com",
        role: "agent",
      },
    ];
    apiRequest.mockResolvedValue(users);

    await expect(listUsers()).resolves.toEqual(users);
    expect(apiRequest).toHaveBeenCalledWith("/api/users");
  });
});
