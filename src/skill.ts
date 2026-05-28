import { createHash } from "node:crypto";

export function skillMarkdown(publicBaseUrl: string, qrcodingBaseUrl: string): string {
  const publicBase = publicBaseUrl.replace(/\/$/, "");
  const targetBase = qrcodingBaseUrl.replace(/\/$/, "");
  return `# qrcoding

Use this skill to create, render, validate, list, and update QR Agent Studio QR codes from agents, plugins, and automations.

## Authentication

Ask the user for a QR Agent Studio API key. API keys start with \`qras_\`.

Send the key on every request:

\`\`\`text
x-api-key: <api-key>
\`\`\`

Never reveal the key in generated output, logs, QR payloads, markdown, public URLs, or screenshots.

## MCP Endpoint

Use this Streamable HTTP JSON-RPC endpoint:

\`\`\`text
POST ${publicBase}/mcp
content-type: application/json
accept: application/json, text/event-stream
x-api-key: <api-key>
\`\`\`

Start with \`tools/list\`, then call tools such as:

- \`create_qr_code\`
- \`prepare_qr_for_image\`
- \`render_qr_code\`
- \`update_qr_destination\`
- \`get_qr_analytics\`
- \`get_account_status\`

## REST / Plugin Actions

Use the OpenAPI document at:

\`\`\`text
${publicBase}/openapi.json
\`\`\`

This gateway forwards REST calls under \`${publicBase}/v1/*\` to QR Agent Studio. The upstream service is \`${targetBase}\`.

## API Key Issuing

If the user does not have a key, create one from QR Agent Studio:

\`\`\`text
POST ${targetBase}/v1/api-keys
content-type: application/json

{"name":"Plugin key"}
\`\`\`

The response includes \`apiKey\` once. Store it in the plugin or agent secret store before using this skill.
`;
}

export function digestSkill(markdown: string): string {
  return `sha256:${createHash("sha256").update(markdown).digest("hex")}`;
}
