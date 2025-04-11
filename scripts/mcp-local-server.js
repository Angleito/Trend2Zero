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

const app = express();
app.use(bodyParser.json());

// Mock tool list
const tools = [
  {
    name: "search",
    description: "Brave Search",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query" }
      },
      required: ["query"]
    }
  }
];

// POST /listTools
app.post('/listTools', (req, res) => {
  res.json(tools);
});

// POST /callTool
app.post('/callTool', (req, res) => {
  const { name, arguments: args } = req.body || {};
  if (name === "search") {
    // Return a static mock result
    res.json({
      result: {
        query: args && args.query,
        results: [
          { title: "Example Brave Result", url: "https://search.brave.com/", snippet: "This is a mock result from the local MCP server." }
        ]
      }
    });
  } else {
    res.status(400).json({ error: "Unknown tool" });
  }
});

// Port config: --port or PORT env
const argvPort = (() => {
  const idx = process.argv.indexOf('--port');
  if (idx !== -1 && process.argv[idx + 1]) return parseInt(process.argv[idx + 1], 10);
  return null;
})();
const port = argvPort || parseInt(process.env.PORT, 10) || 8081;

app.listen(port, () => {
  console.log(`Local MCP server listening on port ${port}`);
  console.log('Endpoints: POST /listTools, POST /callTool');
});