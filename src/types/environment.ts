export interface EnvironmentVariables {
  GOOGLE_CLOUD_PROJECT_ID: string;
  GOOGLE_APPLICATION_CREDENTIALS: string;
  OAUTH2_CLIENT_ID: string;
  OAUTH2_CLIENT_SECRET: string;
  OAUTH2_REDIRECT_URI: string;
  FUNCTION_TARGET: string;
  PORT: string;
  NODE_ENV: "development" | "production" | "test";
}

declare global {
  namespace NodeJS {
    interface ProcessEnv extends EnvironmentVariables {}
  }
}
