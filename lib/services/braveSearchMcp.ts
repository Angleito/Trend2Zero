import { createTransport } from "@smithery/sdk/transport.js"
import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { spawn, ChildProcessWithoutNullStreams } from "child_process"
import http from "http"
import { URL } from "url"

/**
 * BraveSearchMcpClient now supports connecting to a local MCP server (default: http://localhost:8081).
 * - Before connecting, it ensures the local server is running (spawns scripts/mcp-local-server.js if needed).
 * - Waits for the local server to be ready by polling POST /listTools.
 * - You can override the MCP server URL with the MCP_SERVER_URL environment variable.
 * - No new dependencies are required (uses Node.js built-ins).
 */
// Type guard to check if an object is a tool
function isTool(obj: unknown): obj is { name: string } {
  return typeof obj === 'object' && obj !== null && 'name' in obj
}

export class BraveSearchMcpClient {
  private client: Client | null = null
  private localServerProcess: import("child_process").ChildProcess | null = null

  private getMcpServerUrl(): string {
    return process.env.MCP_SERVER_URL || "http://localhost:8081"
  }

  private async ensureLocalServerReady(): Promise<void> {
    const url = new URL(this.getMcpServerUrl())
    const port = Number(url.port) || 8081
    const host = url.hostname || "localhost"
    const endpoint = `${url.protocol}//${host}:${port}/listTools`

    // Helper to POST to /listTools
    const postListTools = (): Promise<boolean> =>
      new Promise((resolve) => {
        const req = http.request(
          {
            method: "POST",
            hostname: host,
            port,
            path: "/listTools",
            headers: { "Content-Type": "application/json" },
            timeout: 1000,
          },
          (res) => {
            let data = ""
            res.on("data", (chunk) => (data += chunk))
            res.on("end", () => {
              resolve(res.statusCode === 200)
            })
          }
        )
        req.on("error", () => resolve(false))
        req.write("{}")
        req.end()
      })

    // Try up to 1.5s to see if server is already running
    for (let i = 0; i < 5; ++i) {
      if (await postListTools()) return
      await new Promise((r) => setTimeout(r, 300))
    }

    // Not running: spawn the server
    this.localServerProcess = spawn("node", ["scripts/mcp-local-server.js"], {
      stdio: "ignore",
      detached: true,
      env: { ...process.env, PORT: String(port) },
    })
    // Give the process a moment to start
    await new Promise((r) => setTimeout(r, 300))

    // Poll until ready (max 10s)
    const start = Date.now()
    while (Date.now() - start < 10000) {
      if (await postListTools()) return
      await new Promise((r) => setTimeout(r, 300))
    }
    throw new Error("Local MCP server did not become ready on " + endpoint)
  }

  async connect(): Promise<void> {
    try {
      const mcpUrl = this.getMcpServerUrl()
      if (mcpUrl.startsWith("http://localhost") || mcpUrl.startsWith("http://127.0.0.1")) {
        await this.ensureLocalServerReady()
      }

      const transport = createTransport(
        mcpUrl,
        {
          braveApiKey: process.env.BRAVE_API_KEY || "aba83310-68d9-40a1-a76a-a60ffe66d1cb",
        },
        process.env.SMITHERY_API_KEY || ""
      )

      this.client = new Client({
        name: "Brave Search MCP Client",
        version: "1.0.0",
      })

      await this.client.connect(transport)

      // Safely list available tools
      const tools = await this.client.listTools()
      const toolNames = Array.isArray(tools)
        ? tools.filter(isTool).map((t) => t.name)
        : []

      console.log(`Available Brave Search MCP tools: ${toolNames.join(", ")}`)
    } catch (error) {
      console.error("Failed to connect to Brave Search MCP:", error)
      throw error
    }
  }

  async listTools(): Promise<string[]> {
    if (!this.client) {
      await this.connect()
    }

    try {
      const tools = await this.client!.listTools()
      return Array.isArray(tools)
        ? tools.filter(isTool).map((t) => t.name)
        : []
    } catch (error) {
      console.error("Failed to list MCP tools:", error)
      return []
    }
  }

  async callTool(toolName: string, args: Record<string, unknown>): Promise<unknown> {
    if (!this.client) {
      await this.connect()
    }

    try {
      // Construct a tool call object that matches the expected interface
      const toolCall = {
        name: toolName,
        arguments: args,
      }

      const result = await this.client!.callTool(toolCall)
      return result
    } catch (error) {
      console.error(`Failed to call MCP tool '${toolName}':`, error)
      throw error
    }
  }
}

// Convenience function for performing a Brave search
export async function performBraveSearch(query: string): Promise<unknown> {
  const mcpClient = new BraveSearchMcpClient()
  
  try {
    return await mcpClient.callTool("search", { query })
  } catch (error) {
    console.error("Brave Search failed:", error)
    throw error
  }
}