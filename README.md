# qrcoding 스킬과 MCP

Codex, Claude Code, OpenAPI plugin, MCP client에서 QR Agent Studio를 쉽게 쓰기 위한 Agent Skills와 MCP 서버입니다.

이 저장소를 설치하면 에이전트가 QR 코드를 생성, 조회, 렌더링, 검증하거나 동적 QR 목적지를 변경할 때 필요한 절차와 reference를 바로 사용할 수 있습니다.

## 설치 전 준비

설치에는 Node.js 18 이상이 필요합니다.

QR Agent Studio API key도 준비해 주세요. 키는 QR Agent Studio 대시보드의 **Skills & MCP** 패널에서 발급합니다.

```text
Dashboard > Skills & MCP > Create API key
```

API key는 `qras_`로 시작합니다.

## 설치하기

프로젝트 루트에서 설치 스크립트를 내려받아 내용을 확인한 뒤 실행합니다.

```bash
curl -fsSL https://raw.githubusercontent.com/contentscoin/qrcoding-skill-mcp/main/install.sh -o /tmp/qrcoding-install.sh
cat /tmp/qrcoding-install.sh
bash /tmp/qrcoding-install.sh --project --mode=full --skip-key
```

자주 쓰는 설치 예:

```bash
# 현재 프로젝트에 전체 스킬 설치
bash /tmp/qrcoding-install.sh --project --mode=full --skip-key

# Codex 전역에 운영용 스킬 설치
bash /tmp/qrcoding-install.sh --codex --mode=ops --skip-key

# Claude Code 전역에 개발/설계용 스킬 설치
bash /tmp/qrcoding-install.sh --claude --mode=dev --skip-key
```

## 설치 구성

| 구성 | 설치 내용 | 추천 상황 |
|---|---|---|
| 개발용 | `qrcoding-integration-architect` | API key, MCP, OpenAPI plugin, Agent Skill 연동 설계 |
| 운영용 | `qrcoding-campaign-operator` | QR 생성, 조회, 렌더, 검증, 목적지 변경 |
| 전체 | 두 스킬 모두 | 개발과 운영을 모두 사용할 때 |

## 설치 대상

| 대상 | 설명 |
|---|---|
| 현재 프로젝트 | 현재 프로젝트의 `.agents/skills`에 설치 |
| Codex | Codex 기본 스킬 경로에 설치 |
| Claude Code | Claude Code 기본 스킬 경로에 설치 |
| Codex + Claude Code | 양쪽에 모두 설치 |
| 직접 경로 입력 | 원하는 스킬 설치 경로를 직접 입력 |

## 제공 스킬

| 스킬 | 용도 |
|---|---|
| `qrcoding-campaign-operator` | QR Agent Studio QR 생성, 조회, 렌더, 검증, 동적 목적지 변경을 API key와 MCP로 직접 처리합니다. |
| `qrcoding-integration-architect` | QR Agent Studio API, MCP, Agent Skill, OpenAPI plugin 연동을 설계하고 구현 계획을 작성합니다. |

## API key 바꾸기

설치 후 API key를 바꾸려면 셸 설정 파일의 `QRCODING_API_KEY` 값을 수정합니다.

```bash
export QRCODING_API_KEY="qras_your_key"
export QRCODING_MCP_URL="https://qrcoding-skill-mcp.vercel.app/mcp"
```

수정한 뒤 새 터미널을 열거나 아래 명령어로 현재 터미널에 반영합니다.

```bash
source ~/.zshrc
```

bash를 사용한다면:

```bash
source ~/.bashrc
```

## MCP로 사용하기

MCP 서버는 위 스킬의 도구 실행 버전입니다. 에이전트가 QR Agent Studio 도구를 직접 호출하고, API reference 섹션도 도구로 확인할 수 있습니다.

```bash
curl -fsSL https://raw.githubusercontent.com/contentscoin/qrcoding-skill-mcp/main/install-mcp.sh -o /tmp/qrcoding-install-mcp.sh
cat /tmp/qrcoding-install-mcp.sh
bash /tmp/qrcoding-install-mcp.sh
```

MCP 서버도 `QRCODING_API_KEY` 환경변수를 사용합니다.

대표 도구는 다음과 같습니다.

| 도구 | 설명 |
|---|---|
| `list_qr_codes` | QR 목록 조회 |
| `create_qr_code` | QR 생성 |
| `render_qr_code` | QR SVG/PNG/PDF 렌더 |
| `update_qr_destination` | 동적 QR 목적지 변경 |
| `validate_qr_scanability` | 스캔 가능성 검증 |
| `get_qr_analytics` | QR 스캔 분석 조회 |
| `get_account_status` | 계정/플랜/한도 확인 |
| `qrcoding_get_reference_section` | API/MCP reference 섹션 확인 |

## Hosted Gateway

웹 discovery와 Streamable HTTP MCP는 아래에서 제공됩니다.

| 문서 | URL |
|---|---|
| MCP Endpoint | `https://qrcoding-skill-mcp.vercel.app/mcp` |
| MCP Server Card | `https://qrcoding-skill-mcp.vercel.app/.well-known/mcp/server-card.json` |
| Agent Skills Index | `https://qrcoding-skill-mcp.vercel.app/.well-known/agent-skills/index.json` |
| OpenAPI | `https://qrcoding-skill-mcp.vercel.app/openapi.json` |

ChatGPT 앱에서 로컬 설치 없이 테스트하려면 Developer mode에서 원격 MCP 앱을 만들고 아래 형식의 URL을 붙여 넣습니다. 이 URL은 API key를 포함하므로 secret처럼 다루세요.

```text
https://qrcoding-skill-mcp.vercel.app/mcp?api_key=qras_your_key
```

Streamable HTTP MCP 예:

```bash
curl -sS -X POST https://qrcoding-skill-mcp.vercel.app/mcp \
  -H "content-type: application/json" \
  -H "accept: application/json, text/event-stream" \
  -H "x-api-key: $QRCODING_API_KEY" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

## 수동 설치

자동 설치가 어렵다면 저장소를 받은 뒤 직접 복사할 수 있습니다.

Codex:

```bash
mkdir -p ~/.agents/skills
cp -R skills/* ~/.agents/skills/
```

Claude Code:

```bash
mkdir -p ~/.claude/skills
cp -R skills/* ~/.claude/skills/
```

MCP 서버 파일은 `mcp/qrcoding_mcp.mjs`입니다.

## 개발

```bash
npm install
npm test
npm run build
```

## 배포

Hosted gateway는 Vercel로 배포합니다.

```bash
vercel deploy -y
vercel deploy --prod -y
```

`QRCODING_BASE_URL`로 gateway가 프록시할 QR Agent Studio origin을 지정할 수 있습니다.
