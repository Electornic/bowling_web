# Codex 가이드 문서: bowling_web 게임성 개선 (A안: 1회 드래그로 파워/방향/스핀)

## 0) 목표

볼링 웹 프로토타입의 핵심 문제는 “내가 조절했다”는 손맛과 임팩트가 약하다는 점이다.
아래 작업을 통해 **조작감(파워/방향/스핀) + 커브 물리 + 임팩트 연출 + CPU 상대감 + 템포**를 개선한다.

### 최우선 KPI

* 같은 파워/방향에서도 **스핀에 따라 궤도가 눈에 띄게 달라**져야 한다.
* 스트라이크/스페어가 **시각/청각적으로 쾌감**이 있어야 한다.
* CPU 턴이 **상대처럼 느껴지고**, 템포가 답답하지 않아야 한다.

---

## 1) 프로젝트 핵심 파일(수정 대상)

### 입력/샷 생성

* `src/hooks/useAimInput.ts` : 드래그 입력 → Shot 생성 (**spin 현재 0 고정 → 구현 필요**)
* `src/screens/Game/ui/AimingUI.tsx` : 조준 UI(파워/방향 표시) (**spin 인디케이터 추가 권장**)

### 게임 루프/턴 제어

* `src/hooks/useGame3D.ts` : 플레이어 샷/CPU 샷, `GameStateManager` 연동, CPU 샷 생성(`generateCpuShot`)

### 3D 씬/물리

* `src/3d/Scene3D.tsx` : 물리 world, 핀/공 배치, hit 처리/연출 포인트
* `src/3d/Ball3D.tsx` : 공 rigidbody, `applyShot`, after-step 처리 (**커브 힘 적용 필요**)
* `src/3d/Pin3D.tsx` : 핀 히트 연출(애니메이션 기반)

---

## 2) 구현 범위 및 우선순위

### P0-1. A안 입력: “한 번 드래그로 파워/방향/스핀”

**요구사항**

* 사용자는 한 번 드래그로:

    * 드래그 길이 → 파워
    * 드래그 방향/오프셋 → 방향
    * 드래그 “마지막 80ms”의 좌우 움직임 → 스핀(-1~1)
* 스핀은 Shot에 담겨 `Scene3D → Ball3D`까지 전달돼야 한다.

**작업**

* 파일: `src/hooks/useAimInput.ts`
* 기존 `spin: 0` 고정 제거
* pointer move 샘플을 저장하고, pointer up(릴리즈)에서:

    1. `recent = samples where now - t <= 80ms`
    2. `dxRecent = recentLast.x - recentFirst.x`
    3. `spin = clamp((dxRecent / viewportWidth) * SPIN_SENS, -1, 1)`
    4. Shot에 `spin` 포함
* 샘플 배열은 길이 제한(예: 60개)로 성능 보호

**튜닝 상수**

* `SPIN_WINDOW_MS = 80`
* `SPIN_SENS = 8` (커브 약하면 10~12, 과하면 6~7)

**완료 기준**

* 사용자가 드래그 끝에서 살짝 좌/우로 “털면” 스핀이 생김을 체감
* 스핀 없이 던지면 거의 직진

---

### P0-2. 스핀을 실제 커브로 반영 (Rapier)

**문제**

* 현재는 `angvel.y`만 주는 형태라 “회전은 하는데 커브가 거의 없음”.

**해결**

* 파일: `src/3d/Ball3D.tsx`
* `useAfterPhysicsStep`(또는 동일한 after-step 훅)에서 샷 진행 중일 때:

    * 현재 `linvel()`과 `angvel()`을 읽고
    * 전진 속도와 y축 스핀에 비례하는 **측면 impulse/force**를 x축에 적용
* 개념:

    * `forwardSpeed = abs(linvel.z)` (좌표계 부호는 현 프로젝트에 맞춰 확인)
    * `spinY = angvel.y`
    * `curve = clamp(spinY * forwardSpeed * CURVE_K, -MAX_CURVE, MAX_CURVE)`
    * `applyImpulse({ x: curve, y: 0, z: 0 }, true)` (Rapier API 맞춰 적용)

**튜닝 상수**

* `CURVE_K = 0.0025` (약하면 0.004까지)
* `MAX_CURVE = 0.08` (레인 이탈하면 0.05로)

**완료 기준**

* spin=0 → 직진에 가까움
* spin=±0.7 이상 → 레인 안에서 커브가 눈에 띄게 보임
* 커브가 과도해 즉시 레인 밖으로 튀지 않음(clamp로 보호)

---

### P0-3. 임팩트(손맛) 연출 추가

**목표**

* 핀 최초 히트 순간에 “쾅” 느낌을 준다.

**작업**

* 파일: `src/3d/Scene3D.tsx` (혹은 카메라 컨트롤 컴포넌트)
* “첫 hit” 발생 시 1회만:

    * 카메라 쉐이크 0.12~0.18초
    * (선택) 작은 파티클/텍스트 팝
* 구현 방식:

    * `shakeTimeRef`, `shakeStrengthRef`를 두고 `useFrame`에서 camera.position에 작은 노이즈 오프셋 적용 후 복구

**완료 기준**

* 핀에 맞는 순간 “부딪혔다” 느낌이 확실해짐(소리 없이도)

---

### P0-4. CPU 상대감 + 템포(스킵)

**작업 1: CPU 턴 연출**

* 파일: `src/hooks/useGame3D.ts` + UI 컴포넌트(게임 화면)
* CPU 턴 시작 시 0.8~1.2초:

    * “CPU 조준 중…” 표시
    * 동시에 **스킵 버튼** 노출 → 누르면 즉시 CPU 샷 실행

**작업 2: CPU 난이도 체감 개선**

* 파일: `src/hooks/useGame3D.ts` (generateCpuShot)
* 난이도별로 아래 요소를 분리 관리:

    * aim noise(좌우/각도)
    * power variance
    * spin variance
    * mistake chance(실수 이벤트)
* 실수 이벤트 발생 시(확률):

    * aim noise 2배, powerVar 2배, 스핀 방향 반전(가끔)

**완료 기준**

* EASY: 실수/거터가 체감됨
* HARD: 잘 치지만 가끔 삑이 있어 치트처럼 안 보임
* CPU 턴이 답답하지 않음(스킵으로 템포 조절 가능)

---

### P1. UI: spin 인디케이터(강추)

* 파일: `src/screens/Game/ui/AimingUI.tsx`
* aiming 상태에서 현재 spin 값을 간단히 표시

    * 예: `SPIN ◀︎■■■▶︎` 또는 화살표/게이지
* 완료 기준: 유저가 “스핀 걸고 있다”를 시각적으로 인지

---

## 3) 상수 분리(권장)

튜닝이 잦으니 상수를 한 파일로 모은다.

* 예: `src/3d/constants.ts` 또는 `src/game/tuning.ts`

    * `SPIN_WINDOW_MS`
    * `SPIN_SENS`
    * `CURVE_K`
    * `MAX_CURVE`
    * (선택) `CPU_DELAY_MS`, `SHAKE_DURATION`, `SHAKE_STRENGTH`

---

## 4) QA/테스트 시나리오(머지 기준)

### 스핀 체감 테스트(필수)

* 동일한 파워/방향으로:

    * spin≈0 (끝에서 좌우 흔들지 않기) 5회
    * spin>+0.7 (끝에서 오른쪽 털기) 5회
    * spin<-0.7 (끝에서 왼쪽 털기) 5회
* 결과:

    * 궤도/명중 위치가 3그룹으로 확실히 분리되어야 함(눈으로 봐도)

### CPU 템포/스킵 테스트

* CPU 턴마다 스킵을 랜덤하게 눌러도:

    * 턴/프레임/점수가 꼬이지 않아야 함

### 임팩트 테스트

* 첫 hit에서만 쉐이크 1회 발생
* 스트라이크/스페어에서 과도한 흔들림 반복 없음

### 성능/모바일

* pointer 이벤트(터치 포함)에서 정상 동작
* 샘플 배열 길이 제한으로 프레임 저하 없음

---

## 5) 구현 순서(권장)

1. `useAimInput.ts`: spin 산출(최근 80ms dx) + Shot에 주입
2. `Ball3D.tsx`: after-step에서 커브 impulse 적용
3. `AimingUI.tsx`: spin 인디케이터 추가
4. `Scene3D.tsx`: 첫 hit 카메라 쉐이크
5. `useGame3D.ts`: CPU 딜레이 + 스킵 + 난이도 로직 정리

---

## 6) 최종 완료 정의(Definition of Done)

* (조작감) 한 번 드래그만으로 파워/방향/스핀이 모두 동작
* (물리) 스핀이 실제 궤도 커브로 명확히 반영
* (손맛) 첫 타격 임팩트 연출로 쾌감 개선
* (CPU) 상대감 연출 + 스킵으로 템포 개선 + 난이도 체감 강화
* (QA) 위 테스트 시나리오 통과
