import type { NextFunction, Request, Response } from "express";
import { AppError, toErrorResponse } from "../errors/AppError.js";
import { logUnexpectedError } from "../lib/logger.js";

const INTERNAL_SERVER_ERROR_MESSAGE = "Internal server error";

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json(toErrorResponse("Route not found"));
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logUnexpectedError(err, req);
      res.status(500).json(toErrorResponse(INTERNAL_SERVER_ERROR_MESSAGE));
      return;
    }

    res
      .status(err.statusCode)
      .json(toErrorResponse(err.message, err.details));
    return;
  }

  if (err instanceof SyntaxError && "body" in err) {
    res.status(400).json(
      toErrorResponse("Invalid JSON payload", [
        { field: "body", message: "Request body must be valid JSON" },
      ])
    );
    return;
  }

  logUnexpectedError(err, req);

  res.status(500).json(toErrorResponse(INTERNAL_SERVER_ERROR_MESSAGE));
}
