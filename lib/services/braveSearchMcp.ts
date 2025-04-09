import { createTransport } from "@smithery/sdk/transport.js"
import { Client } from "@modelcontextprotocol/sdk/client/index.js"

// Type guard to check if an object is a tool
function isTool(obj: unknown): obj is { name: string } {
  return typeof obj === 'object' && obj !== null && 'name' in obj
}

export class BraveSearchMcpClient {
  private client: Client | null = null

  async connect(): Promise<void> {
    try {
      const transport = createTransport("https://server.smithery.ai/@smithery-ai/brave-search", {
        "braveApiKey": process.env.BRAVE_API_KEY || "aba83310-68d9-40a1-a76a-a60ffe66d1cb"
      }, process.env.SMITHERY_API_KEY || "")

      this.client = new Client({
        name: "Brave Search MCP Client",
        version: "1.0.0"
      })

      await this.client.connect(transport)

      // Safely list available tools
      const tools = await this.client.listTools()
      const toolNames = Array.isArray(tools) 
        ? tools.filter(isTool).map(t => t.name)
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
        ? tools.filter(isTool).map(t => t.name)
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
        arguments: args
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