---
name: qrcoding-chatgpt-codex-bridge
description: ChatGPT에서 Codex를 불러 QR Coding 작업을 넘기거나, ChatGPT Developer mode 원격 MCP 앱을 설정하도록 안내하는 브리지 스킬.
disable-model-invocation: false
allowed-tools: "Read, Grep, Bash(test *), Bash(curl *)"
---

# QR Coding ChatGPT Codex Bridge

Use this skill when the user wants the simplest path to use QR Coding from ChatGPT, especially when they prefer not to install local MCP manually.

## Choose the Path

1. **ChatGPT app registration**: use Developer mode, create a remote MCP app, set authentication to No Authentication, and paste:

```text
https://qrcoding-skill-mcp.vercel.app/mcp?api_key=qras_your_key
```

This URL contains a secret API key. Never print the real key back to the user.

2. **ChatGPT -> Codex handoff**: if ChatGPT can call Codex in the current environment, hand the task to Codex and tell it to use the QR Coding skills.

3. **Codex skill install**: install `qrcoding-campaign-operator`, `qrcoding-integration-architect`, and this bridge skill into Codex.

4. **Claude skill install**: install the same skills into Claude Code.

## ChatGPT -> Codex Handoff Prompt

When the user asks for a prompt they can paste into ChatGPT, provide this template:

```text
Use Codex for this QR Coding task.

In the project root, use the QR Coding skills:
- qrcoding-campaign-operator for QR list/create/render/validate/update work
- qrcoding-integration-architect for MCP/API/plugin setup
- qrcoding-chatgpt-codex-bridge for ChatGPT handoff setup

If QRCODING_API_KEY is not configured, ask me for a qras_ API key or tell me to create one in the QR Agent Studio dashboard. Do not expose the full key in logs or final answers.

First verify the tool path with a read-only list/account request. Then perform the requested QR operation.
```

## Safe Install Commands

Codex:

```bash
curl -fsSL https://raw.githubusercontent.com/contentscoin/qrcoding-skill-mcp/main/install.sh -o /tmp/qrcoding-install.sh
cat /tmp/qrcoding-install.sh
bash /tmp/qrcoding-install.sh --codex --mode=full --skip-key
```

Claude Code:

```bash
curl -fsSL https://raw.githubusercontent.com/contentscoin/qrcoding-skill-mcp/main/install.sh -o /tmp/qrcoding-install.sh
cat /tmp/qrcoding-install.sh
bash /tmp/qrcoding-install.sh --claude --mode=full --skip-key
```

After installation, fully quit and restart ChatGPT, Codex, Claude Code, or the MCP client before checking for QR tools.
