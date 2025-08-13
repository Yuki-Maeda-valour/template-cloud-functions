import type { HttpFunction } from "@google-cloud/functions-framework/build/src/functions.js";
import { logger } from "../utils/logger.js";

/**
 * Main function - Development mode only
 */
export const main: HttpFunction = async (req, res) => {
  logger.info("Main function called", { method: req.method, url: req.url });

  // 開発環境用のシンプルなレスポンス
  res.json({
    success: true,
    message: "Development mode - Google APIs disabled",
    environment: "development",
    timestamp: new Date().toISOString(),
    request: {
      method: req.method,
      url: req.url,
      query: req.query,
      headers: req.headers,
    }
  });
};

// 後方互換性のため sampleFunction もエクスポート
export const sampleFunction = main;
