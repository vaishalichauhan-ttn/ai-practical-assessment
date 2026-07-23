import { Router } from "express";
import { addComment, listComments } from "../controllers/commentController.js";
import {
  createTicket,
  getTicket,
  listTickets,
  updateTicket,
} from "../controllers/ticketController.js";
import { requestContext } from "../middleware/requestContext.js";
import { validateJsonBody } from "../middleware/validateRequest.js";

const router = Router();

router.get("/", listTickets);
router.post("/", requestContext, validateJsonBody, createTicket);
router.get("/:id", getTicket);
router.patch("/:id", validateJsonBody, updateTicket);
router.get("/:id/comments", listComments);
router.post("/:id/comments", requestContext, validateJsonBody, addComment);

export default router;
