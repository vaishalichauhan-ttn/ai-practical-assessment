import { expect } from "vitest";

const ALLOWED_TOP_LEVEL_KEYS = new Set(["error", "details"]);

/**
 * Asserts that an API error response matches the global contract shape.
 */
export function expectErrorShape(body: unknown): void {
  expect(body).toBeTypeOf("object");
  expect(body).not.toBeNull();

  const response = body as Record<string, unknown>;

  expect(response).toHaveProperty("error");
  expect(typeof response.error).toBe("string");
  expect((response.error as string).length).toBeGreaterThan(0);

  if ("details" in response) {
    expect(Array.isArray(response.details)).toBe(true);

    for (const detail of response.details as Array<Record<string, unknown>>) {
      expect(detail).toHaveProperty("message");
      expect(typeof detail.message).toBe("string");

      if ("field" in detail) {
        expect(typeof detail.field).toBe("string");
      }
    }
  }

  for (const key of Object.keys(response)) {
    expect(ALLOWED_TOP_LEVEL_KEYS.has(key)).toBe(true);
  }
}
