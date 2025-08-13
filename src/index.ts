import { http } from "@google-cloud/functions-framework";
import { main } from "./functions/sample.js";
import { config } from "./utils/config.js";
import { logger } from "./utils/logger.js";

// Register HTTP function
http("main", main);

logger.info("Cloud Functions initialized", {
  target: config.FUNCTION_TARGET,
  port: config.PORT,
  nodeEnv: config.NODE_ENV,
});
