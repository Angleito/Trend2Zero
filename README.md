no# Trend2Zero

## Project Overview
Trend2Zero is a comprehensive financial tracking and analysis application that provides real-time market data and insights.

## Key Features
- Real-time cryptocurrency and stock market tracking
- Advanced price analysis and historical data visualization
- Multi-asset portfolio management

## Technology Stack
- Next.js
- React
- TypeScript
- Node.js
- Tailwind CSS

## Data Sources
- Alpha Vantage API for stock market data
- CoinMarketCap API for cryptocurrency information

## Getting Started

### Prerequisites
- Node.js (v16 or later)
- npm or yarn

### Installation
1. Clone the repository
2. Install dependencies: `npm install`
3. Environment Configuration
   - For development: Copy `.env.example` to `.env` and fill in your API keys
   - For production: Create `.env.production` with production-specific configurations
4. Development Server: `npm run dev`

### Production Build
1. Set up environment variables in `.env.production`
2. Build the application: `npm run build`
3. Start the production server: `npm run start`

#### Environment Variable Management
- Use `.env.example` as a template for local development
- Create `.env.production` for production-specific settings
- Prefix client-side variables with `NEXT_PUBLIC_`
- Never commit sensitive API keys to version control

## API Integrations
- Stocks and ETFs (via Alpha Vantage API)
- Cryptocurrencies (via CoinMarketCap API)

## MCP Server Workflow

The Model Context Protocol (MCP) client is used for tool-based search and integration. The workflow is designed for seamless local development and easy debugging.

### Default Local Server Behavior

- By default, the MCP client connects to a local MCP server at `http://localhost:8081`.
- Before connecting, the client checks if the local server is running by polling the `/listTools` endpoint.
- If the server is not running, it is started automatically by spawning `scripts/mcp-local-server.js`.
- No additional dependencies are required; only Node.js built-ins are used.

### Overriding the MCP Server URL

- You can override the default MCP server URL by setting the `MCP_SERVER_URL` environment variable.
  - Example: `MCP_SERVER_URL="http://localhost:9090" npm run dev`
- If `MCP_SERVER_URL` is set, the client will use the specified server and will not attempt to start the local server automatically.

### Running the Local MCP Server Manually (for Debugging)

To run the local MCP server manually (for debugging or custom mock responses):

```sh
node scripts/mcp-local-server.js
```

- By default, the server listens on port 8081.
- You can override the port:
  - With an environment variable: `PORT=9090 node scripts/mcp-local-server.js`
  - Or with a CLI argument: `node scripts/mcp-local-server.js --port 9090`

### Endpoints

- `POST /listTools` — Returns the list of available tools.
- `POST /callTool` — Accepts tool invocation requests and returns mock results.

### Troubleshooting & Caveats

- If the default port (8081) is already in use, the server may fail to start. Use a different port as shown above.
- If you set `MCP_SERVER_URL` to a remote or custom server, the local server will not be started automatically.
- For debugging, running the server manually allows you to see logs and modify mock responses in `scripts/mcp-local-server.js`.
- Ensure your environment variables are set correctly to avoid connection issues.

### Relevant Code

- MCP client logic: [`lib/services/braveSearchMcp.ts`](lib/services/braveSearchMcp.ts)
- Local MCP server implementation: [`scripts/mcp-local-server.js`](scripts/mcp-local-server.js)

## Contributing
Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.