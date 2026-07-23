import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Express, RequestHandler } from "express";
import swaggerUi from "swagger-ui-express";
import { parse as parseYaml } from "yaml";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Absolute path to the OpenAPI YAML derived from `api-contract.md`.
 * Resolves correctly from both `src/` (tsx) and `dist/` (compiled).
 */
const OPENAPI_SPEC_PATH = path.resolve(__dirname, "../../docs/openapi.yaml");

/**
 * Loads and parses the OpenAPI specification from disk.
 *
 * @returns Parsed OpenAPI document object.
 * @throws Error When the YAML file cannot be read or parsed.
 */
export function loadOpenApiDocument(): Record<string, unknown> {
  const raw = readFileSync(OPENAPI_SPEC_PATH, "utf8");
  return parseYaml(raw) as Record<string, unknown>;
}

/**
 * Mounts Swagger UI and the raw OpenAPI JSON on the Express application.
 *
 * - UI: `GET /api-docs`
 * - Spec JSON: `GET /api-docs.json`
 *
 * @param app Express application instance.
 */
export function setupSwagger(app: Express): void {
  const openApiDocument = loadOpenApiDocument();

  const serveOpenApiJson: RequestHandler = (_req, res) => {
    res.json(openApiDocument);
  };

  app.get("/api-docs.json", serveOpenApiJson);
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(openApiDocument, {
      customSiteTitle: "Support Ticket API Docs",
      swaggerOptions: {
        url: "/api-docs.json",
        persistAuthorization: false,
      },
    })
  );
}
