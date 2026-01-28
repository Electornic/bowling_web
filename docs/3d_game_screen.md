# bowling_web “진짜 3D” 전환 작업 지시서 (Codex용)

## 0) 목표
현재 웹 볼링 게임에서 발생하는 “공이 허공으로 떨어짐 / 레인이 이어지지 않음 / 2.5D 착시” 문제를 근본적으로 해결하기 위해,
**CSS/2.5D 기반 표현을 폐기**하고 **진짜 3D 렌더링 + 3D 물리엔진** 기반으로 전환한다.

- 렌더링: **Three.js + React Three Fiber(r3f)**
- 물리: **Rapier 3D (WASM)**
- UI(HUD/버튼/오버레이): 기존 React DOM 오버레이 유지
- 게임 룰(프레임/턴/점수/CPU shot): 가능한 한 기존 로직 유지(“엔진 교체” 방식)

---

## 1) 전환 핵심 원칙
### 1.1 책임 분리(필수)
- **GameCore**: 룰/점수/턴/상태(READY/AIM/ROLLING/RESULT), CPU 샷 생성
- **Physics3D**: Rapier 월드, 바닥/핀/공 생성, step, 리셋, 상태 반환
- **Renderer3D**: r3f 씬(카메라/조명/모델), Physics 상태를 시각화
- **UI Overlay**: TopHUD, BottomAction, AimingUI, GameOverlay

### 1.2 “공을 직접 조작” 금지
- 플레이 방식은 **조준 → 릴리즈(원샷) → 관찰**만
- 릴리즈 시점에 한 번만 속도/각속도 적용, 이후 개입 없음

### 1.3 레인 바닥 충돌은 “통짜”로
- 허공 낙하/끊김의 80%는 바닥 collider 이음새에서 발생
- 레인은 **단일 Plane/Box collider(통짜)** 로 구성한다

---

## 2) 작업 범위(Scope)
### 포함
- r3f 씬 도입 및 Game 화면에 full-bleed 3D 캔버스 구성
- Rapier 3D 도입 및 공/핀/레인 충돌 구현
- “공이 허공으로 떨어짐 / 레인 끊김” 문제 제거
- 기존 UI 오버레이(HUD/조준/오버레이) 유지 및 3D 위에 overlay 배치
- Shot(line/angle/power/spin) → 3D 물리 입력 매핑
- 핀 쓰러짐 판정 + 프레임 리셋(1투구/2투구)

### 제외(이번 전환에서 하지 말 것)
- 고품질 3D 모델링(레인/핀/공 GLB) 완성
  - MVP는 프리미티브(박스/실린더/스피어)로 충분
- 온라인 멀티/랭킹/서버
- 고급 스핀 물리(커브 완성) — 기본 회전만

---

## 3) 의존성 추가(패키지)
- @react-three/fiber
- three
- @react-three/drei (선택: OrbitControls, Environment, etc. 단, MVP에서는 최소)
- @dimforge/rapier3d-compat
- (선택) @react-three/rapier  ← 래퍼를 쓸지 여부는 Codex가 판단(직접 rapier world 제어도 OK)

---

## 4) 파일/폴더 구조(권장)
> 기존 구조에 맞춰 최소 침습으로 추가

- src/
  - game/
    - core/
      - types.ts (Shot, GameState 등)
      - gameCore.ts (턴/프레임/상태)
      - cpu.ts (generateCpuShot)
    - physics/
      - physics3d.ts (Rapier world, create/reset/step/applyShot)
      - constants.ts (스케일/마찰/임계값)
      - pinJudgement.ts (쓰러짐 판정)
    - render/
      - Scene3D.tsx (r3f Canvas + camera/lights + objects)
      - objects/
        - Lane.tsx
        - Ball.tsx
        - Pins.tsx
  - ui/
    - TopHUD.tsx
    - BottomAction.tsx
    - AimingUI.tsx
    - GameOverlay.tsx
  - App.tsx (레이아웃: Canvas full-bleed + UI overlay)

---

## 5) 3D 씬 MVP 스펙
### 5.1 좌표/스케일 규칙(중요)
- 내부 단위는 “미터처럼” 일관되게
- 추천(예시):
  - 레인 길이: 18
  - 레인 폭: 1.2
  - 공 반지름: 0.108 * 스케일(대략 0.11)
  - 핀 높이: 0.38 ~ 0.40

> 실제 수치가 중요한 게 아니라 “상대 비율”과 “일관성”이 중요

### 5.2 카메라(고정)
- 공 뒤쪽 + 약간 위
- 레인이 화면의 65~75%를 차지
- 과한 광각 금지(FOV 낮추기)

### 5.3 조명(최소 2개)
- Ambient + Directional(또는 Spot)
- 가능하면 약한 그림자(성능 이슈면 off)

---

## 6) Rapier 물리 MVP 스펙
### 6.1 바닥/레인
- RigidBody: Fixed
- Collider: **Box 또는 Plane 단일**
- 레인이 여러 조각으로 나뉘지 않게(통짜)

### 6.2 공
- RigidBody: Dynamic
- Collider: Sphere
- 물성:
  - restitution(반발): 낮게
  - friction(마찰): 중간
  - linear damping(선속도 감쇠): 적당히
  - angular damping: 적당히

### 6.3 핀(10개)
- RigidBody: Dynamic
- Collider: 단순 형태 권장
  - 캡슐/실린더 + 작은 스피어 조합 등
- 핀 배치:
  - 10개 삼각형 배열(고정 좌표 테이블)

### 6.4 터널링 방지
- 공에 **CCD 활성화**(Rapier 옵션)
- fixed timestep 1/60 + substep 2~4 적용

---

## 7) Shot → 3D 물리 입력 매핑(필수)
### 7.1 Shot 정의(유저/CPU 공통)
```ts
type Shot = {
  lineOffset: number;   // [-0.45 ~ +0.45] 레인 폭 비율
  angleOffset: number;  // [-0.18 ~ +0.18] rad
  power: number;        // [0.15 ~ 1]
  spin: number;         // [-1 ~ 1] (MVP는 0 허용)
};
````

### 7.2 적용 방식

* 릴리즈 순간에만 적용
* 공 시작 위치:

    * x = lineOffset * (laneWidth/2)
    * y = ballRadius + laneTopY
    * z = startZ(레인 시작 근처)
* 속도:

    * forward 축은 z(또는 -z)로 통일
    * vx = sin(angleOffset) * power * SPEED
    * vz = cos(angleOffset) * power * SPEED
* spin:

    * MVP에서는 setAngvel로 단순 적용(또는 0)

---

## 8) 핀 쓰러짐 판정(룰 연동)

### 8.1 판정 기준

* 핀의 up 벡터가 바닥 노멀과 이루는 각도 > 임계값이면 down

    * 임계값 예: 25~35도
* once down → 해당 프레임 동안 계속 down(되살아남 방지)

### 8.2 투구 종료 판단

* 공 선속도/각속도 임계 이하가 N프레임 연속이면 “멈춤”
* 멈춘 후 0.5~1.0초 settle 시간 후 결과 확정(UX 안정)

---

## 9) 프레임/리셋 정책(MVP 단순화)

* 1투구 후: 쓰러진 핀 제거(또는 down 상태 유지), 남은 핀만 standing 유지
* 2투구 후: 다음 프레임 시작 시 핀 10개 재배치
* 10프레임 보너스:

    * MVP: 보너스 투구마다 핀을 전체 리셋해도 됨(단순화)

---

## 10) 구현 순서(반드시 이대로)

1. **Canvas full-bleed** + UI overlay 유지(App.tsx 레이어링)
2. r3f 씬: 레인/공/핀 “정지 상태” 렌더
3. Rapier world 연결: 공 굴리기(속도 적용)만 먼저
4. 핀 collider 추가: 공이 핀을 치면 넘어지게
5. 쓰러짐 판정 + 결과 반환(넘어진 핀 수)
6. 1투구/2투구 리셋
7. Player 입력(드래그) → Shot 생성 → applyShot
8. CPU shot 생성 → applyShot
9. 튜닝: 마찰/감쇠/CCD/substep/카메라

---

## 11) 완료 기준(Definition of Done)

* 공이 레인 중간에서 허공으로 떨어지지 않는다(바닥 collider 통짜 + CCD로 보장)
* 레인이 시각적으로 “끊겨 보이지 않는다”(단일 메쉬/plane)
* 공이 레인 위를 자연스럽게 굴러간다(접점 y 정렬)
* 핀 충돌/넘어짐이 동작한다
* 프레임/턴 진행이 정상(최소 1~2프레임 플레이 가능)
* UI는 3D 위에 overlay로 자연스럽게 올라간다

---

## 12) Codex에게 요구하는 산출물

* PR 형태 또는 변경 파일 목록 + 핵심 설명
* 새로 추가한 모듈(physics3d, Scene3D 등)
* 주요 상수(스케일/마찰/임계값/CCD) 한 곳에 정리
* 로컬 실행 방법(README에 5줄 이내)

---

## 13) 주의사항(중요)

* 레인 바닥을 여러 조각 collider로 만들지 말 것
* dt 기반으로 불규칙 step 금지 → fixed timestep 유지
* “보이는 mesh”와 “collider”를 서로 다른 좌표로 관리하지 말 것(단일 소스)
* MVP는 프리미티브로 끝내고, 모델(GLB)은 나중에 교체
