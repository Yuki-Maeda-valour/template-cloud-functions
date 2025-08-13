import { beforeEach, describe, expect, it, vi } from "vitest";

describe("Config module", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("should validate required environment variables", async () => {
    // Mock environment variables
    vi.stubEnv("GOOGLE_CLOUD_PROJECT_ID", "test-project");
    vi.stubEnv("GOOGLE_APPLICATION_CREDENTIALS", "./test-credentials.json");
    vi.stubEnv("OAUTH2_CLIENT_ID", "test-client-id");
    vi.stubEnv("OAUTH2_CLIENT_SECRET", "test-client-secret");
    vi.stubEnv("OAUTH2_REDIRECT_URI", "http://localhost:8080/oauth2callback");
    vi.stubEnv("FUNCTION_TARGET", "main");
    vi.stubEnv("PORT", "8080");
    vi.stubEnv("NODE_ENV", "test");

    const { config } = await import("../config.js");

    expect(config.GOOGLE_CLOUD_PROJECT_ID).toBe("test-project");
    expect(config.NODE_ENV).toBe("test");
    expect(config.PORT).toBe("8080");
  });

  it("should throw error for missing environment variables", async () => {
    // Clear all environment variables
    vi.unstubAllEnvs();

    await expect(async () => {
      await import("../config.js");
    }).rejects.toThrow("Missing required environment variables");
  });
});
