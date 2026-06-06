---
name: qrcoding-quickstart
description: QR 코드를 처음 만드는 사용자를 위한 빠른 시작 라우터. 의도를 분류하고 실행은 qrcoding-campaign-operator로 위임한다.
disable-model-invocation: false
allowed-tools: "Read"
---

# QR Coding Quickstart

"QR 만들어줘", "이 링크로 QR", "메뉴/포스터에 넣을 QR" 같은 첫 생성 요청을 가볍게 분류만 한다. 실제 도구 호출 절차는 `qrcoding-campaign-operator` 스킬에 있으므로 여기서 재문서화하지 않는다.

## 분류 순서

1. 무엇을 인코딩하나: URL · 텍스트 · WiFi · 연락처(vCard) · 이메일 · 문자(SMS) · 전화 · 위치(geo) · 일정(calendar).
2. 동적 vs 정적: 나중에 목적지를 바꾸거나 스캔 수를 보고 싶으면 **동적**(URL만 가능). 그 외에는 정적. 링크는 기본 동적으로 제안한다.
3. 여러 개를 한 번에 만드는 캠페인이면 일괄 생성/ CSV 가져오기로 안내한다.

## 위임

분류가 끝나면 `qrcoding-campaign-operator`의 절차로 넘겨 실제 생성을 수행한다(예: `create_qr_code`, 일괄은 `create_qr_batch`, CSV는 `import_qr_csv`).

- 지원 여부가 불확실하면(예: 특정 콘텐츠 타입·로고·지역 분석) 추측하지 말고 먼저 `get_capabilities`를 확인한다.
- 생성 후에는 QR id, 동적 URL, 렌더 링크처럼 사용자가 바로 쓸 값만 요약한다.

연결이 아직 안 됐다면 `qrcoding-connect`를 안내한다.
