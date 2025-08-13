import { beforeEach, describe, expect, it, vi } from "vitest";
import { OAuth2Manager } from "../oauth2.js";

// Mock googleapis
vi.mock("googleapis", () => ({
  google: {
    auth: {
      OAuth2: vi.fn().mockImplementation(() => ({
        generateAuthUrl: vi.fn(() => "https://accounts.google.com/oauth/authorize?mock=url"),
        getToken: vi.fn(() =>
          Promise.resolve({
            tokens: {
              access_token: "mock-access-token",
              refresh_token: "mock-refresh-token",
              scope: "mock-scope",
              token_type: "Bearer",
            },
          })
        ),
        setCredentials: vi.fn(),
        refreshAccessToken: vi.fn(() =>
          Promise.resolve({
            credentials: {
              access_token: "new-access-token",
              refresh_token: "mock-refresh-token",
            },
          })
        ),
        credentials: {
          access_token: "mock-access-token",
          refresh_token: "mock-refresh-token",
          scope: "mock-scope",
          token_type: "Bearer",
        },
      })),
    },
    oauth2: vi.fn(() => ({
      userinfo: {
        get: vi.fn(() =>
          Promise.resolve({
            data: {
              id: "mock-user-id",
              email: "test@example.com",
              name: "Test User",
            },
          })
        ),
      },
    })),
  },
}));

// Mock config
vi.mock("../utils/config.js", () => ({
  config: {
    OAUTH2_CLIENT_ID: "mock-client-id",
    OAUTH2_CLIENT_SECRET: "mock-client-secret",
    OAUTH2_REDIRECT_URI: "http://localhost:8080/oauth2callback",
  },
  GOOGLE_API_SCOPES: [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/drive.readonly",
    "https://www.googleapis.com/auth/spreadsheets.readonly",
  ],
}));

describe("OAuth2Manager", () => {
  let oauth2Manager: OAuth2Manager;

  beforeEach(() => {
    oauth2Manager = new OAuth2Manager();
  });

  it("should generate auth URL", () => {
    const authUrl = oauth2Manager.generateAuthUrl();
    expect(authUrl).toBe("https://accounts.google.com/oauth/authorize?mock=url");
  });

  it("should exchange code for tokens", async () => {
    const tokens = await oauth2Manager.getTokens("mock-auth-code");

    expect(tokens).toEqual({
      access_token: "mock-access-token",
      refresh_token: "mock-refresh-token",
      scope: "mock-scope",
      token_type: "Bearer",
    });
  });

  it("should get user info", async () => {
    const userInfo = await oauth2Manager.getUserInfo();

    expect(userInfo).toEqual({
      id: "mock-user-id",
      email: "test@example.com",
      name: "Test User",
      tokens: expect.any(Object),
    });
  });
});
