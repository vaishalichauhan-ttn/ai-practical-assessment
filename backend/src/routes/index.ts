import { Router } from "express";
import { getHealth } from "../controllers/healthController.js";
import ticketRoutes from "./tickets.js";
import userRoutes from "./users.js";

const router = Router();

router.get("/health", getHealth);
router.use("/users", userRoutes);
router.use("/tickets", ticketRoutes);

export default router;
