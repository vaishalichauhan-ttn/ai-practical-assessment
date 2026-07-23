import type { Request, Response, NextFunction } from "express";
import { userService } from "../services/userService.js";

/**
 * Returns the list of seeded users for assignee selection.
 */
export async function listUsers(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const users = await userService.list();
    res.status(200).json(users);
  } catch (error) {
    next(error);
  }
}
