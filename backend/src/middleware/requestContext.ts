import type { NextFunction, Request, Response } from "express";
import { DEFAULT_USER_EMAIL } from "../constants/ticket.js";
import { ValidationError } from "../errors/AppError.js";
import { userRepository } from "../repositories/userRepository.js";
import { isValidUuid } from "../validators/uuid.js";

async function resolveDefaultUserId(): Promise<string> {
  const defaultUser = await userRepository.findByEmail(DEFAULT_USER_EMAIL);
  if (!defaultUser) {
    throw new Error(
      `Default user not found (${DEFAULT_USER_EMAIL}). Run database seed.`
    );
  }
  return defaultUser.id;
}

export async function requestContext(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const headerValue = req.header("X-User-Id");

    if (!headerValue) {
      const userId = await resolveDefaultUserId();
      req.context = { userId };
      next();
      return;
    }

    if (!isValidUuid(headerValue)) {
      next(
        new ValidationError("Validation failed", [
          { field: "X-User-Id", message: "Invalid user ID format" },
        ])
      );
      return;
    }

    const user = await userRepository.findById(headerValue);
    if (!user) {
      next(
        new ValidationError("Validation failed", [
          { field: "X-User-Id", message: "Invalid user ID" },
        ])
      );
      return;
    }

    req.context = { userId: user.id };
    next();
  } catch (error) {
    next(error);
  }
}
