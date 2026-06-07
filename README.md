# qrcoding 스킬과 MCP

ChatGPT + Codex, OpenAPI plugin, MCP client에서 QR Agent Studio를 쉽게 쓰기 위한 Agent Skills와 MCP 서버입니다.

이 저장소를 설치하면 에이전트가 QR 코드를 생성, 조회, 렌더링, 검증하거나 동적 QR 목적지를 변경할 때 필요한 절차와 reference를 바로 사용할 수 있습니다.

## 설치 전 준비

설치에는 Node.js 18 이상이 필요합니다.

QR Agent Studio API key도 준비해 주세요. 키는 QR Agent Studio 대시보드의 **Skills & MCP / Connect** 패널에서 발급합니다. Claude Code·Codex는 이 키를 `x-api-key` 헤더 또는 `QRCODING_API_KEY` 환경변수로 사용하고, ChatGPT는 대시보드가 안내하는 커넥터 URL(키가 경로에 포함)로 연결합니다.

```text
Dashboard > Skills & MCP > Create API key
```

API key는 `qras_`로 시작합니다.

## 설치하기

프로젝트 루트에서 설치 스크립트를 내려받아 내용을 확인한 뒤 실행합니다.

```bash
curl -fsSL https://raw.githubusercontent.com/contentscoin/qrcoding-skill-mcp/main/install.sh -o /tmp/qrcoding-install.sh
cat /tmp/qrcoding-install.sh
bash /tmp/qrcoding-install.sh --project --skip-key
```

기본 구성은 `ops`(운영)입니다. 자주 쓰는 설치 예:

```bash
# 현재 프로젝트에 운영 구성(기본) 설치
bash /tmp/qrcoding-install.sh --project --skip-key

# Codex 전역에 운영 구성 설치
bash /tmp/qrcoding-install.sh --codex --mode=ops --skip-key

# 연동 설계 + ChatGPT 브리지까지 전체 설치
bash /tmp/qrcoding-install.sh --codex --mode=full --skip-key
```

## 설치 구성

| 구성 | 설치 내용 | 추천 상황 |
|---|---|---|
| 운영용 (`ops`, 기본) | 운영 코어 + 빠른시작·디자인·분석 라우터 + 연결 | 대부분의 사용자 |
| 개발용 (`dev`) | 연동 설계 + ChatGPT 브리지 + 연결 | API/MCP/plugin 연동을 설계할 때 |
| 전체 (`full`) | 위 전부 | 모든 스킬을 한 번에 |

## 설치 대상

| 대상 | 설명 |
|---|---|
| 현재 프로젝트 | 현재 프로젝트의 `.agents/skills`에 설치 |
| Codex | Codex 기본 스킬 경로에 설치 |
| Claude Code | Claude Code 기본 스킬 경로에 설치 |
| Codex + Claude Code | 양쪽에 모두 설치 |
| 직접 위치 지정 | 원하는 스킬 설치 위치를 직접 입력 |

## 제공 스킬

| 스킬 | 용도 |
|---|---|
| `qrcoding-campaign-operator` | 실행 코어. QR 생성·일괄/CSV·렌더·로고·라우팅·분석·목적지 변경을 API key와 MCP로 직접 처리합니다. |
| `qrcoding-quickstart` | 첫 QR 생성 의도를 분류해 operator로 위임하는 얇은 라우터. |
| `qrcoding-designer` | 로고·브랜드 색·디자인 요청을 분류해 operator로 위임하는 라우터. |
| `qrcoding-analytics` | 스캔 수·추이·기기/국가 분석 요청을 분류해 operator로 위임하는 라우터. |
| `qrcoding-connect` | Claude Code·Codex·ChatGPT 연결을 한 곳에서 안내합니다. |
| `qrcoding-integration-architect` | API, MCP, Agent Skill, OpenAPI plugin 연동을 설계하고 구현 계획을 작성합니다(opt-in). |

## ChatGPT 연결

ChatGPT는 헤더 인증을 지원하지 않으므로 API key를 커스텀 커넥터 URL 경로에 넣어 연결합니다(유료 플랜·데스크톱 웹, OAuth·터널 불필요).

1. **키 발급 + URL 복사**: QR Agent Studio 대시보드 Connect 패널에서 키를 발급하고 ChatGPT용 커넥터 URL 전체를 복사합니다(키가 `…/mcp/<키>` 경로에 포함됨).
2. **커스텀 커넥터 추가**: ChatGPT → 설정 → Connectors → Developer mode → Add custom connector에 그 URL을 붙여넣고 Authentication은 `No authentication`을 선택합니다.
3. **사용**: 연결되면 새 대화에서 QR 생성·검증·수정을 자연어로 요청합니다.

커넥터 URL은 키를 담고 있으니 비밀번호처럼 다루고, 유출되면 대시보드에서 해당 키를 폐기합니다. 자세한 클라이언트별 안내는 `qrcoding-connect` 스킬을 참고하세요.

## API key 바꾸기

설치 후 API key를 바꾸려면 MCP client 또는 Codex 환경의 `QRCODING_API_KEY` 값을 수정합니다.

```bash
export QRCODING_API_KEY="<YOUR_QR_AGENT_STUDIO_API_KEY>"
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

Claude Code·Codex는 `x-api-key` 헤더 또는 `QRCODING_API_KEY` 환경변수로 게이트웨이 MCP에 연결합니다. ChatGPT는 위 "ChatGPT 연결" 섹션처럼 커스텀 커넥터 URL(키가 경로에 포함)을 `No authentication`으로 연결합니다 — 별도 터널이나 proxy는 필요 없습니다. 메뉴가 보이지 않으면 요금제, workspace 관리자/소유자 권한, ChatGPT 데스크톱 웹 접속 여부를 확인하세요(모바일 미지원).

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

Hosted gateway는 server card, skill discovery, OpenAPI, Claude Code/Codex 등 헤더 인증 MCP client용입니다. ChatGPT는 대시보드 Connect 패널의 커스텀 커넥터 URL로 연결합니다.

API 키는 `x-api-key` 헤더 또는 private proxy의 `QRCODING_API_KEY` 환경변수로만 전달합니다. URL 쿼리(`?api_key=`/`?key=`)는 더 이상 인증으로 사용되지 않습니다 — 쿼리 문자열은 CDN·프록시·접속 로그에 남기 때문입니다(게이트웨이는 전달 전 해당 파라미터를 제거합니다).

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
