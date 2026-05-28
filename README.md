# qrcoding Skill MCP

Standalone Skill/MCP gateway for QR Agent Studio.

This repo contains only the agent-facing pieces:

- MCP Streamable HTTP gateway at `/mcp`
- MCP Server Card at `/.well-known/mcp/server-card.json`
- Agent Skills discovery at `/.well-known/agent-skills/index.json`
- `SKILL.md` artifact at `/.well-known/agent-skills/qrcoding/SKILL.md`
- REST/OpenAPI proxy at `/openapi.json` and `/v1/*`

It does not store QR records. It forwards authenticated requests to QR Agent Studio.

## Authentication

Use a QR Agent Studio API key:

```text
x-api-key: qras_your_key
```

You can create a key from QR Agent Studio:

```bash
curl -X POST https://qrcoding-7l4aqfjr0-jakes-projects-0ab50f91.vercel.app/v1/api-keys \
  -H "content-type: application/json" \
  -d '{"name":"Plugin key"}'
```

The full key is returned once as `apiKey`. Store it in your skill, plugin, or agent secret store.

## MCP

```bash
curl -X POST https://your-skill-mcp.example/mcp \
  -H "content-type: application/json" \
  -H "accept: application/json, text/event-stream" \
  -H "x-api-key: qras_your_key" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

## Configuration

Set `QRCODING_BASE_URL` to the QR Agent Studio deployment this gateway should forward to.

```bash
QRCODING_BASE_URL=https://qrcoding.example.com
PUBLIC_BASE_URL=https://your-skill-mcp.example
```

If unset, the gateway points at the current qrcoding preview deployment used during setup.

## Local Development

```bash
npm install
npm test
npm run build
vercel dev
```

## Deploy

```bash
vercel deploy -y
```

Use the resulting URL as the MCP endpoint and as the Agent Skills discovery origin.
