# Bowling Game Web – 2D → 3D 전환 작업 지시서 (Agent용)

## 0. 목표 / 전제
- 현재: 2D(Canvas) 기반 프로토타입(룰/점수/턴/CPU shot 생성 로직 존재)
- 목표: **3D 렌더링 + 3D 물리(충돌) 기반**으로 전환
- 핵심 원칙: **GameCore(룰/점수/턴/CPU 난이도/shot 생성)는 유지**하고  
  **Renderer(2D→3D), Physics(2D→3D)만 교체**한다.
- 화면(Screen)은 기존 3개(Home/Game/Result) 유지. Game 화면 내부의 “레인 영역”만 3D로 전환.

---

## 1. 권장 기술 스택(웹 프로토타입 기준)
> React 기반(Vite) 가정. 다른 프레임워크여도 개념 동일

- 3D Renderer: `three.js` + (React면) `@react-three/fiber`(r3f)
- 3D Physics: `@dimforge/rapier3d-compat` (Rapier WASM)
- 모델 포맷: `glTF(.gltf) / .glb`
- UI: 기존 React DOM 오버레이 유지(점수판/버튼/토스트 등)

> 대안
- Babylon.js + physics plugin(Ammo/Havok 등): 툴링 편하지만 RN 이식/React 생태계 고려 시 r3f+Rapier를 우선 추천

---

## 2. 아키텍처 변경(가장 중요)
### 2.1 모듈 분리 목표
- `GameCore`(유지):
    - FrameManager / TurnManager / ScoreCalculator / CpuController(shot generator)
- `Renderer3D`(신규):
    - Scene, Camera, Lights, Model loader, Debug view
- `Physics3D`(신규):
    - World(step), RigidBody/Collider 생성, 충돌/마찰/감속, 리셋

### 2.2 인터페이스(계약) 정의
> GameCore가 Physics/Renderer에 의존하지 않게 “계약”으로만 연결

- 입력(shot): `Shot { lineOffset, angleOffset, power, spin }`
- Physics가 제공해야 하는 API 예시
    - `initWorld()`
    - `resetFrame(pinsLayout)`
    - `applyShot(shot)`
    - `step(dt)`
    - `getPinStates(): {id, isStanding, transform}[]`
    - `getBallState(): transform`
    - `isBallStopped(): boolean`
- Renderer가 제공해야 하는 API 예시
    - `render(sceneState)` (혹은 r3f는 상태 바인딩으로 대체)

---

## 3. 3D 씬(장면) 설계 요구사항
### 3.1 필수 오브젝트
- 레인(바닥/레인 표면)
- 가드레일(좌/우)
- 핀 10개
- 볼링공 1개
- 백보드/핀 데크(옵션)

### 3.2 카메라(고정 1개로 MVP)
- 추천: 레인 뒤쪽에서 약간 위로 올린 3인칭 고정
- “공이 앞으로 굴러가는 방향”이 시원하게 보이게
- 옵션: 공을 따라가는 follow cam은 후순위

### 3.3 라이트/그림자
- 라이트 2~3개 기본(ambient + directional)
- 그림자는 MVP에서 옵션(성능 이슈 시 Off)

---

## 4. 3D 물리(Physics) 설계 요구사항
### 4.1 리지드바디/콜라이더 설계(안정성이 핵심)
- 볼링공
    - RigidBody: Dynamic
    - Collider: Sphere
    - 물성: 마찰/반발 적절히(초기값 후 튜닝)
- 핀(10개)
    - RigidBody: Dynamic
    - Collider: **단순 형태 권장**
        - 1안: Capsule(근사)
        - 2안: Cylinder + 작은 Sphere 조합(근사)
        - 3안: Convex Hull(정확하지만 비용↑, 불안정 가능)
    - 주의: 핀 콜라이더가 정교할수록 “떨림/성능/스택 불안정”이 생길 수 있음 → 단순 콜라이더 우선
- 레인/가드레일/바닥
    - RigidBody: Fixed
    - Collider: Box/Plane

### 4.2 시뮬레이션 루프
- 프레임마다 `world.step(dt)` 호출
- dt는 고정 타임스텝 권장(예: 1/60)
- 과도한 dt 변동 방지(프레임 드랍 시 step을 여러 번 돌리되 상한 설정)

### 4.3 샷(투구) 적용 방식
- 기존 2D 입력/CPU shot 생성 결과를 3D 물리에 매핑
- 권장 매핑
    - `lineOffset` → 공의 초기 x 위치(또는 레인 중앙 대비 lateral spawn)
    - `angleOffset` → 초기 진행 방향 벡터 yaw
    - `power` → 초기 선속도(Linear velocity) 크기
    - `spin` → 초기 각속도(Angular velocity) 또는 회전 토크

---

## 5. 핀 “쓰러짐 판정” 요구사항(룰/점수와 연결되는 핵심)
### 5.1 판정 기준(권장)
- 핀의 “위쪽 방향 벡터(up)”가 바닥 노멀과 이루는 각도가 임계값 이상이면 down 처리
    - 예: 기울기 각도 > 25~35도이면 down
- 또는 회전값(x/z)이 임계값 이상이면 down

### 5.2 안정화 규칙
- once down → 해당 프레임 동안 계속 down(되살아남 방지)
- 투구 종료 시점(공 멈춤 + 일정 시간 경과)에서 최종 확정

### 5.3 투구 종료 판단
- `isBallStopped()`:
    - 공 선속도/각속도가 임계 이하로 N프레임 지속
    - 또는 공이 핀 데크를 지나 특정 y 이상으로 가면 종료 처리

---

## 6. 리셋/프레임 전환(스페어 포함)
### 6.1 1투구 후
- 쓰러진 핀 상태 유지(남은 핀만 standing)
- 공은 시작 위치로 리셋(또는 새 공 스폰)

### 6.2 2투구 후 프레임 종료
- 다음 프레임 시작 시 핀 10개 재배치(정렬 정확히)
- 10프레임 규칙(3투구)은 기존 GameCore 정책에 따름

---

## 7. 기존 CPU 난이도 로직 연동
- CpuController는 `Shot`만 생성
- 3D 전환 후에도 `generateCpuShot(state, difficulty)` 그대로 사용
- 단, 3D 물리에서 요구하는 “shot→velocity/torque” 맵핑을 확정해야 함

---

## 8. 에셋/모델 요구사항
### 8.1 모델 소스
- 우선은 간단 프리미티브(원통/캡슐/구)로 MVP 구현 가능
- 이후 GLB 모델로 교체(레인/핀/공)

### 8.2 좌표/스케일 규칙
- “월드 단위” 통일(예: 1 unit = 1m 같은 내부 규칙)
- 핀 배치 좌표는 상수 테이블로 관리(10개 삼각형 배치)
- 스폰/리셋이 흔들리지 않게 고정

---

## 9. 구현 순서(Agent 작업 플랜)
1) **3D 씬 렌더링만**: 레인/핀/공 “정지 상태”로 보이게 만들기
2) **Rapier 월드 연결**: 공을 선속도로 굴릴 수 있게 하기
3) **핀 콜라이더 세팅**: 공이 핀을 치면 넘어지게 만들기
4) **쓰러짐 판정 + 상태 반환**: down/standing 판단 및 GameCore에 전달
5) **프레임 리셋/스페어 처리**: 남은 핀 유지/전체 리셋 구현
6) **입력 연동**: 유저 드래그 → shot → applyShot
7) **CPU 연동**: CPU shot 생성 → applyShot
8) 튜닝: 마찰/반발/감쇠/임계값(쓰러짐/멈춤) 조정

---

## 10. 완료 기준(Definition of Done)
- Game 화면에서 3D 레인/공/핀 표시
- 유저 드래그로 투구 가능(공이 굴러가고 핀 충돌)
- CPU가 자동으로 투구(난이도 기반 shot)
- 쓰러진 핀 수가 GameCore에 정확히 전달되어 점수 계산 정상
- 1투구/2투구(스페어) 및 프레임 리셋 정상
- 중간 결과는 Game 화면 오버레이로 표시(STRIKE/SPARE/핀 수)

---

## 11. 위험요소 / 주의사항(필수 체크)
- 핀 콜라이더를 너무 정교하게 만들면:
    - 성능 저하 + 떨림 + 핀 스택 불안정 발생 가능
    - MVP는 **단순 콜라이더** 우선
- 물리 파라미터(마찰/감쇠)가 체감에 결정적
    - 초기값은 “그럴듯함”만 목표로 하고 플레이테스트로 튜닝
- 공 멈춤/프레임 종료 판정이 흔들리면 UX 붕괴
    - 속도 임계 + 지속 프레임 조건으로 안정화

---

## 12. 산출물(Agent가 제출해야 할 것)
- 3D 전환된 Game 화면 코드
- Physics3D 모듈(초기화/스텝/샷 적용/리셋/상태 반환)
- Pin down 판정 로직(임계값 상수 포함)
- Shot → (velocity/torque) 매핑 정의(상수 포함)
- 난이도별 파라미터 테이블 연동 확인
