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
- API key는 QR Agent Studio 대시보드의 Skills & MCP / Connect 패널에서 발급하며 `qras_`로 시작한다.
- Claude Code·Codex: `x-api-key` 헤더 또는 `QRCODING_API_KEY` 환경변수로 인증한다. 키를 답변·로그·public URL에 노출하지 않는다.
- ChatGPT: 헤더 인증을 지원하지 않으므로 키를 커스텀 커넥터 URL 경로(`/mcp/<키>`)에 넣고 `No authentication`으로 연결한다. 그 URL은 비밀번호처럼 취급한다(아래 ChatGPT 섹션).
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

유료 플랜 + 데스크톱 웹에서 커스텀 커넥터로 연결한다. OAuth/구글 로그인이나 별도 터널은 필요 없다.

1. 대시보드 Connect 패널에서 키를 발급하고 ChatGPT용 **커넥터 URL 전체**를 복사한다. URL은 `…/mcp/<발급키>` 형태로 키가 경로에 포함된다.
2. ChatGPT → 설정 → Connectors → Developer mode → Add custom connector.
3. 복사한 URL을 붙여넣고 Authentication을 `No authentication`으로 선택한 뒤 Connect.
4. 연결되면 새 대화에서 QR 생성·검증·수정을 자연어로 요청한다.

주의: 그 커넥터 URL은 키를 담고 있으므로 비밀번호처럼 다루고, 유출되면 대시보드에서 해당 키를 폐기한다. "Add custom connector"가 안 보이면 요금제·workspace 관리자 권한·데스크톱 웹 여부를 확인한다(모바일 미지원).

## 설치 구성

- `--mode=ops` (기본): 운영 + 빠른시작 + 디자인 + 분석 + 연결 스킬.
- `--mode=dev`: 연동 설계(integration-architect) + 연결 스킬.
- `--mode=full`: 전체.

연결이 끝나면 "QR 만들어줘"는 `qrcoding-quickstart`, 분석은 `qrcoding-analytics`, 디자인은 `qrcoding-designer`가 받아 `qrcoding-campaign-operator`로 위임한다.
