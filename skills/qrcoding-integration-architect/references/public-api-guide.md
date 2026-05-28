# QR Agent Studio Public API Guide

## Overview

QR Agent Studio stores QR codes as reproducible JSON specs and regenerates assets on demand.

| Item | Value |
|---|---|
| Default API Base URL | `https://qrcoding-contentscoin-jakes-projects-0ab50f91.vercel.app` |
| Skill/MCP Gateway | `https://qrcoding-skill-mcp.vercel.app` |
| Auth Header | `x-api-key` |
| API Key Prefix | `qras_` |

## Authentication

Use API key auth for skills, plugins, automation, and non-ChatGPT clients.

```http
x-api-key: <YOUR_QR_AGENT_STUDIO_API_KEY>
```

OAuth discovery endpoints exist for account-linking clients, but API key auth is the preferred integration pattern.

## Discovery URLs

| Document | URL |
|---|---|
| MCP Server Card | `https://qrcoding-skill-mcp.vercel.app/.well-known/mcp/server-card.json` |
| Agent Skills Index | `https://qrcoding-skill-mcp.vercel.app/.well-known/agent-skills/index.json` |
| OpenAPI | `https://qrcoding-skill-mcp.vercel.app/openapi.json` |
| MCP Endpoint | `https://qrcoding-skill-mcp.vercel.app/mcp` |

## Core REST Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/v1/account` | Current workspace plan and limits |
| GET | `/v1/api-keys` | List API key metadata |
| POST | `/v1/api-keys` | Create API key |
| DELETE | `/v1/api-keys/{id}` | Revoke API key |
| GET | `/v1/qr-codes` | List QR specs |
| POST | `/v1/qr-codes` | Create QR spec |
| GET | `/v1/qr-codes/{id}` | Get QR spec |
| POST | `/v1/qr-codes/{id}/render` | Render SVG/PNG/PDF |
| PATCH | `/v1/qr-codes/{id}/destination` | Update dynamic destination |
| POST | `/v1/qr-codes/{id}/validate` | Validate scanability |
| POST | `/v1/qr-codes/{id}/overlay` | Generate overlay instructions |
| POST | `/v1/qr-codes/{id}/archive` | Archive QR |
| GET | `/v1/analytics` | Scan analytics |

## QR Creation Contract

Minimal dynamic QR request:

```json
{
  "name": "Campaign QR",
  "type": "dynamic",
  "payload": {
    "kind": "url",
    "value": "https://example.com"
  },
  "destinationUrl": "https://example.com",
  "design": {
    "templateId": "classic"
  },
  "renderOptions": {
    "format": "svg",
    "size": 512,
    "margin": 4
  }
}
```

Rules:

- `payload.kind: "text"` must use `type: "static"`.
- `type: "dynamic"` requires URL payload and valid `destinationUrl`.
- Use `templateId: "classic"` unless the user requests custom design.
- Prefer SVG for print and AI image compositing.

## MCP Contract

Streamable HTTP JSON-RPC:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/list"
}
```

Tool calls:

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "create_qr_code",
    "arguments": {
      "name": "Campaign QR",
      "type": "dynamic",
      "payload": { "kind": "url", "value": "https://example.com" },
      "destinationUrl": "https://example.com"
    }
  }
}
```

## Security Notes

- Store API keys in a secret store or environment variable.
- Mask keys in logs; never print values beginning with `qras_`.
- Revoke unused keys.
- Keep write-capable keys separate from read-only keys when possible.
- Treat `update_qr_destination` as a state-changing operation.
