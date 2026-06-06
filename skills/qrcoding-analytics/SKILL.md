---
name: qrcoding-analytics
description: QR 스캔 수·추이·기기/국가/referrer 분석 요청을 분류하고 실행은 qrcoding-campaign-operator로 위임하는 라우터.
disable-model-invocation: false
allowed-tools: "Read"
---

# QR Coding Analytics

"몇 명이 스캔했어", "추이 보여줘", "어느 지역/기기에서 봤어", "이번 주 성과" 같은 분석 요청을 분류한다. 실제 도구 호출은 `qrcoding-campaign-operator`로 위임한다.

## 분류 순서

1. **총 스캔 / 마지막 스캔 시각** (한 QR 또는 워크스페이스 전체): `get_qr_analytics`.
2. **상세 분석** — 일별 시계열, 기기(mobile/tablet/desktop/bot), 상위 국가, 상위 referrer 도메인: `get_qr_analytics_detail` (선택: `days` 윈도우).

## 위임 + 주의

- 분류가 끝나면 조회는 `qrcoding-campaign-operator`로 위임한다.
- 집계값만 제공한다. 개별 스캐너의 신원/정확한 위치/IP는 저장하지 않는다.
- 국가·기기 분석은 **수집 시작 이후의 스캔**에만 존재한다(소급 불가). 데이터가 비어 있으면 이 점을 사용자에게 설명한다.
- 동적 QR만 스캔이 기록된다(정적 QR은 /r 리다이렉트가 없어 집계 대상이 아니다).
