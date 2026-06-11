---
name: qrcoding-designer
description: 로고·브랜드 색상·디자인이 들어간 QR 요청을 분류하고 실행은 qrcoding-campaign-operator로 위임하는 라우터.
disable-model-invocation: false
allowed-tools: "Read"
---

# QR Coding Designer

"로고 넣어줘", "브랜드 색으로", "예쁜/디자인 QR", "명함 느낌" 같은 디자인 요청을 분류한다. 실제 도구 호출은 `qrcoding-campaign-operator`로 위임한다.

## 분류 순서

1. **로고**: 이미지를 `upload_logo`로 검증해 `logoDataUri`를 받고 `design.logoDataUri`로 전달한다. PNG/JPG/WebP만 허용(SVG 소스 불가), 100KB 이하. 로고가 있으면 중앙에 삽입되고 오류정정이 자동으로 H로 올라간다. 로고는 SVG·PNG·PDF 내보내기에 모두 포함된다(PNG/PDF는 로고 포함 SVG를 래스터화).
2. **색·모양**: foreground/background, eyeShape, moduleShape, quietZone, errorCorrection. 커스텀 디자인은 Pro 플랜이며, 무료 플랜은 기본 템플릿(classic/studio/mono)만 사용한다.
3. **캠페인 전체 브랜딩**: 같은 로고/색을 여러 QR에 적용하려면 `create_qr_batch`의 `defaultDesign`으로 한 번에 지정한다.

## 위임 + 검증

- 디자인 결정이 끝나면 생성/렌더는 `qrcoding-campaign-operator`로 위임한다.
- 만든 뒤 `validate_qr_scanability`로 스캔 가능성을 확인한다(로고 커버리지·오류정정 점검).
- 지원 옵션이 헷갈리면 `get_capabilities`를 먼저 확인한다.
