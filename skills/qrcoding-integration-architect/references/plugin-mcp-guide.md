# QR Coding Plugin and MCP Guide

## Recommended Integration

Use API key auth unless a specific client requires OAuth account linking.

```text
x-api-key: <YOUR_QR_AGENT_STUDIO_API_KEY>
```

## OpenAPI Plugin

Use:

```text
https://qrcoding-skill-mcp.vercel.app/openapi.json
```

The OpenAPI document declares `apiKeyAuth` in the `x-api-key` header.

Plugin secret setting:

```text
Header name: x-api-key
Value: <YOUR_QR_AGENT_STUDIO_API_KEY>
```

## MCP Client Config

```json
{
  "mcpServers": {
    "qrcoding": {
      "type": "streamable-http",
      "url": "https://qrcoding-skill-mcp.vercel.app/mcp",
      "headers": {
        "x-api-key": "<YOUR_QR_AGENT_STUDIO_API_KEY>"
      }
    }
  }
}
```

## Local stdio MCP

This repo also ships a local stdio MCP server:

```bash
node mcp/qrcoding_mcp.mjs
```

Environment:

```bash
export QRCODING_API_KEY="<YOUR_QR_AGENT_STUDIO_API_KEY>"
export QRCODING_MCP_URL="https://qrcoding-skill-mcp.vercel.app/mcp"
```

## Agent Skills

Installable skills live under:

- `skills/qrcoding-campaign-operator`
- `skills/qrcoding-integration-architect`

Discovery index:

```text
https://qrcoding-skill-mcp.vercel.app/.well-known/agent-skills/index.json
```

## Rollout Checklist

- API key created in dashboard.
- Key stored in secret settings or env var, not in source code.
- `tools/list` succeeds.
- `get_account_status` succeeds.
- One read-only request is tested before write operations.
- Write operations are confirmed with the user.
