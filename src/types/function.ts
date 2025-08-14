export interface FunctionContext {
  functionName: string;
  requestId: string;
  timestamp: string;
  isLocal: boolean;
}

export interface FunctionResult {
  success: boolean;
  data?: any;
  error?: string;
  logs?: string[];
}

export interface FunctionConfig {
  name: string;
  description: string;
  schedule?: string;
  timeout?: number;
  memory?: number;
}

// 関数の標準インターフェース
export interface CloudFunction {
  config: FunctionConfig;
  handler: (data: any, context: FunctionContext) => Promise<FunctionResult>;
}
