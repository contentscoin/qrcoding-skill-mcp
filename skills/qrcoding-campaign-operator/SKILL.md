---
name: qrcoding-campaign-operator
description: QR Agent Studio QR 생성, 조회, 렌더, 검증, 동적 목적지 변경을 API key와 MCP로 직접 처리하는 운영형 스킬.
disable-model-invocation: false
allowed-tools: "Read, Grep, Bash(test *), Bash(curl *)"
---

# QR Coding Campaign Operator

사용자의 자연어 요청을 QR Agent Studio MCP 또는 REST API 호출로 수행한다. 이 skill은 구현 설계가 아니라, 에이전트가 사용자를 대신해 QR 캠페인을 운영하기 위한 실행 절차다.

상세 엔드포인트와 요청/응답 예시는 필요할 때 [references/public-api-guide.md](references/public-api-guide.md)를 확인한다.

## 기본 설정

- Skill/MCP Gateway: `https://qrcoding-skill-mcp.vercel.app`
- MCP Endpoint: `https://qrcoding-skill-mcp.vercel.app/mcp`
- API Base URL: `https://qrcoding-skill-mcp.vercel.app`
- 인증 헤더: `x-api-key`
- API Key는 `QRCODING_API_KEY` 환경변수에서 읽는 것을 기본으로 한다.
- 실제 API Key를 답변, 로그, QR payload, markdown, public URL, screenshot에 노출하지 않는다.
- QR Coding MCP 도구가 사용 가능하면 MCP를 우선 사용한다.
- MCP 도구가 없거나 실패했을 때만 `curl` fallback을 사용한다.
- `curl` fallback 실행 전 `QRCODING_API_KEY`가 없으면 사용자에게 키 설정을 요청하고 API 호출을 멈춘다.

```bash
GATEWAY_URL="${QRCODING_MCP_URL:-https://qrcoding-skill-mcp.vercel.app/mcp}"
BASE_URL="${QRCODING_BASE_URL:-https://qrcoding-skill-mcp.vercel.app}"
test -n "$QRCODING_API_KEY"
```

## 실행 도구 우선순위

1. QR Coding MCP 도구가 있으면 MCP를 우선 사용한다.
2. MCP 도구가 없거나 MCP 호출이 실패하면 `QRCODING_API_KEY` 환경변수와 `curl`로 직접 호출한다.
3. 실제 API Key, `x-api-key` 헤더 값, 발급된 full key를 답변이나 로그에 노출하지 않는다.

주요 MCP 도구:

| 작업 | MCP 도구 |
|---|---|
| 지원 기능/한도 확인 (먼저 확인) | `get_capabilities` |
| QR 검색 | `search` |
| 검색 결과 상세 조회 | `fetch` |
| 이미지 삽입용 QR 준비 | `prepare_qr_for_image` |
| QR 생성 (URL/텍스트/WiFi/vCard/이메일/SMS/전화/위치/일정) | `create_qr_code` |
| 일괄 생성 (캠페인) | `create_qr_batch` |
| CSV 가져오기 | `import_qr_csv` |
| 로고 검증/준비 | `upload_logo` |
| 저장된 로고 라이브러리 조회 | `list_logos` |
| 저장된 로고 삭제 | `delete_logo` |
| QR 렌더링 | `render_qr_code` |
| QR JSON 스펙 조회 | `get_qr_spec` |
| 동적 QR 목적지 변경 | `update_qr_destination` |
| 스마트 라우팅 (기기/지역/언어/스케줄/AB/만료/비밀번호) | `set_qr_routing` |
| 앱 딥링크/유니버설 링크 QR (iOS/Android/데스크톱 분기) | `create_app_link` |
| QR 보관/비활성화 | `archive_qr_code` |
| QR 목록 조회 | `list_qr_codes` |
| AI 이미지 오버레이 지시문 생성 | `compose_qr_overlay` |
| 스캔 가능성 검증 | `validate_qr_scanability` |
| 분석 조회 (총 스캔) | `get_qr_analytics` |
| 분석 상세 (추이/기기/국가/referrer) | `get_qr_analytics_detail` |
| 계정/요금제 상태 조회 | `get_account_status` |

## 의도 매핑

사용자 요청을 다음 작업 중 하나로 분류한다.

| 사용자 의도 | 우선 도구 | fallback API |
|---|---|---|
| 뭘 할 수 있어? / 이거 지원돼? | `get_capabilities` | (인증 불필요) |
| QR 목록 보여줘, 캠페인 찾아줘 | `list_qr_codes`, `search` | `GET /v1/qr-codes` |
| 특정 QR 상세 확인 | `get_qr_spec`, `fetch` | `GET /v1/qr-codes/{id}` |
| 새 QR 만들어줘 (URL/WiFi/vCard 등) | `create_qr_code` | `POST /v1/qr-codes` |
| 여러 개 한 번에 / 캠페인 | `create_qr_batch` | `POST /v1/qr-codes/batch` |
| CSV/스프레드시트로 만들어줘 | `import_qr_csv` | `POST /v1/qr-codes/import` |
| 로고 넣어줘 | `upload_logo` → `create_qr_code`(design.logoDataUri 또는 design.logoAssetId) | `POST /v1/logos` |
| 저장된 로고 보여줘/지워줘 | `list_logos`, `delete_logo` | `GET /v1/logos`, `DELETE /v1/logos/{id}` |
| 이미지/포스터에 넣을 QR 준비 | `prepare_qr_for_image` | `POST /v1/qr-codes`, `POST /v1/qr-codes/{id}/render` |
| SVG/PNG/PDF 다시 만들어줘 | `render_qr_code` | `POST /v1/qr-codes/{id}/render` |
| 동적 QR 목적지 바꿔줘 | `update_qr_destination` | `PATCH /v1/qr-codes/{id}/destination` |
| 기기/지역/스케줄/AB/비밀번호로 분기 | `set_qr_routing` | `PATCH /v1/qr-codes/{id}/routing` |
| 앱 설치 유도 / iOS·Android·데스크톱 다른 링크 | `create_app_link` | `POST /v1/app-links` |
| QR 보관/비활성화, 한도 확보 | `archive_qr_code` | `POST /v1/qr-codes/{id}/archive` |
| 스캔 가능성 확인 | `validate_qr_scanability` | `POST /v1/qr-codes/{id}/validate` |
| 스캔 수 확인 | `get_qr_analytics` | `GET /v1/analytics` |
| 스캔 추이/기기/국가/referrer | `get_qr_analytics_detail` | `GET /v1/analytics/detail`, `GET /v1/qr-codes/{id}/analytics/detail` |
| 현재 플랜/한도 확인 | `get_account_status` | `GET /v1/account` |

## 지원 범위 먼저 확인

기능 가능 여부가 불확실하면(WiFi/vCard QR, 로고 삽입, 지역별 분석 등) 추측하지 말고 먼저 `get_capabilities`를 호출해 지원 목록과 `notSupportedYet`를 확인한다. 지원하지 않는 기능은 사용자에게 명확히 알린다.

## Error → 복구

상태 변경 도구는 `{code, message, fixHint, nextTool}`를 반환할 수 있다. 원본 에러를 그대로 보여주지 말고 다음으로 복구한다.

| code | 의미 | 복구 |
|---|---|---|
| `upgrade_required` | 무료 한도 초과 또는 유료 기능 | 한도면 `archive_qr_code`로 슬롯 확보 제안, 아니면 `pricingUrl` 안내 |
| `not_found` | id 없음 | `list_qr_codes`/`search`로 id 재확인 |
| dynamic 요구 실패 | static QR엔 목적지 변경 불가 | 동적 QR로 새로 만들거나 올바른 동적 QR id 사용 |
| `forbidden_origin` / 인증 실패 | 키/세션 문제 | `get_account_status`로 인증 확인, 키 재설정 안내 |

## 실행 전 확인 규칙

정보가 부족하면 API를 추측해서 호출하지 말고 필요한 항목만 짧게 묻는다.

- QR 생성: 이름, payload 종류(`url` 또는 `text`), payload 값이 필요하다.
- 동적 QR 생성: URL payload와 destination URL이 `http(s)` URL이어야 한다.
- 동적 목적지 변경: `id`와 새 destination URL이 필요하며, 이미 인쇄된 QR의 실제 도착지가 바뀐다.
- PDF 렌더: 플랜에 따라 제한될 수 있다.
- API Key 생성/폐기: full key는 한 번만 표시되므로 사용자가 저장할 준비가 되어 있어야 한다.

다음 호출은 상태 변경 또는 사용량/한도에 영향을 줄 수 있으므로 사용자가 명시적으로 요청했을 때만 실행한다.

- QR 생성
- 동적 QR 목적지 변경
- QR 보관/archive
- API Key 발급 또는 revoke

## 표준 실행 흐름

1. 의도를 분류한다.
2. 필요한 식별자와 필수 입력값이 있는지 확인한다.
3. 스키마가 헷갈리면 `references/public-api-guide.md`에서 해당 API 섹션을 읽는다.
4. QR Coding MCP 도구가 있으면 MCP로 호출한다.
5. MCP 도구가 없거나 실패하면 `curl` fallback으로 API를 호출한다.
6. 성공이면 사용자가 필요한 결과만 요약한다.
7. 실패이면 `code`, `message`, 플랜 제한 여부를 기준으로 원인과 다음 조치를 말한다.

## MCP 실행 규칙

MCP 도구를 사용할 때도 상태 변경 작업은 사용자가 명시적으로 요청했을 때만 실행한다.

- `create_qr_code`
- `prepare_qr_for_image` with `createIfMissing !== false`
- `update_qr_destination`

MCP 도구의 응답도 원본 전체를 그대로 보여주지 말고, 사용자에게 필요한 필드만 요약한다.

## curl fallback

아래 예시는 QR Coding MCP 도구를 사용할 수 없을 때만 사용한다.

### QR 목록 조회

```bash
curl -sS "$BASE_URL/v1/qr-codes" \
  -H "x-api-key: $QRCODING_API_KEY"
```

### QR 생성

```bash
curl -sS -X POST "$BASE_URL/v1/qr-codes" \
  -H "content-type: application/json" \
  -H "x-api-key: $QRCODING_API_KEY" \
  -d '{
    "name": "Campaign QR",
    "type": "dynamic",
    "payload": { "kind": "url", "value": "https://example.com" },
    "destinationUrl": "https://example.com",
    "design": { "templateId": "classic" },
    "renderOptions": { "format": "svg", "size": 512, "margin": 4 }
  }'
```

### 렌더링

```bash
curl -sS -X POST "$BASE_URL/v1/qr-codes/{id}/render" \
  -H "content-type: application/json" \
  -H "x-api-key: $QRCODING_API_KEY" \
  -d '{ "format": "svg", "size": 512, "margin": 4 }'
```

### 동적 목적지 변경

```bash
curl -sS -X PATCH "$BASE_URL/v1/qr-codes/{id}/destination" \
  -H "content-type: application/json" \
  -H "x-api-key: $QRCODING_API_KEY" \
  -d '{ "destinationUrl": "https://example.com/new" }'
```

실행 후에는 QR id, dynamic URL, destination URL, checksum, scanability score처럼 사용자가 확인해야 할 값만 요약한다.
