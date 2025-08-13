import "dotenv/config";
import type { EnvironmentVariables } from "../types/environment.js";

function validateEnvironment(): EnvironmentVariables {
  const requiredEnvVars = [
    "GOOGLE_CLOUD_PROJECT_ID",
    "GOOGLE_APPLICATION_CREDENTIALS",
    "OAUTH2_CLIENT_ID",
    "OAUTH2_CLIENT_SECRET",
    "OAUTH2_REDIRECT_URI",
    "FUNCTION_TARGET",
    "PORT",
    "NODE_ENV",
  ] as const;

  const missingVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(", ")}. ` +
        "Please check your .env file."
    );
  }

  return process.env as EnvironmentVariables;
}

export const config = validateEnvironment();

export const GOOGLE_API_SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/drive.readonly",
  "https://www.googleapis.com/auth/spreadsheets.readonly",
];
