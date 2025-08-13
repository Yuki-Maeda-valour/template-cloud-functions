import type { EnvironmentVariables } from "../types/environment.js";

function validateEnvironment(): EnvironmentVariables {
  // Consider development-like only for explicit "development"
  const isDevLike = process.env.NODE_ENV === "development";

  // 開発環境では必須環境変数のチェックを緩和
  const requiredEnvVars = isDevLike
    ? ["NODE_ENV"]
    : ([
        "GOOGLE_CLOUD_PROJECT_ID",
        "GOOGLE_APPLICATION_CREDENTIALS",
        "OAUTH2_CLIENT_ID",
        "OAUTH2_CLIENT_SECRET",
        "OAUTH2_REDIRECT_URI",
        "FUNCTION_TARGET",
        "PORT",
        "NODE_ENV",
      ] as const);

  const missingVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

  if (missingVars.length > 0) {
    if (isDevLike) {
      console.warn(
        `Warning: Missing environment variables in development: ${missingVars.join(", ")}`
      );
      console.warn("Using default values for development...");
    } else {
      throw new Error(
        `Missing required environment variables: ${missingVars.join(", ")}. ` +
          "Please check your .env file."
      );
    }
  }

  // 開発環境用のデフォルト値を設定
  const env = {
    ...process.env,
    GOOGLE_CLOUD_PROJECT_ID: process.env.GOOGLE_CLOUD_PROJECT_ID || "dev-project",
    GOOGLE_APPLICATION_CREDENTIALS: process.env.GOOGLE_APPLICATION_CREDENTIALS || "",
    OAUTH2_CLIENT_ID: process.env.OAUTH2_CLIENT_ID || "dev-client-id",
    OAUTH2_CLIENT_SECRET: process.env.OAUTH2_CLIENT_SECRET || "dev-client-secret",
    OAUTH2_REDIRECT_URI: process.env.OAUTH2_REDIRECT_URI || "http://localhost:8080",
    FUNCTION_TARGET: process.env.FUNCTION_TARGET || "main",
    PORT: process.env.PORT || "8080",
    NODE_ENV: (process.env.NODE_ENV as EnvironmentVariables["NODE_ENV"]) || "development",
  };

  return env as EnvironmentVariables;
}

export const config = validateEnvironment();

export const GOOGLE_API_SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/drive.readonly",
  "https://www.googleapis.com/auth/spreadsheets.readonly",
];
