module.exports = {
    mcpServers: {
        "playwright": {
            "command": "npx",
            "args": [
                "-y",
                "@executeautomation/playwright-mcp-server"
            ]
        },
        "perplexity-ask": {
            "command": "npx",
            "args": [
                "-y",
                "server-perplexity-ask"
            ],
            "env": {
                "PERPLEXITY_API_KEY": "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"
            },
            "alwaysAllow": ["perplexity_ask"],
            "disabled": false
        }
    }
};