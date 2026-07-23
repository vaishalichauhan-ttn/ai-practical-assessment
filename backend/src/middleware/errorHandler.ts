import type { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/AppError.js";
import type { ErrorResponse } from "../errors/AppError.js";

export function notFoundHandler(_req: Request, res: Response): void {
  const body: ErrorResponse = {
    error: "Route not found",
  };
  res.status(404).json(body);
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    const body: ErrorResponse = {
      error: err.message,
    };

    if (err.details && err.details.length > 0) {
      body.details = err.details;
    }

    res.status(err.statusCode).json(body);
    return;
  }

  if (err instanceof SyntaxError && "body" in err) {
    const body: ErrorResponse = {
      error: "Invalid JSON payload",
      details: [{ field: "body", message: "Request body must be valid JSON" }],
    };
    res.status(400).json(body);
    return;
  }

  console.error("Unhandled error:", err);

  const body: ErrorResponse = {
    error: "Internal server error",
  };
  res.status(500).json(body);
}
