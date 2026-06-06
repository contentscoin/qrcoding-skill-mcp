---
name: qrcoding-connect
description: QR Agent Studio를 Claude Code·Codex·ChatGPT에 연결하는 방법을 클라이언트별로 한 곳에서 안내하는 스킬.
disable-model-invocation: false
allowed-tools: "Read, Bash(test *)"
---

# QR Coding Connect

QR Agent Studio MCP/스킬을 사용 중인 AI 클라이언트에 연결한다. 연결만 다루며, 실제 QR 작업은 `qrcoding-campaign-operator`로 위임한다.

## 공통

- Hosted MCP Gateway: `https://qrcoding-skill-mcp.vercel.app/mcp`
- 인증: `x-api-key` 헤더 또는 `QRCODING_API_KEY` 환경변수. API key는 QR Agent Studio 대시보드의 Skills & MCP 패널에서 발급하며 `qras_`로 시작한다.
- API key를 답변·로그·public URL·ChatGPT URL에 노출하지 않는다. 쿼리스트링(`?api_key=`)은 인증으로 사용하지 않는다.
- 설치 스크립트는 내려받아 내용을 확인한 뒤 실행한다.

```bash
curl -fsSL https://raw.githubusercontent.com/contentscoin/qrcoding-skill-mcp/main/install.sh -o /tmp/qrcoding-install.sh
cat /tmp/qrcoding-install.sh
```

## Claude Code

```bash
bash /tmp/qrcoding-install.sh --claude --mode=ops --skip-key
```

설치 후 Claude Code를 완전히 종료했다가 다시 시작한다. `QRCODING_API_KEY`를 환경에 설정한다.

## Codex

```bash
bash /tmp/qrcoding-install.sh --codex --mode=ops --skip-key
```

설치 후 Codex를 재시작한다.

## ChatGPT

대시보드 Connect 패널에서 안내하는 커스텀 커넥터로 게이트웨이 MCP를 연결한다(유료 플랜·데스크톱 웹). 사설 MCP proxy와 OpenAI Secure MCP Tunnel을 쓰는 고급 설정과 ChatGPT → Codex 핸드오프는 `qrcoding-chatgpt-codex-bridge` 스킬을 참고한다. ChatGPT에는 `qras_` 키를 붙여넣지 않는다.

## 설치 구성

- `--mode=ops` (기본): 운영 + 빠른시작 + 디자인 + 분석 + 연결 스킬.
- `--mode=dev`: 연동 설계(integration-architect) + ChatGPT 브리지.
- `--mode=full`: 전체.

연결이 끝나면 "QR 만들어줘"는 `qrcoding-quickstart`, 분석은 `qrcoding-analytics`, 디자인은 `qrcoding-designer`가 받아 `qrcoding-campaign-operator`로 위임한다.
