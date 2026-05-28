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
export QRCODING_API_KEY="qras_your_key"
export CONTROL_PLANE_API_KEY="sk-..."

tunnel-client init \
  --profile qr-agent-proxy \
  --tunnel-id tunnel_0123456789abcdef0123456789abcdef \
  --mcp-server-url http://localhost:3000/mcp

tunnel-client doctor --profile qr-agent-proxy --explain
tunnel-client run --profile qr-agent-proxy
```

The hosted gateway remains available at `https://qrcoding-skill-mcp.vercel.app/mcp` for server cards, discovery, and legacy/dev clients. For ChatGPT + Codex, prefer the private proxy behind the tunnel.

## ChatGPT -> Codex Handoff Prompt

When the user asks for a prompt they can paste into ChatGPT, provide this template:

```text
Use Codex for this QR Coding task.

Prefer the QR Coding MCP tools exposed through the OpenAI Secure MCP Tunnel. The QR Agent Studio API key should stay in QRCODING_API_KEY on the private MCP proxy or Codex environment, not in ChatGPT.

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
