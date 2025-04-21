'use client';
// import { createTransport } from "@smithery/sdk/transport.js"
// import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { spawn } from "child_process";
import http from "http";
import { URL } from "url";
/**
 * BraveSearchMcpClient now supports connecting to a local MCP server (default: http://localhost:8081).
 * - Before connecting, it ensures the local server is running (spawns scripts/mcp-local-server.js if needed).
 * - Waits for the local server to be ready by polling POST /listTools.
 * - You can override the MCP server URL with the MCP_SERVER_URL environment variable.
 * - No new dependencies are required (uses Node.js built-ins).
 */
// Type guard to check if an object is a tool
function isTool(obj) {
    return typeof obj === 'object' && obj !== null && 'name' in obj;
}
export class BraveSearchMcpClient {
    constructor() {
        this.client = null;
        this.localServerProcess = null;
    }
    getMcpServerUrl() {
        return process.env.MCP_SERVER_URL || "http://localhost:8081";
    }
    async ensureLocalServerReady() {
        const url = new URL(this.getMcpServerUrl());
        const port = Number(url.port) || 8081;
        const host = url.hostname || "localhost";
        const endpoint = `${url.protocol}//${host}:${port}/listTools`;
        // Helper to POST to /listTools
        const postListTools = () => new Promise((resolve) => {
            const req = http.request({
                method: "POST",
                hostname: host,
                port,
                path: "/listTools",
                headers: { "Content-Type": "application/json" },
                timeout: 1000,
            }, (res) => {
                let data = "";
                res.on("data", (chunk) => (data += chunk));
                res.on("end", () => {
                    resolve(res.statusCode === 200);
                });
            });
            req.on("error", () => resolve(false));
            req.write("{}");
            req.end();
        });
        // Try up to 1.5s to see if server is already running
        for (let i = 0; i < 5; ++i) {
            if (await postListTools())
                return;
            await new Promise((r) => setTimeout(r, 300));
        }
        // Not running: spawn the server
        this.localServerProcess = spawn("node", ["scripts/mcp-local-server.js"], {
            stdio: "ignore",
            detached: true,
            env: { ...process.env, PORT: String(port) },
        });
        // Give the process a moment to start
        await new Promise((r) => setTimeout(r, 300));
        // Poll until ready (max 10s)
        const start = Date.now();
        while (Date.now() - start < 10000) {
            if (await postListTools())
                return;
            await new Promise((r) => setTimeout(r, 300));
        }
        throw new Error("Local MCP server did not become ready on " + endpoint);
    }
    async connect() {
        try {
            const mcpUrl = this.getMcpServerUrl();
            if (mcpUrl.startsWith("http://localhost") || mcpUrl.startsWith("http://127.0.0.1")) {
                await this.ensureLocalServerReady();
            }
            // Commented out transport and client creation
            this.client = {};
            console.log("Brave Search MCP client initialized");
        }
        catch (error) {
            console.error("Failed to connect to Brave Search MCP:", error);
            throw error;
        }
    }
    async listTools() {
        if (!this.client) {
            await this.connect();
        }
        return [];
    }
    async callTool(toolName, args) {
        if (!this.client) {
            await this.connect();
        }
        console.warn(`Tool call not implemented: ${toolName}`, args);
        return null;
    }
}
// Convenience function for performing a Brave search
export async function performBraveSearch(query) {
    const mcpClient = new BraveSearchMcpClient();
    try {
        return await mcpClient.callTool("search", { query });
    }
    catch (error) {
        console.error("Brave Search failed:", error);
        throw error;
    }
}
