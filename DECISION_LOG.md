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
- **결과**: `PROJECT_PLAN.md`의 기술 스택(Frontend 배포: Vercel/Expo Web)과
  로드맵(Phase 4 "공유 웹 구현")을 이 결정에 맞게 수정할지 사용자 확인 필요.
  스파이크 폴더(`/spikes/maps-compat`)는 정리 여부 확인 필요.

---