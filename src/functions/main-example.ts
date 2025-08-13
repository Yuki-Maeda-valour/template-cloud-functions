import type { HttpFunction } from "@google-cloud/functions-framework/build/src/functions.js";
import { logger } from "../utils/logger.js";
import { createRequestInfo, sendError, sendSuccess } from "../utils/response.js";

/**
 * Main example function - handles /main/example endpoint
 */
export const mainExample: HttpFunction = async (req, res) => {
  logger.info("Main example function called", { method: req.method, url: req.url });

  try {
    // パスパラメータを取得
    const path = req.url || req.path || "";
    const pathParts = path.split("/").filter(Boolean);

    // /main/example の場合、pathParts = ["main", "example"]
    const exampleParam = pathParts[1]; // "example"

    sendSuccess(
      res,
      "Main example endpoint",
      {
        environment: "development",
        path: path,
        exampleParam: exampleParam,
        pathParts: pathParts,
      },
      createRequestInfo(req)
    );
  } catch (error) {
    sendError(res, "Internal server error", error);
  }
};
