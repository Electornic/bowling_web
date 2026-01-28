# Bowling Game Screen UI Update – Claude Code 작업 지시서

## 0) 목표
현재 `src/app/App.tsx`의 게임 화면은 “3D Canvas 데모 카드/가이드 박스 + 데모 안내 문구”가 화면에 노출되어 **게임이 아니라 프로토타입 데모처럼 보임**.  
이를 **게임 화면 문법**(3D는 주인공, UI는 오버레이)으로 정리하고, 우리가 정의한 UX 기능(조준/턴/10프레임/오버레이)을 UI에 자연스럽게 반영한다.

> 범위: UI/입력(Shot 생성)까지  
> 제외: 실제 3D 엔진(three/r3f), 물리엔진, 핀 충돌/점수 계산 고도화

---

## 1) 코드 베이스 정보
- 프로젝트: `bowling_game_screen.zip`
- 핵심 파일:
  - `src/app/App.tsx` (게임 화면 레이아웃 + 입력 데모)
  - `src/app/components/TopHUD.tsx` (상단 HUD, 이미 absolute overlay 형태)
  - `src/app/components/BottomAction.tsx` (하단 액션영역, 이미 absolute overlay 형태)
  - `src/app/components/AimingUI.tsx` (조준 가이드 UI)
  - `src/app/components/GameOverlay.tsx` (STRIKE/SPARE/BONUS 등 오버레이)

---

## 2) 최우선 수정 사항(반드시)
### 2.1 “데모/가이드” UI 제거
App.tsx 내부에 있는 아래 요소들을 **실제 화면에서 완전히 제거**:
- 중앙의 `3D Canvas Area (Game World)` 박스
  - `border-dashed`, `rounded-3xl`, Cuboid 아이콘 등
- `Demo: Click & drag ... SPACE ...` 안내 문구 바

> 주석/annotation 목적이었더라도, 실제 게임 UI에서는 절대 노출되면 안 됨.

### 2.2 “게임화면 구조”로 레이어 정리
현재 App.tsx는 전체가 `flex flex-col`이지만, TopHUD/BottomAction은 이미 absolute라 큰 문제는 없음.
다만 **3D 영역은 full-bleed**, UI는 overlay라는 구조를 더 명확히 한다:

- Root: `relative h-[100dvh] w-full overflow-hidden`
- GameWorld(3D Canvas placeholder): `absolute inset-0`로 화면을 꽉 채움
- HUD/BottomAction/AimingUI/Overlay: 모두 위에 겹치기

> 현재도 비슷하지만, “중앙 카드/주석 UI” 때문에 게임처럼 보이지 않는다. 그 요소를 제거하고 full-bleed 느낌을 강화.

---

## 3) 입력 UX 업데이트(플레이어가 “직접 굴리는 느낌”)
### 3.1 입력 방식: “조준 → 릴리즈(원샷)”
- 실시간 조작(굴러가는 동안 컨트롤) 금지
- 조준 중(isAiming=true)만 가이드 UI가 보이고,
- 손을 떼면(Release) `Shot`이 확정되고, 이후에는 개입 없음

### 3.2 Pointer Events로 통합
현재는 mouse 이벤트 위주이므로 모바일/터치 대응을 위해 아래로 통합:
- `onPointerDown`
- `onPointerMove`
- `onPointerUp`
- `onPointerCancel`
- `setPointerCapture` 사용 권장

### 3.3 입력 시작 영역 제한(중요)
지금은 화면 전체에서 누르면 조준이 시작됨 → 오작동 발생.
아래 정책으로 바꾼다:

- “입력 시작”은 **하단 Action 영역 + 레인 하단 일부**에서만 허용  
  - 예: 화면 높이 기준 bottom 35~40% 영역에서만 pointerDown 허용
- 그 외 영역에서는 드래그가 시작되지 않음

> BottomAction이 안내하는 “DRAG TO BOWL”의 의미를 UI적으로 보장해야 함.

---

## 4) 드래그 → Shot 매핑(수치 고정)
### 4.1 Shot 타입(유저/CPU 공통 계약)
```ts
type Shot = {
  lineOffset: number;   // [-0.45 ~ +0.45]
  angleOffset: number;  // [-0.18 ~ +0.18] rad
  power: number;        // [0.15 ~ 1.0]
  spin: number;         // MVP에서는 0 고정 가능
};
````

### 4.2 추천 매핑(모바일 친화)

* dx: 화면 가로 기준 정규화
* dragLength: 드래그 길이

권장 상수:

* `MAX_DRAG = min(viewportHeight * 0.38, 320)`

매핑:

```ts
const dx = (currentX - startX) / viewportWidth;
const t = clamp(dragLength / MAX_DRAG, 0, 1);

// 좌우 감도(둔하게)
lineOffset = clamp(dx * 0.55, -0.45, 0.45);
angleOffset = clamp(dx * 0.16, -0.18, 0.18);

// 파워 곡선(초반 빠르고 후반 완만)
power = clamp(0.15 + (t ** 0.75) * 0.85, 0.15, 1);
spin = 0;
```

### 4.3 Release 안정화(떨림 방지)

릴리즈 직전 60~100ms 동안의 마지막 이동값 평균(또는 last 3 samples 평균)을 적용하여 급변 방지.

---

## 5) Aiming UI(조준 가이드) 업데이트 지침

현재 AimingUI는 좌/우에 “Aim meter”까지 포함되어 꽤 복잡함.
MVP 목표는 “핵심 2개만”:

* 방향 가이드: 공 앞쪽으로 뻗는 얇은 라인/화살표(좌우 드래그 반영)
* 파워 게이지: 한쪽(오른쪽) vertical gauge 유지(약함/적정/과함 색 변화)

선택(가능하면):

* 예상 라인(점선) 유지하되 **완벽히 정확하게 보이지 않게**(가볍게 불규칙/짧게)

정리:

* AimingUI는 `isAiming === true`일 때만 보임(현재도 OK)
* AimingUI 위치는 **BottomAction 위쪽(= bottomAction 높이인 18vh 바로 위)**에 자연스럽게 연결되게 유지

---

## 6) 10프레임 UX 반영

BottomAction은 이미 `Frame 10 — Ball N` / `Bonus Ball` 처리 로직이 있음.
추가 요구:

* 상단 HUD 또는 BottomAction에서 10프레임일 때 상태가 더 또렷하게 보이도록(현재 구조 유지하면서 가독성만 확보)

MVP 규칙:

* 10프레임 보너스는 “BONUS BALL” 오버레이가 뜨도록(현재 GameOverlay에 bonus 타입 있음)

---

## 7) 오버레이(STRIKE/SPARE/피드백) 정책

* 오버레이는 중앙에 1~1.5초 표시
* 탭(클릭)하면 즉시 dismiss(현재 GameOverlay는 onClick dismiss 지원)
* “TOO STRONG / TOO FAR LEFT / GUTTER” 등의 피드백도 동일 규칙
* 단, 오버레이는 “게임 UI”이지 “디버그 UI”가 아님 → 데모 텍스트는 제거

---

## 8) 구현 작업 목록(Claude가 해야 할 일)

1. `App.tsx`에서 중앙 `3D Canvas Area` dashed 카드 UI 제거
2. `App.tsx`에서 Demo 안내 바 제거
3. Pointer Events로 입력 로직 교체(mouse → pointer)
4. 입력 시작 영역 제한(하단 영역에서만 조준 시작)
5. drag → Shot 매핑을 권장 수치로 교체
6. AimingUI 단순화(좌측 Aim meter 제거 또는 최소화), 방향+파워 중심으로 정리
7. 코드 정리:

    * 상수/유틸 함수(`clamp`, `MAX_DRAG`)를 App.tsx 내부 또는 별도 util로 정리(과도한 파일 분리는 피함)
8. 빌드/린트 오류 없게 유지

---

## 9) 완료 기준(Definition of Done)

* 게임 화면에서 “3D Canvas Area” 카드/점선 보더/데모 안내가 **완전히 사라짐**
* 레인 배경(placeholder)이 **full-bleed로 깔리고**, HUD/BottomAction이 자연스럽게 떠 있음
* 하단 영역에서만 드래그 시작 가능
* 드래그하면 조준 가이드(AimingUI)가 나타나고, 손을 떼면 사라짐
* power/direction 값이 과민하지 않고 모바일에서도 안정적으로 동작
* 오버레이는 중앙에 잠깐 뜨고 탭으로 스킵 가능

---

## 10) 산출물

* 변경된 코드(특히 App.tsx, AimingUI.tsx)
* 주요 변경 사항 요약(짧게)
* 입력 매핑 수치(상수 포함) 명시

