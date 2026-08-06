# Tabilog (타비로그) v2.2 프로젝트 계획서

## 개요
- 프로젝트명: Tabilog (Tabi + Log)
- 핵심 가치: 리뷰 작성 강요 없는 개인 여행 기록 + Upstage Solar AI 감성 분석
  + 100% 무료 클라우드 인프라 기반 풀스택 포트폴리오

## 핵심 플로우
소셜 로그인 → EXIF 사진 선택(자동 핀/시간) → Solar 감성 일기/뱃지
→ 경로 애니메이션 재생 → 통계 리포트 / 앱 내 공유

## 기술 스택
| 구분 | 기술 | 역할 |
|---|---|---|
| Frontend | React Native (Expo) | Android 타겟 (iOS는 추후 기기 확보 시 재검증) |
| 상태/애니메이션 | Reanimated, Zustand | 지도 애니메이션, 전역 상태 |
| Backend | FastAPI (Python) | REST API, JWT 검증, Upstage 연동 |
| Backend 배포 | Render | 무료 웹 서비스 (월 750h) |
| AI | Upstage Solar API | 감성 에세이, 감성 뱃지 |
| Storage | Cloudinary | 이미지 CDN, 클라이언트 Direct Upload |
| DB/Auth | Supabase | PostgreSQL + Auth (Kakao/Google) |

## DB 스키마
- `users`: id(PK, Supabase Auth UUID), email, nickname, created_at
- `trips`: id(PK), user_id(FK), title, start_date, end_date, solar_summary, sentiment_badge, total_distance, is_public, created_at
- `places`: id(PK), trip_id(FK), name, latitude, longitude, visit_order, memo, rating, visited_at
- `photos`: id(PK), place_id(FK), photo_url, created_at

## 로드맵 (Phase)
- **Phase 1**: 개발 환경 & 클라우드 인프라 세팅
  (monorepo 구조 `/apps/app`, `/apps/server`, Supabase Auth, Cloudinary unsigned preset)
- **Phase 2**: 백엔드 API & DB 구축
  (Supabase DDL, FastAPI JWT 미들웨어 + CRUD, Upstage Solar 연동)
- **Phase 3**: 프론트엔드 UI & EXIF 스마트 입력
  (Expo UI, EXIF 메타데이터 자동 추출, Cloudinary Direct Upload)
- **Phase 4**: 지도 애니메이션 & 공유 기능 구현
  (Reanimated 경로 재생, 앱 내 이미지/링크 공유)
- **Phase 5**: 통계 리포트 카드 & 최종 배포
  (통계 카드 이미지 렌더링, Render 백엔드 배포 + EAS Build로 Android 앱 빌드)

## 검증이 필요한 리스크 (착수 전 스파이크 대상)
1. ~~**react-native-maps + Expo Web 호환성**~~ — **[해결됨]** 스파이크 결과
   react-native-maps는 Web 번들링 단계에서부터 실패, 대안(react-leaflet,
   MapLibre+OpenFreeMap)도 비용 대비 이득이 낮아 **Web 플랫폼 지원을 포기**하고
   Android(+iOS) Expo 앱에 집중하기로 결정. 상세 내용은 `DECISION_LOG.md` 참조.
2. **EXIF 데이터 소실** — 카카오톡/인스타 경유 사진, 스크린샷은 EXIF 없음.
   수동 위치 지정 fallback을 핵심 플로우에 포함할 것.
3. ~~**Cloudinary unsigned preset 노출 리스크**~~ — **[해결됨]** `tabilog_unsigned`
   preset에 폴더 고정/포맷 제한/10MB 크기 제한/public_id 강제를 설정하고
   curl로 실제 거부 동작까지 확인. 상세 내용은 `DECISION_LOG.md` 참조.
4. **게스트 모드 → 로그인 전환 시 데이터 병합 정책** — 미정, Phase 2에서 결정 필요.
5. ~~**Upstage Solar API 호출 실패/타임아웃 시 fallback UX**~~ — **[해결됨]**
   실패 시 DB는 유지하고 502만 반환, 자동 재시도는 하지 않음(사용자가 다시
   호출). 상세 내용은 `DECISION_LOG.md` 참조.

## 작업 원칙
- 한 번에 하나의 Phase만 진행. 다음 Phase로 넘어가기 전 사용자 승인 필요.
- 리스크가 큰 기술 선택(위 리스크 목록)은 기능 구현 전에 최소 스파이크로 먼저 검증.
- 코드 작성 전, 어떤 파일/디렉토리를 만들지 계획을 먼저 제시하고 승인받을 것.
- 각 Phase/주요 결정마다 `DECISION_LOG.md`에 기록.