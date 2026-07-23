import { Router } from "express";
import {
  createTicket,
  getTicket,
  listTickets,
} from "../controllers/ticketController.js";
import { requestContext } from "../middleware/requestContext.js";
import { validateJsonBody } from "../middleware/validateRequest.js";

const router = Router();

router.get("/", listTickets);
router.post("/", requestContext, validateJsonBody, createTicket);
router.get("/:id", getTicket);

export default router;
