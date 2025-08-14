import express from 'express';
import FunctionRegistry from '../src/shared/utils/function-registry';
import type { FunctionContext } from '../src/types/function';
import Logger from '../src/shared/utils/logger';

const app = express();
const PORT = 8080;
const logger = new Logger('DevServer');

app.use(express.json());

// 開発用ダッシュボード
app.get('/', async (_req, res) => {
  await FunctionRegistry.loadFunctions();
  const functions = FunctionRegistry.getAllFunctions();
  
  const html = `
  <!DOCTYPE html>
  <html>
  <head>
      <title>Functions Development Dashboard</title>
      <style>
          body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
          .container { max-width: 800px; margin: 0 auto; }
          .header { background: #4285f4; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .function { background: white; margin: 10px 0; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .function-name { font-weight: bold; color: #1a73e8; margin-bottom: 5px; }
          .function-desc { color: #666; margin-bottom: 10px; }
          .test-btn { background: #34a853; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; }
          .test-btn:hover { background: #137333; }
          .result { margin-top: 10px; padding: 10px; border-radius: 4px; display: none; }
          .success { background: #d4edda; color: #155724; }
          .error { background: #f8d7da; color: #721c24; }
      </style>
  </head>
  <body>
      <div class="container">
          <div class="header">
              <h1>🚀 Functions Development Dashboard</h1>
              <p>Available Functions: ${functions.length}</p>
          </div>
          
          ${functions.map(func => `
              <div class="function">
                  <div class="function-name">${func.config.name}</div>
                  <div class="function-desc">${func.config.description}</div>
                  <button class="test-btn" onclick="testFunction('${func.config.name}')">
                      Test Function
                  </button>
                  <div id="result-${func.config.name}" class="result"></div>
              </div>
          `).join('')}
      </div>

      <script>
          async function testFunction(functionName) {
              const resultDiv = document.getElementById('result-' + functionName);
              resultDiv.style.display = 'block';
              resultDiv.className = 'result';
              resultDiv.textContent = 'Testing...';

              try {
                  const response = await fetch('/test/' + functionName, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ test: true })
                  });

                  const result = await response.json();
                  
                  if (result.success) {
                      resultDiv.className = 'result success';
                      resultDiv.textContent = 'Success! ' + JSON.stringify(result.data || 'OK');
                  } else {
                      resultDiv.className = 'result error';
                      resultDiv.textContent = 'Error: ' + (result.error || 'Unknown error');
                  }
              } catch (error) {
                  resultDiv.className = 'result error';
                  resultDiv.textContent = 'Request failed: ' + error.message;
              }
          }
      </script>
  </body>
  </html>
  `;
  
  res.send(html);
});

// 関数リスト取得
app.get('/functions', async (_req, res) => {
  await FunctionRegistry.loadFunctions();
  const functions = FunctionRegistry.getAllFunctions().map(f => ({
    name: f.config.name,
    description: f.config.description,
    schedule: f.config.schedule
  }));
  
  res.json({ functions, count: functions.length });
});

// 個別関数テスト
app.post('/test/:functionName', async (req, res) => {
  try {
    await FunctionRegistry.loadFunctions();
    
    const functionName = req.params.functionName;
    const func = FunctionRegistry.getFunction(functionName);
    
    if (!func) {
      return res.status(404).json({
        success: false,
        error: `Function '${functionName}' not found`
      });
    }

    const context: FunctionContext = {
      functionName,
      requestId: `test_${Date.now()}`,
      timestamp: new Date().toISOString(),
      isLocal: true
    };

    const result = await func.handler(req.body, context);
    res.json(result);
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Cloud Functions形式のエンドポイント（互換性）
app.post('/', async (req, res) => {
  try {
    await FunctionRegistry.loadFunctions();
    
    const { functionName, ...data } = req.body;
    
    if (!functionName) {
      return res.status(400).json({
        error: 'functionName is required',
        availableFunctions: FunctionRegistry.getFunctionNames()
      });
    }

    const func = FunctionRegistry.getFunction(functionName);
    if (!func) {
      return res.status(404).json({
        error: `Function '${functionName}' not found`
      });
    }

    const context: FunctionContext = {
      functionName,
      requestId: `http_${Date.now()}`,
      timestamp: new Date().toISOString(),
      isLocal: true
    };

    const result = await func.handler(data, context);
    res.json(result);
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.listen(PORT, () => {
  logger.info(`Development server running on http://localhost:${PORT}`);
  logger.info(`Dashboard: http://localhost:${PORT}`);
  logger.info(`API: http://localhost:${PORT}/functions`);
});
