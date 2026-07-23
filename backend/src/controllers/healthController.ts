import type { Request, Response } from "express";
import { checkDatabaseConnection } from "../lib/prisma.js";

export async function getHealth(_req: Request, res: Response): Promise<void> {
  const dbConnected = await checkDatabaseConnection();

  if (!dbConnected) {
    res.status(503).json({
      status: "error",
      error: "Database connection unavailable",
    });
    return;
  }

  res.status(200).json({ status: "ok" });
}
