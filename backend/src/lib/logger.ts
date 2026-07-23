import type { Request } from "express";

function formatRequestContext(req?: Request): string {
  if (!req) {
    return "unknown request";
  }

  let context = `${req.method} ${req.path}`;
  const params = req.params ?? {};
  const query = req.query ?? {};

  if (Object.keys(params).length > 0) {
    context += ` params=${JSON.stringify(params)}`;
  }

  if (Object.keys(query).length > 0) {
    context += ` query=${JSON.stringify(query)}`;
  }

  return context;
}

/**
 * Logs unexpected server errors with full details for server-side diagnostics.
 * Stack traces are written to logs only and must never be sent to API clients.
 *
 * @param err The unhandled error to log.
 * @param req Optional request context for method, path, params, and query.
 */
export function logUnexpectedError(err: unknown, req?: Request): void {
  const context = formatRequestContext(req);

  if (err instanceof Error) {
    console.error(`Unhandled error [${context}]:`, err.message);
    if (err.stack) {
      console.error(err.stack);
    }
    return;
  }

  console.error(`Unhandled error [${context}]:`, err);
}
