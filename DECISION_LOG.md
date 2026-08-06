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