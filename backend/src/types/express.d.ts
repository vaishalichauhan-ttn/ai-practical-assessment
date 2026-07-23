import type { RequestContext } from "./requestContext.js";

declare global {
  namespace Express {
    interface Request {
      context?: RequestContext;
    }
  }
}

export {};
