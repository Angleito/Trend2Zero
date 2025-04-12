// Minimal local MCP server for Brave Search API mocking
//
// Usage:
//   node scripts/mcp-local-server.js [--port PORT]
//   PORT=9090 node scripts/mcp-local-server.js
//
// By default, listens on port 8081. Set the PORT environment variable or use --port to override.
//
// Endpoints:
//   POST /listTools
//     Response: [{ name: "search", description: "Brave Search" }]
//   POST /callTool
//     Body: { name: "search", arguments: { query: "..." } }
//     Response: { result: ... } (mocked)
//
// Compatible with lib/services/braveSearchMcp.ts MCP client.

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mcpConfig = require('../config/mcp.config');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Middleware to check API key
const checkApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== mcpConfig.server.apiKey) {
    return res.status(401).json({ error: 'Invalid API key' });
  }
  next();
};

// POST /listTools
app.post('/listTools', checkApiKey, (req, res) => {
  res.json(mcpConfig.tools);
});

// POST /callTool
app.post('/callTool', checkApiKey, (req, res) => {
  const { name, arguments: args } = req.body || {};
  const tool = mcpConfig.tools.find(t => t.name === name);
  
  if (!tool) {
    return res.status(400).json({ error: 'Unknown tool' });
  }

  if (name === 'search') {
    res.json({
      result: {
        query: args.query,
        results: [
          { title: 'Search Result', url: 'https://example.com', snippet: 'Example search result' }
        ]
      }
    });
  } else if (name === 'browser') {
    res.json({
      result: {
        success: true,
        action: args.action,
        message: `Browser action '${args.action}' completed successfully`
      }
    });
  } else {
    res.status(400).json({ error: 'Tool not implemented' });
  }
});

const port = mcpConfig.server.port;
const host = mcpConfig.server.host;

app.listen(port, host, () => {
  console.log(`MCP server listening at http://${host}:${port}`);
  console.log('Endpoints: POST /listTools, POST /callTool');
});