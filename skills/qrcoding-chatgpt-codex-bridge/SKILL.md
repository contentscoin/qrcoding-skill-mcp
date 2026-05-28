---
name: qrcoding-chatgpt-codex-bridge
description: ChatGPT에서 Codex를 불러 QR Coding 작업을 넘기고, OpenAI Secure MCP Tunnel로 private MCP proxy를 연결하도록 안내하는 브리지 스킬.
disable-model-invocation: false
allowed-tools: "Read, Grep, Bash(test *), Bash(curl *)"
---

# QR Coding ChatGPT Codex Bridge

Use this skill when the user wants the ChatGPT + Codex path for QR Coding through OpenAI Secure MCP Tunnel.

## Recommended Path

1. Store the QR Agent Studio API key on the private MCP proxy as `QRCODING_API_KEY`.
2. Run `tunnel-client` where it can reach the private MCP proxy.
3. In ChatGPT connector settings, choose Connection: Tunnel and select or paste the `tunnel_id`.
4. Ask ChatGPT to hand QR Coding work to Codex and use the QR Coding skills.

Do not paste a `qras_` key or a `?api_key=` URL into ChatGPT when using Secure MCP Tunnel.

## Private MCP Proxy

```bash
export QRCODING_API_KEY="<YOUR_QR_AGENT_STUDIO_API_KEY>"
export CONTROL_PLANE_API_KEY="<OPENAI_RUNTIME_API_KEY_WITH_TUNNELS_READ_USE>"
tunnel_id="<YOUR_TUNNEL_ID>"

tunnel-client init \
  --profile qr-agent-proxy \
  --tunnel-id "$tunnel_id" \
  --mcp-server-url http://localhost:3000/mcp

tunnel-client doctor --profile qr-agent-proxy --explain
tunnel-client run --profile qr-agent-proxy
```

The `CONTROL_PLANE_API_KEY` principal needs Tunnels Read + Use for the target tunnel. Grant Tunnels Read + Manage only to operators that create or edit tunnels.

The hosted gateway remains available at `https://qrcoding-skill-mcp.vercel.app/mcp` for server cards, discovery, and legacy/dev clients. For ChatGPT + Codex, prefer the private proxy behind the tunnel.

## ChatGPT App Setup Flow

Before the ChatGPT steps, prepare one `qras_` key on the private MCP proxy. Do not paste that key into ChatGPT.

1. Turn on developer mode: open https://chatgpt.com/, confirm the correct workspace, then enable Developer mode or custom MCP connector creation in ChatGPT settings. Done when the workspace can create custom MCP apps.
2. Create the app: after developer mode is on, open Apps or Workspace Apps in ChatGPT and create a QR Agent Studio app. Done when the app creation screen lets you enter the app name and description.
3. Set API and tunnel: in the app setup or connector settings at https://chatgpt.com/#settings/Connectors, choose `Connection: Tunnel`, select or paste the `tunnel_id`, run `Scan Tools`, and save the discovered QR tools. Keep `QRCODING_API_KEY` and `tunnel-client` only on the private proxy.
4. Use the created app: start a new ChatGPT conversation, choose the QR Agent Studio dev app from the app/tool picker, and ask it to create or validate QR codes. Done when ChatGPT returns the generated QR result or validation summary.

If the menu is missing, check plan, workspace admin/owner role, RBAC access, and whether you are on ChatGPT web. MCP apps are not available on mobile.

## ChatGPT -> Codex Handoff Prompt

When the user asks for a prompt they can paste into ChatGPT, provide this template:

```text
Use Codex for this QR Coding task.

Use the tunnel-backed MCP target exposed by the supported OpenAI product surface when it is available. The QR Agent Studio API key should stay in QRCODING_API_KEY on the private MCP proxy or Codex environment, not in ChatGPT.

In Codex, use the QR Coding skills:
- qrcoding-campaign-operator for QR list/create/render/validate/update work
- qrcoding-integration-architect for Secure MCP Tunnel/API/plugin setup
- qrcoding-chatgpt-codex-bridge for ChatGPT -> Codex handoff setup

If QR tools are unavailable, ask me to confirm tunnel-client is running and the QR Coding Codex skills are installed. Do not ask me to paste a qras_ key into ChatGPT, and do not print qras_ values in logs or final answers.

First verify the tool path with a read-only list/account request. Then perform the requested QR operation.
```

## Safe Install Commands

Codex:

```bash
curl -fsSL https://raw.githubusercontent.com/contentscoin/qrcoding-skill-mcp/main/install.sh -o /tmp/qrcoding-install.sh
cat /tmp/qrcoding-install.sh
bash /tmp/qrcoding-install.sh --codex --mode=full --skip-key
```

After installation, fully quit and restart ChatGPT, Codex, or the MCP client before checking for QR tools.
