import type { HttpFunction } from "@google-cloud/functions-framework/build/src/functions.js";
import { logger } from "../utils/logger.js";
import { createRequestInfo, sendError, sendSuccess } from "../utils/response.js";

/**
 * Another function endpoint
 */
export const anotherFunction: HttpFunction = async (req, res) => {
  logger.info("Another function called", { method: req.method, url: req.url });

  try {
    sendSuccess(
      res,
      "Another function endpoint",
      { environment: "development" },
      createRequestInfo(req)
    );
  } catch (error) {
    sendError(res, "Internal server error", error);
  }
};
