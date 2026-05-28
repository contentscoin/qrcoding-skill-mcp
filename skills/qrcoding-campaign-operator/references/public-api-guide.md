# QR Agent Studio Public API Guide

## Overview

QR Agent Studio stores QR codes as reproducible JSON specs and regenerates SVG/PNG/PDF assets from those specs. Dynamic QR codes keep the printed QR stable while the destination URL can change later.

| Item | Value |
|---|---|
| Default API Base URL | `https://qrcoding-contentscoin-jakes-projects-0ab50f91.vercel.app` |
| Skill/MCP Gateway | `https://qrcoding-skill-mcp.vercel.app` |
| MCP Endpoint | `https://qrcoding-skill-mcp.vercel.app/mcp` |
| Auth Header | `x-api-key` |
| API Key Prefix | `qras_` |

## Authentication

Create API keys in the QR Agent Studio dashboard. The full key is shown once.

Every skill, plugin, MCP, or REST request should send:

```http
x-api-key: qras_your_key
```

Never expose the full key in logs, screenshots, QR payloads, markdown, or public URLs.

## MCP

Call the gateway endpoint with JSON-RPC:

```bash
curl -sS -X POST "https://qrcoding-skill-mcp.vercel.app/mcp" \
  -H "content-type: application/json" \
  -H "accept: application/json, text/event-stream" \
  -H "x-api-key: $QRCODING_API_KEY" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

Available MCP tools are discovered with `tools/list`. Common tools:

| Tool | Purpose |
|---|---|
| `search` | Search QR specs by name, URL, slug, or checksum |
| `fetch` | Fetch a search result |
| `prepare_qr_for_image` | Find or create a dynamic QR and return image-ready render data |
| `create_qr_code` | Create a QR spec |
| `render_qr_code` | Regenerate SVG, PNG, or PDF from a spec |
| `get_qr_spec` | Return reproducible QR JSON |
| `update_qr_destination` | Change the destination of a dynamic QR |
| `list_qr_codes` | List QR specs in the workspace |
| `compose_qr_overlay` | Produce deterministic AI image overlay instructions |
| `validate_qr_scanability` | Validate scanability and warnings |
| `get_qr_analytics` | Return scan counts |
| `get_account_status` | Return plan and usage |

## REST Endpoints

The gateway proxies `/v1/*` to QR Agent Studio and exposes OpenAPI at:

```text
https://qrcoding-skill-mcp.vercel.app/openapi.json
```

### Create API Key

`POST /v1/api-keys`

Request:

```json
{
  "name": "Plugin key",
  "scopes": ["qr:read", "qr:write"]
}
```

Response:

```json
{
  "apiKey": "qras_...",
  "key": {
    "id": "uuid",
    "name": "Plugin key",
    "keyPrefix": "qras_abcd..."
  }
}
```

### List QR Codes

`GET /v1/qr-codes`

Response:

```json
{
  "qrCodes": []
}
```

### Create QR Code

`POST /v1/qr-codes`

Request:

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

Notes:

- `type: "dynamic"` requires URL payloads.
- Text payloads are static.
- Free workspaces are limited by active QR count.

### Render QR Code

`POST /v1/qr-codes/{id}/render`

Request:

```json
{
  "format": "svg",
  "size": 512,
  "margin": 4
}
```

Formats: `svg`, `png`, `pdf`.

### Update Dynamic Destination

`PATCH /v1/qr-codes/{id}/destination`

Request:

```json
{
  "destinationUrl": "https://example.com/new"
}
```

This changes where future scans land without changing the printed QR image.

### Validate Scanability

`POST /v1/qr-codes/{id}/validate`

Returns scanability score and warnings.

### Analytics

`GET /v1/analytics`

Returns total scans and per-QR scan summaries.

### Account Status

`GET /v1/account`

Returns plan, active QR count, free limit, and storage mode.

## Error Handling

Common error codes:

| Code | Meaning | Action |
|---|---|---|
| `unauthorized` | Missing or invalid API key | Ask the user to create or update `QRCODING_API_KEY` |
| `login_required` | API key management needs authenticated account context | Use dashboard key creation |
| `qr_limit` | Free active QR limit reached | Archive old QR or upgrade |
| `custom_design` | Custom design is gated | Upgrade or use basic template |
| `pdf_export` | PDF export is gated | Upgrade or use SVG/PNG |
| `not_found` | QR or API key not found | Recheck id |

## Operational Rules

- Do not create QR codes on ambiguous requests.
- Dynamic destination updates affect every future scan; summarize the old and new destination when possible.
- Prefer SVG for image-generation overlay workflows.
- Return concise results: QR id, dynamic URL, destination, checksum, and scanability warnings.
