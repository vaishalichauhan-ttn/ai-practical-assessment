import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "./app.js";
import { loadOpenApiDocument } from "./docs/swagger.js";

const app = createApp();

describe("Foundation smoke tests", () => {
  it("GET /api/health returns 200 when database is connected", async () => {
    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
  });

  it("GET /unknown returns 404 with consistent error shape", async () => {
    const response = await request(app).get("/api/unknown-route");

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("error");
    expect(typeof response.body.error).toBe("string");
  });

  it("POST with malformed JSON returns 400", async () => {
    const response = await request(app)
      .post("/api/health")
      .set("Content-Type", "application/json")
      .send("{ invalid json");

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toMatch(/json/i);
  });

  it("GET /api-docs serves Swagger UI", async () => {
    const response = await request(app).get("/api-docs/");

    expect(response.status).toBe(200);
    expect(response.text).toMatch(/swagger/i);
  });

  it("GET /api-docs.json returns OpenAPI document covering all contract endpoints", async () => {
    const response = await request(app).get("/api-docs.json");

    expect(response.status).toBe(200);
    expect(response.body.openapi).toMatch(/^3\./);

    const paths = response.body.paths as Record<
      string,
      Record<string, unknown>
    >;
    expect(paths["/health"]).toHaveProperty("get");
    expect(paths["/users"]).toHaveProperty("get");
    expect(paths["/tickets"]).toHaveProperty("get");
    expect(paths["/tickets"]).toHaveProperty("post");
    expect(paths["/tickets/{id}"]).toHaveProperty("get");
    expect(paths["/tickets/{id}"]).toHaveProperty("patch");
    expect(paths["/tickets/{id}/comments"]).toHaveProperty("get");
    expect(paths["/tickets/{id}/comments"]).toHaveProperty("post");
  });

  it("loadOpenApiDocument parses the YAML spec from disk", () => {
    const document = loadOpenApiDocument();

    expect(document).toHaveProperty("openapi");
    expect(document).toHaveProperty("paths");
  });
});
