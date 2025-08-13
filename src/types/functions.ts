export type { HttpFunction } from "@google-cloud/functions-framework/build/src/functions.js";
/**
 * Function metadata for registration
 */
export interface FunctionMetadata {
  name: string;
  description: string;
  version: string;
  environment: string;
}

/**
 * Common function context
 */
export interface FunctionContext {
  functionName: string;
  environment: string;
  timestamp: string;
  requestId?: string;
}
