const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

export const ERROR_MESSAGES = {
  NETWORK:
    "Unable to connect to the server. Check your network connection and try again.",
  SERVER: "Something went wrong on our end. Please try again later.",
  GENERIC: "Request failed. Please try again.",
};

export class ApiError extends Error {
  constructor(status, message, details = []) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

export class NetworkError extends Error {
  constructor(message = ERROR_MESSAGES.NETWORK) {
    super(message);
    this.name = "NetworkError";
  }
}

/**
 * Returns a user-safe message for API and network failures.
 *
 * @param err The caught error from an API call.
 * @param fallback Message used for unknown error types.
 * @returns A message safe to display in the UI.
 */
export function getErrorMessage(err, fallback = ERROR_MESSAGES.GENERIC) {
  if (err instanceof NetworkError) {
    return err.message;
  }

  if (err instanceof ApiError) {
    if (err.status === 503) {
      return err.message || fallback;
    }

    if (err.status >= 500) {
      return ERROR_MESSAGES.SERVER;
    }

    return err.message || fallback;
  }

  return fallback;
}

function normalizeApiErrorMessage(status, message) {
  if (status === 503) {
    return message;
  }

  if (status >= 500) {
    return ERROR_MESSAGES.SERVER;
  }

  return message;
}

async function parseResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  const hasJson = contentType.includes("application/json");
  let body = null;

  if (hasJson) {
    try {
      body = await response.json();
    } catch {
      body = null;
    }
  }

  if (!response.ok) {
    const rawMessage =
      body?.error || `Request failed with status ${response.status}`;
    const message = normalizeApiErrorMessage(response.status, rawMessage);
    const details = body?.details || [];
    throw new ApiError(response.status, message, details);
  }

  return body;
}

/**
 * Performs an authenticated JSON API request with global error handling.
 *
 * @param path API path relative to the configured base URL.
 * @param options Fetch options passed through to `fetch`.
 * @returns Parsed JSON response body.
 * @throws {NetworkError} When the request cannot reach the server.
 * @throws {ApiError} When the API returns a non-success response.
 */
export async function apiRequest(path, options = {}) {
  let response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });
  } catch {
    throw new NetworkError();
  }

  return parseResponse(response);
}

export function getHealth() {
  return apiRequest("/api/health");
}
