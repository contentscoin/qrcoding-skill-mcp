import { createHash } from "node:crypto";

export type SkillArtifact = {
  name: string;
  description: string;
  markdown: string;
};

function campaignOperatorMarkdown(publicBaseUrl: string, qrcodingBaseUrl: string): string {
  const publicBase = publicBaseUrl.replace(/\/$/, "");
  const targetBase = qrcodingBaseUrl.replace(/\/$/, "");
  return `---
name: qrcoding-campaign-operator
description: QR Agent Studio QR 생성, 조회, 렌더, 검증, 동적 목적지 변경을 API key와 MCP로 직접 처리하는 운영형 스킬.
disable-model-invocation: false
allowed-tools: "Read, Grep, Bash(test *), Bash(curl *)"
---

# QR Coding Campaign Operator

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

function integrationArchitectMarkdown(publicBaseUrl: string, qrcodingBaseUrl: string): string {
  const publicBase = publicBaseUrl.replace(/\/$/, "");
  const targetBase = qrcodingBaseUrl.replace(/\/$/, "");
  return `---
name: qrcoding-integration-architect
description: QR Agent Studio API, MCP, Agent Skill, OpenAPI plugin 연동을 설계하고 구현 계획을 작성하는 개발/설계형 스킬.
disable-model-invocation: false
allowed-tools: "Read, Grep, Bash(test *), Bash(curl *)"
---

# QR Coding Integration Architect

Use this skill to design QR Agent Studio integrations for APIs, MCP clients, Agent Skills, and OpenAPI plugins. Default to API key auth; use OAuth only for clients that specifically require account linking.

## Discovery

- MCP endpoint: \`${publicBase}/mcp\`
- MCP server card: \`${publicBase}/.well-known/mcp/server-card.json\`
- Agent Skills index: \`${publicBase}/.well-known/agent-skills/index.json\`
- OpenAPI: \`${publicBase}/openapi.json\`
- Upstream QR Agent Studio: \`${targetBase}\`

## Architecture Rules

- Store QR Agent Studio API keys as secrets or environment variables.
- Send API keys as \`x-api-key\`.
- Do not hardcode API keys in browser clients.
- Mask values that begin with \`qras_\` in logs and output.
- Treat \`update_qr_destination\` as a state-changing operation.
- Prefer SVG for QR assets that will be placed into generated images or print artwork.

## Planning Flow

Start each planning response with:

\`\`\`text
현재 단계: 분석 | 질문 | 설계 | 승인대기 | 구현
\`\`\`

Do not implement until the user approves a concrete plan in a later turn. Build the plan around:

1. Client type: MCP, OpenAPI plugin, local script, dashboard, or automation.
2. Auth: API key storage, scopes, revoke path, and log masking.
3. Data flow: QR create/list/render/validate/update destination.
4. Failure handling: invalid key, plan limit, missing QR id, network failure.
5. Verification: \`tools/list\`, \`get_account_status\`, and one read-only QR request.

## Useful Config

\`\`\`json
{
  "mcpServers": {
    "qrcoding": {
      "type": "streamable-http",
      "url": "${publicBase}/mcp",
      "headers": {
        "x-api-key": "<YOUR_QR_AGENT_STUDIO_API_KEY>"
      }
    }
  }
}
\`\`\`
`;
}

function chatGptCodexBridgeMarkdown(publicBaseUrl: string): string {
  const publicBase = publicBaseUrl.replace(/\/$/, "");
  return `---
name: qrcoding-chatgpt-codex-bridge
description: ChatGPT에서 Codex를 불러 QR Coding 작업을 넘기고, OpenAI Secure MCP Tunnel로 private MCP proxy를 연결하도록 안내하는 브리지 스킬.
disable-model-invocation: false
allowed-tools: "Read, Grep, Bash(test *), Bash(curl *)"
---

# QR Coding ChatGPT Codex Bridge

Use this skill when the user wants the ChatGPT + Codex path for QR Coding through OpenAI Secure MCP Tunnel.

## Recommended Path

1. Store the QR Agent Studio API key on the private MCP proxy as \`QRCODING_API_KEY\`.
2. Run \`tunnel-client\` where it can reach the private MCP proxy.
3. In ChatGPT connector settings, choose Connection: Tunnel and select or paste the \`tunnel_id\`.
4. Ask ChatGPT to hand QR Coding work to Codex and use the QR Coding skills.

Do not paste a \`qras_\` key or a \`?api_key=\` URL into ChatGPT when using Secure MCP Tunnel.

## Private MCP Proxy

\`\`\`bash
export QRCODING_API_KEY="<YOUR_QR_AGENT_STUDIO_API_KEY>"
export CONTROL_PLANE_API_KEY="<OPENAI_RUNTIME_API_KEY_WITH_TUNNELS_READ_USE>"
tunnel_id="<YOUR_TUNNEL_ID>"

tunnel-client init \\
  --profile qr-agent-proxy \\
  --tunnel-id "$tunnel_id" \\
  --mcp-server-url http://localhost:3000/mcp

tunnel-client doctor --profile qr-agent-proxy --explain
tunnel-client run --profile qr-agent-proxy
\`\`\`

The \`CONTROL_PLANE_API_KEY\` principal needs Tunnels Read + Use for the target tunnel. Grant Tunnels Read + Manage only to operators that create or edit tunnels.

The hosted gateway remains available at \`${publicBase}/mcp\` for server cards, discovery, and legacy/dev clients. For ChatGPT + Codex, prefer the private proxy behind the tunnel.

## ChatGPT Setup Links

- Connector settings: https://chatgpt.com/#settings/Connectors
- Open ChatGPT: https://chatgpt.com/
- Developer mode and app creation guide: https://help.openai.com/en/articles/12584461-developer-mode-apps-and-full-mcp-connectors-in-chatgpt-beta

## ChatGPT Developer Mode Menu Paths

- Admin enablement: Workspace Settings -> Permissions & Roles -> Connected Data -> Developer mode / Create custom MCP connectors
- Create a custom app: Workspace Settings -> Apps -> Create
- Personal toggle after access is granted: Settings -> Apps -> Advanced Settings

## ChatGPT -> Codex Handoff Prompt

\`\`\`text
Use Codex for this QR Coding task.

Use the tunnel-backed MCP target exposed by the supported OpenAI product surface when it is available. The QR Agent Studio API key should stay in QRCODING_API_KEY on the private MCP proxy or Codex environment, not in ChatGPT.

In Codex, use the QR Coding skills:
- qrcoding-campaign-operator for QR list/create/render/validate/update work
- qrcoding-integration-architect for Secure MCP Tunnel/API/plugin setup
- qrcoding-chatgpt-codex-bridge for ChatGPT -> Codex handoff setup

If QR tools are unavailable, ask me to confirm tunnel-client is running and the QR Coding Codex skills are installed. Do not ask me to paste a qras_ key into ChatGPT, and do not print qras_ values in logs or final answers.

First verify the tool path with a read-only list/account request. Then perform the requested QR operation.
\`\`\`
`;
}

export function skillArtifacts(publicBaseUrl: string, qrcodingBaseUrl: string): SkillArtifact[] {
  return [
    {
      name: "qrcoding-campaign-operator",
      description: "Operate QR Agent Studio campaigns over MCP with an API key.",
      markdown: campaignOperatorMarkdown(publicBaseUrl, qrcodingBaseUrl)
    },
    {
      name: "qrcoding-integration-architect",
      description: "Design QR Agent Studio API, MCP, Agent Skill, and OpenAPI plugin integrations.",
      markdown: integrationArchitectMarkdown(publicBaseUrl, qrcodingBaseUrl)
    },
    {
      name: "qrcoding-chatgpt-codex-bridge",
      description: "Guide ChatGPT users to Secure MCP Tunnel setup and Codex handoff for QR Coding.",
      markdown: chatGptCodexBridgeMarkdown(publicBaseUrl)
    }
  ];
}

export function skillMarkdown(publicBaseUrl: string, qrcodingBaseUrl: string, name = "qrcoding-campaign-operator"): string {
  const artifacts = skillArtifacts(publicBaseUrl, qrcodingBaseUrl);
  const artifact = artifacts.find((item) => item.name === name) ?? artifacts[0];
  return artifact.markdown;
}

export function digestSkill(markdown: string): string {
  return `sha256:${createHash("sha256").update(markdown).digest("hex")}`;
}
