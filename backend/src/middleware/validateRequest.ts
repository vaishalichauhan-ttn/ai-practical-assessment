import express, { type Request, type Response, type NextFunction } from "express";
import { ValidationError } from "../errors/AppError.js";

export const jsonParser = express.json({
  limit: "1mb",
});

export function validateJsonBody(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  if (req.method === "GET" || req.method === "HEAD" || req.method === "DELETE") {
    next();
    return;
  }

  if (req.body === undefined || req.body === null) {
    next(
      new ValidationError("Request body is required", [
        { field: "body", message: "Request body must be a JSON object" },
      ])
    );
    return;
  }

  if (typeof req.body !== "object" || Array.isArray(req.body)) {
    next(
      new ValidationError("Invalid request body", [
        { field: "body", message: "Request body must be a JSON object" },
      ])
    );
    return;
  }

  next();
}
