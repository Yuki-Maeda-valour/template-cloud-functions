export interface FunctionResult {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
  logs?: string[];
}

export interface FunctionConfig {
  name: string;
  description: string;
  schedule?: string;
  timeout: number;
  memory: number;
}

export interface FunctionContext {
  functionName: string;
  requestId: string;
  timestamp: string;
  isLocal: boolean;
}

export interface CloudFunction {
  config: FunctionConfig;
  handler: (data: Record<string, unknown>, context: FunctionContext) => Promise<FunctionResult>;
}

export interface FunctionData {
  [key: string]: unknown;
}
