# ✅ Codex 작업 지시(완성 프롬프트) — bowling_web (three.js 순정 + Rapier)

너는 아래 GitHub 레포(메인 브랜치)에서 버그를 수정해야 한다.
- Repo: https://github.com/Electornic/bowling_web

## 0) 현재 치명적 증상(반드시 재현 후 수정)
1) 게임 화면(Game Screen) 진입 시 **공이 보이지 않는다**.
2) 첫 투구(플레이어가 한 번 굴리기) 후 **즉시 CPU 턴으로 넘어간 뒤 “CPU IS PLAYING…” 무한 로딩 상태**가 된다.
    - CPU 턴에서 공이 굴러가는 장면이 없거나, 종료 조건을 못 만나서 진행이 멈춘다.

## 1) 목표(Definition of Done)
- 게임 화면 진입 즉시 공이 항상 화면에 보인다.
- 플레이어가 투구하면 공이 굴러가고, 이후 CPU도 실제로 공을 굴린다.
- CPU 턴이 무한 로딩되지 않는다. (종료 조건이 확실히 동작)
- “물리 좌표”가 단일 진실이며, 렌더(mesh)가 그 값을 매 프레임 따라간다.
- 디버그 모드로 현재 상태를 즉시 확인할 수 있다(간단 HUD + collider debug draw 토글).

## 2) 절대 규칙(이거 안 지키면 다시 깨짐)
- Render(mesh) 위치/회전을 “따로” 애니메이션/보정/트릭으로 조작하지 말 것.
    - 물리(Rapier)가 좌표의 진실, 렌더는 매 프레임 복사만 한다.
- requestAnimationFrame의 dt를 그대로 world.step에 넣지 말 것.
    - **고정 timestep(1/60) + accumulator + substep**를 사용한다.
- CPU 샷은 턴 시작 시점에 **딱 1회만 적용**한다.
    - 매 프레임 반복 적용 금지 / 반대로 0회 적용도 금지.
- 공이 안 보이면 “카메라/스폰/씬 add/transform sync” 중 하나가 반드시 깨진 것.

## 3) 수정해야 할 것(핵심 구현 요구)

### 3.1 공이 항상 보이도록 (씬 초기화 강제)
아래를 구현/보장해라:
- 공 RigidBody 생성 이후 즉시:
    - 공 mesh 생성
    - `scene.add(ballMesh)`
- 공 spawn 좌표는 바닥 위로 확정:
    - `ballY = laneTopY + ballRadius`
- 카메라는 씬 시작 시 공을 바라보도록 강제:
    - `camera.position`을 공 뒤쪽+위쪽으로 배치
    - `camera.lookAt(ballPos)`
- 매 프레임 렌더 루프에서:
    - `ballRb.translation()`과 `ballRb.rotation()`을 읽어
    - `ballMesh.position/quaternion`에 복사
- 씬 디버그:
    - 개발 중에는 `AxesHelper`, `GridHelper`를 옵션으로 켤 수 있게

### 3.2 CPU 턴 무한 로딩 제거 (상태머신/플래그 확정)
반드시 아래 상태 흐름을 갖게 만들어라:
- AIM(입력) → RELEASED(샷 1회 적용) → ROLLING(물리 진행) → SETTLE(멈춤 확인) → RESULT → NEXT_TURN

CPU 턴 구현 규칙:
- CPU 턴에 들어갈 때 `cpuHasShotThisTurn = false`
- CPU 턴 첫 프레임(또는 enterCpuTurn 함수)에서만:
    - CPU Shot 생성(혹은 기존 로직 사용)
    - applyShot(딱 1회)
    - `cpuHasShotThisTurn = true`
- applyShot 시:
    - `ballRb.wakeUp()` 호출
    - `setLinvel(..., true)` 또는 `applyImpulse(..., true)`에서 wake flag true
- 멈춤 판정:
    - `speed < vEps` 가 **N프레임 연속**(예: 60프레임=1초)일 때만 멈춤 처리
    - 멈춘 후 `settleTimer(0.5~1.0초)` 지난 뒤 RESULT 확정
- 안전 타임아웃:
    - CPU 턴이 8초 넘으면 강제 종료(무한 로딩 방지)

### 3.3 물리 tick 안정화 (고정 timestep)
아래 루프를 구현:
- `FIXED = 1/60`
- `accumulator += dt`
- `while (accumulator >= FIXED) { world.step(); accumulator -= FIXED }`
- substep이 필요하면:
    - `for i in 0..SUBSTEPS-1 world.step()` 혹은 Rapier 옵션 사용
- 공이 빠를 경우를 대비해 CCD 활성화(가능하면)

### 3.4 디버그 HUD(반드시 추가)
화면 우상단에 작은 텍스트 HUD를 추가하고 토글 가능하게 해라.
표시 항목:
- gameState (AIM/ROLLING/CPU/RESULT 등)
- accumulator, substepsCount
- ballPos(x,y,z)
- ballVel(선속도)
- ballSleeping 여부
- cpuHasShotThisTurn
- lastShotAppliedAt (timestamp)

### 3.5 Collider Debug Draw(가능하면 추가)
- 키 입력(예: `D`)로 collider wireframe 표시 토글
- 최소 요구: 바닥 collider가 통짜인지 육안으로 확인 가능해야 함

## 4) 테스트 케이스(수정 후 반드시 직접 확인)
- 게임 화면 진입 직후 공이 보이는가?
- 플레이어가 한 번 굴리면:
    - 공이 굴러가는가?
    - ROLLING → RESULT → CPU 턴으로 정상 진행하는가?
- CPU 턴에서:
    - 공이 실제로 굴러가는가?
    - 8초 내에 반드시 턴이 끝나는가?
- 극단 입력:
    - power=1.0, angle=±max, line=±max에서도 공이 사라지거나 무한루프 되지 않는가?

## 5) 작업 산출물
- 수정된 코드 전체(필요 파일만 변경)
- 변경 사항 요약(짧게)
- “왜 공이 안 보였는지”와 “왜 CPU가 무한 로딩이었는지”를 원인-해결 형태로 5줄 이내로 적기

---

## 6) 실행 지시
1) 위 증상을 재현한다.
2) 3.1 → 3.2 → 3.3 순서로 수정한다. (이 순서가 가장 빠르게 해결됨)
3) 디버그 HUD를 통해 상태/좌표가 정상인지 확인한다.
4) 모든 테스트 케이스를 통과시키고 PR 준비한다.
