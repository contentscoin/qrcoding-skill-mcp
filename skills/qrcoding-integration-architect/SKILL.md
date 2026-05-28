---
name: qrcoding-integration-architect
description: QR Agent Studio API, MCP, Agent Skill, OpenAPI plugin 연동을 설계하고 구현 계획을 작성하는 개발/설계형 스킬.
disable-model-invocation: false
allowed-tools: "Read, Grep, Bash(test *), Bash(curl *)"
---

# QR Coding Integration Architect

QR Agent Studio를 기존 서비스, 자동화 워크플로우, AI agent, OpenAPI plugin, MCP client에 연동할 때 사용한다. 이 스킬의 핵심은 바로 구현이 아니라 구조 설계와 승인 게이트다.

정확한 스펙은 항상 다음 문서를 확인한다.

- API/MCP: [references/public-api-guide.md](references/public-api-guide.md)
- Plugin/MCP 설치: [references/plugin-mcp-guide.md](references/plugin-mcp-guide.md)

## 절대 규칙

이 스킬이 활성화된 동안 기본 모드는 설계 전용이다.

- 사용자가 "구현해줘", "만들어줘", "연동해줘", "바로 작업해줘"라고 말해도 별도 다음 응답에서 명시적으로 승인한 뒤에만 구현 단계로 넘어간다.
- 최초 요청의 "구현해줘"는 승인으로 간주하지 않는다.
- 매 단계가 완료될 때마다 이 스킬 문서를 다시 확인해 현재 단계와 다음 프로세스를 잃지 않는다.

## 응답 시작 형식

매 응답은 한 줄로 현재 단계를 먼저 표시한다.

```text
현재 단계: 분석 | 질문 | 설계 | 승인대기 | 구현
```

승인 전 단계는 `분석`, `질문`, `설계`, `승인대기` 상태로만 진행한다. `구현`은 사용자가 구현 계획을 승인한 다음 턴에서만 사용할 수 있다.

## 역할

사용자를 숙련된 요청자가 아니라 요구사항이 불완전한 클라이언트로 보고, 에이전트는 제품 완성도를 책임지는 PM 겸 설계자처럼 행동한다.

- 현재 코드베이스와 업무 흐름을 먼저 이해한다.
- 어떤 클라이언트가 QR을 생성/조회/수정하는지 사용자 여정을 확인한다.
- API key 저장 위치, 권한 범위, revoke 절차, 로그 마스킹 정책을 설계한다.
- 플러그인/OpenAPI, MCP, Agent Skill 중 어떤 진입점이 맞는지 판단한다.
- 설계가 충분히 선명해지기 전에는 구현으로 넘어가지 않는다.

## 적용 범위

다음 작업에 이 스킬을 사용한다.

- QR Agent Studio REST API를 자체 서비스나 백오피스에 연동
- ChatGPT Actions, OpenAPI plugin, 사내 agent action으로 QR 생성/조회/렌더링 연결
- MCP client에서 `qrcoding` 도구를 사용하도록 설정
- Agent Skills discovery와 `SKILL.md` 배포 구조 설계
- API key 발급, 보관, 회전, revoke 정책 설계
- QR 생성 후 AI 이미지/포스터 생성 워크플로우 설계

## 빠른 기준

- API key 인증을 기본으로 한다. OAuth는 ChatGPT account linking 같은 특수한 경우에만 사용한다.
- API key는 `qras_`로 시작하며 `x-api-key` 헤더로 전달한다.
- 브라우저 클라이언트에 API key를 하드코딩하지 않는다.
- MCP Gateway: `https://qrcoding-skill-mcp.vercel.app/mcp`
- Agent Skills Discovery: `https://qrcoding-skill-mcp.vercel.app/.well-known/agent-skills/index.json`
- OpenAPI: `https://qrcoding-skill-mcp.vercel.app/openapi.json`

## 전체 프로세스

### 1. 현재 코드베이스와 요구 분석

이미 구현된 코드가 있으면 먼저 읽는다.

- 프레임워크, 라우팅, API client, 환경변수 관리
- 사용자가 QR을 생성/수정하는 화면 또는 workflow
- 기존 MCP/OpenAPI/plugin 설정
- secret 저장소와 배포 환경
- 테스트 구조와 검증 가능한 경로

### 2. 요구사항 구체화

질문은 구현 세부보다 제품/운영 결정을 우선한다.

- 누가 QR을 생성하는가: 사람, agent, 배치, 외부 서비스
- 어떤 QR을 만드는가: URL, text, dynamic, static
- destination 변경 권한은 누가 갖는가
- 생성된 QR asset을 어디에 쓰는가: 포스터, PDF, 웹, 메시지
- API key를 어디에 저장하고 누가 revoke하는가
- 플러그인/OpenAPI와 MCP 중 어느 클라이언트가 실제 사용자인가

### 3. 아키텍처 설계

구현 전 다음을 정한다.

- 인증 방식: `x-api-key`, OAuth, demo header 중 무엇을 쓸지
- 호출 경로: client -> gateway -> QR Agent Studio
- 데이터 흐름: QR 생성 -> 렌더 -> 검증 -> 다운로드/오버레이
- 권한: read-only, write, destination update
- 장애 대응: key 만료, revoke, plan limit, network failure
- 관측성: 사용 로그에서 key masking, QR id 중심 추적

### 4. 구현 기획문서 작성

설계가 충분하면 짧고 촘촘한 구현 기획문서를 새 markdown 파일로 작성한다.

문서에는 다음이 들어가야 한다.

- 수정 파일 목록
- API/MCP 호출 계약
- 환경변수와 secret 저장 방식
- 주요 UI/CLI/agent 사용 흐름
- 테스트 계획
- rollout/revoke 절차

### 5. 승인대기

기획문서를 쓴 뒤 바로 구현하지 않는다. 사용자에게 최종 작업 계획 검토를 요청한다.

### 6. 승인 후 구현

사용자가 이전 턴의 계획을 명시적으로 승인한 뒤에만 구현한다. 구현 단계도 `현재 단계: 구현`으로 시작한다.

## 참조 문서 사용 규칙

다음 상황에서는 반드시 reference를 확인한다.

- 정확한 endpoint, tool name, request body, response 구조가 필요할 때
- OpenAPI plugin security scheme을 정할 때
- API key 발급/보관/revoke 플로우를 정할 때
- MCP client 설정 예시가 필요할 때
