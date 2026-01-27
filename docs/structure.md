# Bowling Game Web – Core Screen & CPU Design Spec

## 1. 프로젝트 전제
- 웹은 **프로토타입**
- 최종 목표는 **React Native 앱**
- 기본 게임 모드는 **VS CPU**
- 싱글 플레이(혼자 치는 모드)는 제공하지 않음
- 화면 수는 최소화 (3 Screen)

---

## 2. 전체 화면(Screen) 구성

### Screen 목록 (최소)
1. Home
2. Game
3. Result

> 중간 결과, 로딩, 튜토리얼 등은 별도 화면이 아닌 **오버레이/모달**로 처리

---

## 3. Screen별 기능 정의

---

### 3.1 Home Screen

#### 목적
- 게임 시작 전 최소 설정
- UX 진입 장벽 최소화

#### 주요 기능
- 게임 시작 버튼
- CPU 난이도 선택 (필수)
    - Easy
    - Normal
    - Hard
    - Pro
- (선택) 튜토리얼 버튼
- (선택) 옵션 버튼

#### UX 정책
- 진입 시 기본 난이도: Normal
- 난이도 선택 후 바로 시작 가능
- 별도 로그인 없음

---

### 3.2 Game Screen (Core Screen)

#### 목적
- 실제 게임 플레이 진행
- 플레이어 vs CPU 턴제 진행

#### 화면 구성
- 상단: 스코어보드
    - Player / CPU
    - 프레임(1~10)
    - 각 프레임 점수
- 중앙: 볼링 레인 (Canvas)
- 하단: 조작 영역

---

#### 턴 시스템
- 턴 순서
    1. Player 투구
    2. CPU 투구
- 프레임 단위로 반복
- 각 플레이어는 최대 2투구 (10프레임 예외)

---

#### Player 조작
- 드래그 입력
    - 좌우 이동: 방향
    - 드래그 길이: 파워
- 드래그 종료 시 투구
- 투구 중 입력 비활성화

---

#### CPU 동작 (자동 투구)
- 사용자 입력 없음
- 난이도 기반 파라미터로 투구 시뮬레이션

---

#### 게임 로직
- 프레임 관리 (1~10)
- 스트라이크 / 스페어 판정
- 남은 핀 상태 관리
- 게임 종료 조건 판단

---

#### 중간 결과 처리
- 별도 화면 없음
- Game Screen 내 오버레이로 처리
    - STRIKE / SPARE 텍스트
    - 쓰러진 핀 수 표시
- 1~2초 후 자동 진행
- 터치 시 즉시 스킵 가능

---

### 3.3 Result Screen

#### 목적
- 게임 결과 요약
- 재플레이 유도

#### 기능
- Player vs CPU 최종 점수
- 승 / 패 / 무승부 표시
- 프레임별 점수 테이블
- 다시하기 버튼
- 홈으로 버튼

---

## 4. CPU 시스템 설계

### 4.1 CPU 개념
- CPU는 “점수를 미리 정해두는 방식”이 아님
- **투구 파라미터를 기반으로 실제 투구 시뮬레이션**

---

### 4.2 CPU 투구 파라미터
- directionOffset: 좌우 오차
- angleOffset: 진입 각도 오차
- powerVariance: 힘 오차
- spinChance: 스핀 사용 확률
- mistakeChance: 실수 확률

---

### 4.3 난이도별 CPU 성향

#### Easy
- 중앙 정확도 낮음
- 실수 확률 높음
- 스페어 성공률 낮음
- 가터/미스 자주 발생

#### Normal
- 중앙 근처 자주 진입
- 스페어 성공률 중간
- 스트라이크 간헐적

#### Hard
- 포켓 진입 확률 높음
- 스페어 성공률 높음
- 실수는 가끔 발생

#### Pro
- 포켓 진입 거의 고정
- 스페어 거의 성공
- 연속 스트라이크 가능
- 아주 낮은 확률의 인간적인 실수 포함

---

## 5. 게임 코어 아키텍처 (공통)

> Web / RN 공통 사용 가능 구조

### Core Modules
- GameState
- TurnManager
- FrameManager
- ScoreCalculator
- PhysicsEngine
- InputController
- CpuController

```ts
GameCore
 ├─ State (READY | AIM | ROLLING | RESULT)
 ├─ TurnManager (PLAYER | CPU)
 ├─ FrameManager
 ├─ ScoreCalculator
 ├─ PhysicsEngine
 ├─ InputController (Player)
 └─ CpuController
 ```

### 6. 설계 원칙
- Screen은 최대한 적게
- 모든 중간 상태는 오버레이로 처리
- CPU는 "이긴다/진다"가 아니라 "그럴듯하게 친다"
- Web은 빠르게 만들고, 구조는 RN 이식 가능하게 유지

### 7. 향후 확장 (Out of Scope)
- 멀티플레이
- 온라인 랭킹
- 광고(Google Adsense / Admob)
- 캐릭터/스킨 시스템
- 데일리 챌린지