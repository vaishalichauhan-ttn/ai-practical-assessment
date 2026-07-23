import { Router } from "express";
import { getHealth } from "../controllers/healthController.js";
import ticketRoutes from "./tickets.js";

const router = Router();

router.get("/health", getHealth);
router.use("/tickets", ticketRoutes);

export default router;
