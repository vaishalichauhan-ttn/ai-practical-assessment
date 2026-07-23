import express from "express";
import cors from "cors";
import apiRoutes from "./routes/index.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { jsonParser } from "./middleware/validateRequest.js";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(jsonParser);
  app.use("/api", apiRoutes);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
