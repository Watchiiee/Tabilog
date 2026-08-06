# Decision Log — Tabilog

각 항목: 무엇을 시도했는지 / 왜 이 방식을 선택했는지 / 대안은 무엇이었는지 / 결과

---

## [Phase 1] react-native-maps + Expo Web 호환성 스파이크 → Web 플랫폼 포기

- **시도**: `/spikes/maps-compat`에 최소 Expo 프로젝트를 만들어 Android/iOS/Web
  세 플랫폼에서 지도(react-native-maps) 렌더링을 직접 실행해 확인.
- **발견 사실**:
  - Android(Expo Go, SDK 54): 기본 provider로 정상 렌더링. (Expo Go 앱이 SDK 54까지만
    지원해 프로젝트를 57→54로 다운그레이드해야 했음 — Expo Go 앱 버전과 프로젝트
    SDK를 항상 맞춰야 함을 확인)
  - iOS: 테스트 기기 없어 보류. 추후 기기 확보 시 재검증 필요.
  - Web: `react-native-maps`는 번들링 단계에서부터 실패
    (`Importing native-only module ... codegenNativeCommands`).
  - Web 대안으로 `react-leaflet`(OSM 래스터 타일)을 붙이면 렌더링 자체는 되지만,
    해외 지역 라벨이 로컬 언어로만 고정되어 한글화가 안 됨 (래스터 타일은 언어
    선택이 불가능한 사전 렌더링 방식).
  - `MapLibre GL JS` + 무료 벡터 타일(`OpenFreeMap`) + 언어 전환 플러그인
    (`@teritorio/openmaptiles-gl-language`)으로 해외 지역 한글 라벨(Wikidata 기반
    name:ko)까지 강제 적용하는 방법을 실제 구현/빌드까지 확인했으나, 실행 시
    흰 화면 문제가 발생했고 무엇보다 이 정도 대안까지 도입할 메리트가 없다고 판단.
- **선택**: Web 플랫폼 지원을 포기. Android + iOS(Expo, React Native)만 타겟으로
  진행. 기술 스택(Expo/React Native) 자체는 유지 — Android 단일 타겟으로도 계속
  쓸 수 있는 프레임워크이기 때문.
- **이유**: Web 지도는 react-native-maps 미지원이 명확하고, 대안(react-leaflet,
  MapLibre)도 핵심 가치(사진 기반 여행 기록의 지도 경험)에 필요한 수준의 완성도를
  얻으려면 별도 지도 스택을 통째로 새로 구축/유지해야 해서 비용 대비 이득이 낮음.
- **대안**: react-leaflet(라벨 언어 고정, 기각) / MapLibre+OpenFreeMap+언어 플러그인
  (구현 가능하나 메리트 부족, 기각) / Google Maps JS API(유료 성격이라 "100% 무료
  인프라" 원칙과 충돌, 미검토).
- **결과**: `PROJECT_PLAN.md`의 기술 스택(Frontend 배포: Vercel/Expo Web 제거)과
  로드맵(Phase 4 "공유 웹 구현" → "공유 기능 구현", Phase 5 배포 문구 수정),
  리스크 목록 항목 1을 [해결됨]으로 수정 완료. 스파이크 폴더(`/spikes/maps-compat`)는 삭제함.

---

## [Phase 1] 모노레포 구조 세팅 (`/apps/app`, `/apps/server`)

- **시도**: Git 저장소 초기화 + `/apps/app`(Expo TS), `/apps/server`(FastAPI)
  뼈대 생성.
- **선택**:
  - Git: 프로젝트에 저장소가 없어 `git init` + 루트 `.gitignore` 후 초기 커밋.
  - 모노레포 도구 미도입: `/apps/app`(JS)과 `/apps/server`(Python)는 언어가
    달라 공유 코드가 없으므로 npm/pnpm workspace 없이 단순 폴더 분리.
  - Expo SDK 54 고정: 직전 스파이크에서 테스트폰의 Expo Go 앱이 SDK 54까지만
    지원함을 확인했으므로, 최신(57)으로 생성 후 `expo install expo@54.0.36` +
    `expo install --fix`로 다운그레이드. `expo-doctor` 18/18 통과 확인.
    템플릿이 남긴 `apps/app/AGENTS.md`의 버전 문서 링크도 v54로 수정.
  - `/apps/server`: `venv` + `requirements.txt`(Render 무료 배포 가이드와 동일
    방식). `/health` 엔드포인트만 있는 최소 스켈레톤 — DB/JWT/Upstage 연동은
    Phase 2 범위.
- **이유**: Phase 1은 인프라/뼈대 세팅만 담당하고 기능 코드는 각 Phase(2, 3)에서
  만들기로 스코프를 고정. Python/JS가 공유할 코드가 없는 상태에서 workspace
  도구는 불필요한 추상화.
- **대안**: pnpm/npm workspace(공유 코드 생기기 전까지는 이득 없어 기각),
  Poetry(설치 편의성 대비 배포 설정 복잡도 증가로 기각).
- **결과**: `npx expo start` → Android Expo Go로 기본 템플릿 화면 렌더링 확인,
  `uvicorn main:app` → `curl localhost:8000/health` 정상 응답 확인. 초기 커밋
  완료 (`9750da9`).

---

## [Phase 1] Supabase Auth 연결 확인

- **시도**: 기존에 만들어둔 Supabase 프로젝트(URL/anon key)를 `/apps/app`에서
  최소 연결까지만 확인. Kakao/Google 소셜 로그인 UI 자체는 Phase 3 범위로 남김.
- **선택**:
  - `@supabase/supabase-js` + `react-native-url-polyfill`(RN 환경 URL polyfill 요구사항)
    + `@react-native-async-storage/async-storage`(세션 영속 저장)를 설치.
  - 클라이언트 초기화는 `apps/app/lib/supabase.ts`로 분리, URL/anon key는
    `EXPO_PUBLIC_SUPABASE_URL`/`EXPO_PUBLIC_SUPABASE_ANON_KEY` 환경변수로 주입.
  - 실제 키는 `apps/app/.env`(커밋 안 함, 루트 `.gitignore`가 커버), 키 이름만
    담은 `apps/app/.env.example`은 커밋.
  - anon(publishable) key만 사용 — service role(secret) key는 요청/사용하지
    않음 (그건 서버 전용, Phase 2 범위).
- **이유**: Phase 1은 인프라 연결 확인만 담당. 로그인 UI/소셜 프로바이더 설정은
  각 플랫폼 개발자 앱 등록이 필요해 범위가 커지므로 Phase 3로 미룸.
- **결과**: `App.tsx`에 임시로 `supabase.auth.getSession()` 호출을 넣고 Expo Go로
  실행 → Metro 로그에 `[supabase] connection OK, session: null` 확인 (세션 없음은
  로그인 UI가 아직 없으므로 정상, 연결 자체는 성공). 확인 후 임시 코드는 제거해
  `App.tsx`를 템플릿 상태로 되돌림 — `lib/supabase.ts`는 Phase 3에서 재사용.

---

## [Phase 1] Cloudinary unsigned preset 세팅 확인

- **시도**: 리스크 #3("unsigned preset 노출 리스크")에 따라 `tabilog_unsigned`
  preset을 안전하게 설정하고, 제한이 실제로 작동하는지 curl로 직접 검증.
- **선택 (preset 설정값)**:
  - Signing mode: Unsigned / Asset folder: `tabilog/photos` (클라이언트가 다른
    folder를 보내도 무시되고 이 폴더로 강제됨)
  - Disallow public ID: 켬 (클라이언트가 임의 public_id를 지정해도 무시,
    항상 서버가 생성한 unguessable ID 사용)
  - Allowed formats: `jpg,png,heic,webp`
  - Max file size: 10MB (`10485760` bytes)
  - Unique filename 켬 / Overwrite 끔
  - **콘솔 UI의 한계**: `max_file_size`는 Cloudinary 콘솔 화면에 필드 자체가
    없음 — Admin API로만 설정 가능함을 확인. 사용자로부터 API Key/Secret을
    일회성으로 받아 `PUT /upload_presets/tabilog_unsigned` 호출로 설정,
    저장하거나 커밋하지 않음.
  - `apps/app/.env`/`.env.example`에 `EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME`,
    `EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET` 추가 (Supabase와 동일 패턴).
    실제 업로드 코드는 Phase 3 범위.
- **이유**: unsigned preset은 preset 이름만 알면 누구나 요청을 보낼 수 있어,
  폴더/포맷/크기/public_id 제한이 preset 자체에 강제돼야 안전함. 콘솔 클릭만으론
  전체 방어선을 세울 수 없다는 걸 실제로 확인했으므로 Admin API 보완이 필요했음.
- **결과 (curl 직접 검증, empirical)**:
  - 정상 업로드(png, favicon.png) → 성공, `asset_folder: "tabilog/photos"`,
    unguessable `public_id` 확인. 테스트 후 asset은 삭제함.
  - 비허용 포맷(txt) → `"Raw file format txt not allowed"` 거부 확인.
  - 크기 제한(11MB 파일) → `"File size too large. Got 11393493. Maximum is
    10485760."` 거부 확인 — GET 응답에는 `max_file_size`가 표시되지 않지만
    실제로는 적용되어 있음을 확인.

---

## [Phase 2] Supabase DDL (초기 스키마)

- **시도**: `PROJECT_PLAN.md`의 DB 스키마(users/trips/places/photos)를
  `apps/server/db/migrations/0001_init.sql`로 작성, Supabase SQL Editor에서
  직접 실행.
- **선택**:
  - DB 접근 구조: FastAPI가 service_role 연결문자열로 Postgres에 직접 접속
    (SQLAlchemy). JWT 검증/권한 체크는 Python 코드에서 직접 처리, PostgREST는
    거치지 않음.
  - 마이그레이션 도구: Alembic 없이 플레인 SQL 파일. 현재 규모에는 과함.
  - 4개 테이블 모두 `ENABLE ROW LEVEL SECURITY` + 정책은 하나도 안 만듦 →
    service_role(FastAPI)은 RLS를 우회해 정상 동작하고, anon/authenticated
    롤(앱에 박힌 anon key로 PostgREST 직접 호출)은 기본적으로 전부 거부됨.
    Cloudinary unsigned preset과 동일한 이유의 방어선.
  - `auth.users` 신규 가입 시 `public.users`에 자동으로 행을 만드는 트리거
    (`handle_new_user`) 추가 — 소셜 로그인 성공 시 백엔드 코드 없이
    `public.users`가 항상 채워지도록 함.
- **이유**: Phase 2 첫 하위 단계로 DDL이 있어야 이후 FastAPI CRUD/JWT
  미들웨어를 만들 수 있음. DB 접근 구조는 PROJECT_PLAN의 "FastAPI JWT
  미들웨어 + CRUD" 문구와 가장 직접적으로 맞아떨어지는 선택.
- **결과**: Supabase Table Editor에서 4개 테이블 및 FK 관계 정상 생성 확인.
  Authentication → Add user로 테스트 계정 생성 → `public.users`에 행이
  자동으로 생성되는 것 확인 (트리거 정상 동작).

---

## [Phase 2] FastAPI JWT 미들웨어 + CRUD

- **시도**: FastAPI가 Supabase JWT를 직접 검증하고, trips/places/photos
  CRUD를 제공하도록 구현.
- **사전 확인 (empirical)**:
  - JWT 서명: `{SUPABASE_URL}/auth/v1/.well-known/jwks.json` → `ES256`
    (비대칭 키) 확인. `PyJWKClient`로 서명 검증.
  - DB 연결: Direct connection 호스트(`db.<ref>.supabase.co`)는 DNS 자체가
    안 잡힘(이 프로젝트는 미지원) → Session pooler
    (`aws-0-ap-northeast-2.pooler.supabase.com:5432`, 유저명
    `postgres.<project-ref>`)로 psql 연결 성공.
- **구현**:
  - `db.py`(async SQLAlchemy 엔진), `models.py`(User/Trip/Place/Photo),
    `schemas.py`(Pydantic), `auth.py`(JWT 검증 dependency),
    `deps.py`(소유권 확인 헬퍼 `get_owned_trip`/`get_owned_place`),
    `routers/{trips,places,photos}.py`
  - 소유권 체크: place는 부모 trip의 `user_id`, photo는 place→trip을 따라가
    확인. 소유자가 아니거나 없는 리소스면 404로 통일(존재 노출 방지).
- **버그 수정 2건 (curl 테스트로 발견)**:
  - `created_at`이 INSERT 시 NULL로 들어가 not-null 제약 위반 → SQLAlchemy
    모델에 `server_default=func.now()` 누락이 원인, 추가해서 해결.
  - Authorization 헤더가 없을 때 401이 아니라 422가 나옴 → `Header(...)`
    (필수)가 FastAPI validation에서 먼저 걸려서 발생. `Header(default=None)`로
    바꾸고 코드에서 직접 401을 던지도록 수정.
- **결과 (curl 직접 검증, empirical)**: 테스트 계정으로 실제 로그인해 JWT
  발급 → 인증 없이 호출 시 401, trip/place/photo 생성·조회·수정 정상,
  존재하지 않거나 소유하지 않은 trip 조회 시 404, trip 삭제 시 하위
  place/photo까지 cascade 삭제되는 것까지 모두 확인.

---

## [Phase 2] Upstage Solar 연동 (감성 에세이/뱃지) — 리스크 #5 해결

- **시도**: `POST /trips/{trip_id}/summary`에서 trip+places 정보로 Upstage
  Solar를 호출해 `solar_summary`/`sentiment_badge`를 생성.
- **API 스펙 확인**: `POST https://api.upstage.ai/v1/chat/completions`
  (OpenAI 호환, `Authorization: Bearer`), 모델 `solar-pro2`. JSON 모드에
  의존하지 않고 `BADGE:`/`ESSAY:` 두 줄 형식으로만 답하도록 프롬프트에서
  강제하고 문자열 파싱 — 모델이 바뀌어도 덜 깨지는 방식.
- **리스크 #5 (Upstage 실패/타임아웃 fallback) 결정**: 실패(타임아웃/비2xx/
  파싱 실패) 시 DB는 변경하지 않고 502로 응답. 백엔드에서 자동 재시도는
  하지 않음 — 사용자가 명시적으로 다시 호출(프론트 재시도 버튼은 Phase 3).
- **프롬프트 버그 수정**: 처음에 "200자 내외"로 글자수를 지시했더니 모델이
  본문 끝에 `(200자)`를 그대로 붙여서 응답 — "글자수를 괄호로 표시하지 마"를
  명시하고 "3~5문장" 기준으로 바꿔서 해결.
- **결과 (실제 Upstage 호출로 검증)**: 장소 2개가 있는 trip과 장소가 없는
  빈 trip 모두 정상적으로 감성 일기/뱃지 생성 확인. 검증 중 한 번 실제로
  transient 오류(원인 불명, 재현 안 됨)가 발생했는데, 설계한 대로 DB는
  그대로 유지되고 502만 반환됐으며, 곧바로 재호출하니 정상 처리됨 —
  fallback 정책이 실제로 의도대로 동작함을 우연히 실전 검증.

---

## [Phase 3] Expo Router 세팅 + 로그인 화면

- **시도**: `apps/app`에 Expo Router를 도입하고, email/password 로그인
  화면 + 인증 게이트 + 로그아웃까지 구현.
- **선택**:
  - 인증 방식: 소셜 로그인(Kakao/Google) 개발자 앱이 아직 없어 email/password로
    우선 플로우를 검증. 소셜 로그인 버튼은 나중에 로그인 화면에 추가.
  - 라우팅 구조: `app/_layout.tsx`에서 Supabase 세션을 구독하고,
    최신 Expo Router 공식 패턴인 `<Stack.Protected guard={...}>`로
    `(app)`/`(auth)` 그룹을 조건 렌더링 (예전의 `useSegments`+`router.replace`
    수동 리다이렉트 방식 대신 — 공식 문서에서 현재 권장하는 방식임을 확인 후 채택).
  - 기존 `App.tsx`/`index.ts`는 삭제, `package.json`의 `main`을
    `expo-router/entry`로 변경, `app.json`에 `scheme: "tabilog"` 추가
    (Expo Router 딥링크 요구사항).
- **이유**: 화면이 늘어나기 전에 표준 파일 기반 라우팅을 먼저 잡아두는 게
  이후 화면 추가 비용을 줄임. Stack.Protected는 로그인 상태 변화에 따라
  자동으로 화면을 전환해줘서 수동 리다이렉트 로직/깜빡임 버그 위험이 적음.
- **결과**: `expo-doctor` 18/18 통과, `expo export -p android` 정상 번들.
  Android Expo Go에서 실제 확인 — 로그인 성공 시 인증 후 화면 전환, 잘못된
  비밀번호 시 에러 메시지 표시, 로그아웃 시 로그인 화면으로 복귀 모두 정상.

---

## [Phase 3] 여행 생성/목록/상세 화면 + 장소 추가

- **시도**: 로그인 후 화면을 실제 트립 목록/생성/상세 + 장소 추가로 채워서
  Phase 2 FastAPI CRUD와 앱을 연동.
- **선택**:
  - `lib/api.ts`: Supabase 세션의 access_token을 매 요청마다 꺼내
    `Authorization: Bearer`로 붙이는 `fetch` 래퍼. 별도 상태 관리 라이브러리
    없이 화면별 `useState`+`useFocusEffect`로 데이터 로드.
  - 라우팅: `trips/[id].tsx` 대신 `trips/[id]/index.tsx`로 둬서 그 아래
    `places/new.tsx` 같은 하위 라우트를 자연스럽게 추가 가능하게 함.
  - 날짜/장소 입력은 네이티브 date picker 없이 플레인 텍스트 입력(YYYY-MM-DD).
    검증/에러 메시지는 다듬지 않고 백엔드 원본 에러(`API 상태코드: 본문`)를
    그대로 노출 — 이번 단계 목적은 흐름이 실제로 도는지 확인하는 것이라
    UI 폴리싱은 의도적으로 다음으로 미룸.
  - 로컬 API 접속: 백엔드가 아직 배포 전(Phase 5)이라 개발 머신의 LAN IP를
    `EXPO_PUBLIC_API_URL`로 사용, `uvicorn --host 0.0.0.0`으로 기동해 같은
    Wi-Fi의 폰이 접속 가능하게 함.
- **알려진 한계 (의도적으로 미룸)**: 로그인 직후 화면 전환처럼 세션 로딩이
  끝나기 전에 API를 호출하면 토큰 없이 요청이 나가 "Missing bearer token"
  에러가 잠깐 뜰 수 있음. 날짜 입력 형식이 틀리면 백엔드 검증 에러가 그대로
  노출됨. 둘 다 다음 UI 폴리싱 단계에서 다룰 것.
- **결과**: Android Expo Go에서 실제 확인 — 로그인 → 여행 생성 → 목록 반영
  → 상세 진입 → 장소 추가 → 실제 Upstage 호출로 Solar 요약(에세이+뱃지)
  생성까지 전체 플로우 정상 동작.

---

## [Phase 3] EXIF GPS 스파이크 → 위치는 수동 입력이 기본 경로 (리스크 #2 재정의)

- **시도**: 사진 EXIF에서 위치/시간을 자동으로 뽑아 장소를 채우는 기능을
  만들기 전에, 실제 폰에서 GPS가 살아있는지부터 확인. `expo-image-picker`
  (`exif: true`)와 `expo-media-library`(`getAssetInfoAsync`) 두 경로를
  실제 갤럭시 폰의 카메라 직찍 사진으로 테스트.
- **발견 사실 (empirical)**:
  - `image-picker` 경로: `DateTimeOriginal`은 정상 — 시간은 살아있음.
    `GPSLatitude`/`GPSLongitude`는 `0`, `GPSLatitudeRef`/`GPSLongitudeRef`는
    빈 문자열 — 카메라로 직접 찍은 사진인데도 위치 정보가 완전히 지워짐.
    (`assetId`도 `null` — Android 사진 선택기 자체가 스코프를 제한함)
  - `media-library` 경로: Expo Go 자체가 "더 이상 미디어 라이브러리 전체
    접근을 제공할 수 없다"고 명시하며 실패 — 커스텀 개발 빌드(EAS Build)
    없이는 이 우회조차 테스트할 수 없고, 된다는 보장도 없음.
  - 즉 `PROJECT_PLAN.md` 리스크 #2가 예상한 것(카톡/인스타 경유·스크린샷만
    EXIF 없음)보다 훨씬 넓은 문제 — Android 10+ 사진 선택기를 쓰는 한
    사진 출처와 무관하게 GPS는 거의 항상 지워짐.
- **선택**: 지금은 EAS Build 도입(개발 빌드로 전환, Expo Go 대신 매번 그
  빌드를 설치해야 함) 없이, **얻을 수 있는 메타데이터(시간)는 자동으로 채우고
  위치는 사용자가 지도에서 직접 입력하는 것을 기본 경로로** 채택. GPS 자동
  핀은 나중에 EAS Build 도입을 별도로 결정할 때 재검토.
- **이유**: 커스텀 개발 빌드 전환은 이번 기능 하나를 위해 감당하기엔 인프라
  비용이 커짐(Expo Go의 즉시 테스트 편의성을 잃음). 시간 자동 채우기만으로도
  핵심 가치는 어느 정도 유지되고, 위치 수동 입력은 이미 리스크 #2에서
  예정했던 fallback을 기본 경로로 승격시키는 정도의 변경.
- **결과**: `expo-media-library`는 미사용 제거, `expo-image-picker`만 유지.
  다음 단계(사진 선택 + 위치 수동 입력 + Cloudinary 업로드 기능)를 이 결정
  기준으로 설계.
- **부수 정리**: `npm install`/`uninstall` 중 `react-dom@19.2.8`이 optional
  peer로 계속 잘못 끌려들어와 `react@19.1.0`과 충돌하는 문제를 발견 —
  `package.json`에 `"overrides": { "react-dom": "19.1.0" }`로 고정해 해결.
  실제로 어디서도 import되지 않는 미사용 패키지라 번들에는 영향 없음.

---

## [Phase 3] 사진 선택 + Cloudinary Direct Upload (1차, 위치/날짜는 프로토타입 수준)

- **시도**: "장소 추가" 화면에 사진 선택을 붙여 `lib/cloudinary.ts`로 실제
  Cloudinary unsigned preset에 client-side 업로드, 성공하면
  `POST /places/{id}/photos`로 photo_url 저장. EXIF `DateTimeOriginal`은
  파싱해서 `visited_at`으로 자동 채움.
- **알려진 한계 (사용자 피드백으로 확인)**: 위치는 위도/경도 숫자를 사용자가
  직접 입력하는 방식으로 1차 구현했는데, 실제로는 정확한 좌표를 아는 사용자가
  없어 쓸 수 없는 UX. 원래 이전 스파이크 결정 기록에 "지도에서 직접 입력"이라고
  적어놨었는데 이번 구현에서는 그냥 숫자 입력으로 축소해서 넣었었음 — 지도
  선택 UI로 다시 맞춰야 함. 날짜도 EXIF 자동 채움만 있고 수동 수정이 안 됨 —
  EXIF가 없거나 틀린 경우를 위해 수정 가능하게 해야 함. 둘 다 다음 단계에서 보완.
- **결과**: 업로드 로직 자체(사진 선택 → Cloudinary 업로드 → photo_url 저장 →
  트립 상세에 썸네일 노출)는 실제 기기에서 정상 동작 확인.

---