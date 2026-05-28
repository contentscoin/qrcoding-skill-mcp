# qrcoding 스킬과 MCP

ChatGPT + Codex, OpenAPI plugin, MCP client에서 QR Agent Studio를 쉽게 쓰기 위한 Agent Skills와 MCP 서버입니다.

이 저장소를 설치하면 에이전트가 QR 코드를 생성, 조회, 렌더링, 검증하거나 동적 QR 목적지를 변경할 때 필요한 절차와 reference를 바로 사용할 수 있습니다.

## 설치 전 준비

설치에는 Node.js 18 이상이 필요합니다.

QR Agent Studio API key도 준비해 주세요. 키는 QR Agent Studio 대시보드의 **Skills & MCP** 패널에서 발급합니다. ChatGPT + Codex 흐름에서는 이 키를 ChatGPT URL에 넣지 않고 private MCP proxy의 `QRCODING_API_KEY` 환경변수로 저장합니다.

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

# ChatGPT에서 Codex를 불러 쓰는 브리지까지 전체 설치
bash /tmp/qrcoding-install.sh --codex --mode=full --skip-key
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
| `qrcoding-chatgpt-codex-bridge` | ChatGPT에서 Secure MCP Tunnel을 연결하고 Codex에 QR Coding 작업을 넘기는 프롬프트/설치 경로를 안내합니다. |

## ChatGPT + Codex Secure Tunnel 경로

추천 흐름은 공개 MCP URL에 `?api_key=`를 붙이는 방식이 아니라, private MCP proxy가 QR Agent Studio API key를 가지고 OpenAI Secure MCP Tunnel로 ChatGPT + Codex에 연결하는 방식입니다.

1. **Private MCP proxy 준비**: proxy 서버 또는 Codex 환경에 `QRCODING_API_KEY`를 설정합니다.
2. **Tunnel client 실행**: OpenAI Platform에서 만든 `tunnel_id`와 runtime API key로 `tunnel-client`를 실행합니다.
3. **ChatGPT connector 연결**: ChatGPT connector에서 Connection을 `Tunnel`로 선택하고 `tunnel_id`를 고르거나 붙여넣습니다.
4. **ChatGPT -> Codex 스킬화**: `qrcoding-chatgpt-codex-bridge`의 handoff prompt로 Codex에게 QR Coding 스킬과 터널 도구를 사용하도록 지시합니다.

## API key 바꾸기

설치 후 API key를 바꾸려면 private MCP proxy 또는 Codex 환경의 `QRCODING_API_KEY` 값을 수정합니다.

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

Secure MCP Tunnel로 ChatGPT + Codex에 연결할 때는 private MCP proxy에서 아래처럼 준비합니다.

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

`CONTROL_PLANE_API_KEY`는 대상 tunnel에 대해 Tunnels Read + Use 권한이 필요합니다. tunnel을 만들거나 수정하는 운영자에게만 Tunnels Read + Manage 권한을 부여하세요.

ChatGPT에는 `qras_` 키나 `?api_key=` URL을 넣지 않습니다. ChatGPT connector에서는 `Tunnel`을 선택하고 `tunnel_id`만 연결합니다. Codex/API 흐름에서는 해당 OpenAI product surface에서 제공하는 tunnel-backed MCP target을 사용합니다.

ChatGPT 터널 세팅 흐름:

1. `2-1` ChatGPT 웹 열기: `https://chatgpt.com/`. 올바른 workspace/account가 보이면 완료입니다.
2. `2-2` 앱 생성 권한 켜기: `Workspace Settings -> Permissions & Roles -> Connected Data -> Developer mode / Create custom MCP connectors 켜기`를 복사합니다. developer/custom MCP connector 생성 권한이 켜지면 완료입니다.
3. `2-3` QR 앱 만들기: `Workspace Settings -> Apps -> Create -> Connection: Tunnel -> Scan Tools`를 복사합니다. 앱 생성 화면에서 `Connection: Tunnel`이 선택되면 완료입니다.
4. `2-4` 터널 연결하기: `https://chatgpt.com/#settings/Connectors`를 열고 `tunnel_id`를 선택하거나 붙여넣은 뒤 `Scan Tools`를 실행하고 검색된 QR 도구를 저장합니다.
5. `2-5` private proxy 쪽 실행: 대시보드의 터널 가이드를 복사하고 private proxy 머신에서만 플레이스홀더를 교체합니다. `tunnel-client run`이 계속 실행되면 완료입니다.

메뉴가 보이지 않으면 요금제, workspace 관리자/소유자 권한, RBAC 개발자 권한, ChatGPT 웹 접속 여부를 확인하세요. MCP 앱은 모바일에서 사용할 수 없습니다.

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

Hosted gateway는 server card, skill discovery, OpenAPI, legacy/dev client 테스트용입니다. ChatGPT + Codex 운영 흐름에서는 private MCP proxy와 Secure MCP Tunnel을 우선 사용하세요.

Legacy/dev client에서만 쿼리 인증이 필요하면 `/mcp?api_key=<YOUR_QR_AGENT_STUDIO_API_KEY>` 형식을 사용할 수 있지만, 이 URL 자체가 secret이므로 ChatGPT에는 붙이지 않습니다.

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
