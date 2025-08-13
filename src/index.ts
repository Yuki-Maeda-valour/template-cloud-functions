import { http } from "@google-cloud/functions-framework";
import { anotherFunction } from "./functions/another.js";
import { main } from "./functions/sample.js";
import { config } from "./utils/config.js";
import { logger } from "./utils/logger.js";

// Register HTTP functions as separate endpoints
http("main", main);
http("anotherfunction", anotherFunction);

logger.info("Cloud Functions initialized", {
  target: config.FUNCTION_TARGET,
  port: config.PORT,
  nodeEnv: config.NODE_ENV,
  endpoints: ["main", "anotherfunction"],
});
