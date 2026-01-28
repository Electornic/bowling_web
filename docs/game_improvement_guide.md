# bowling_web 개선 작업 지시서 (three.js 순정 + Rapier 3D)

## 0) 목표
현재 메인 브랜치(배포 포함)는 이전보다 개선됐지만, 아직 아래 문제가 남아 “게임 같다”는 감각이 약함.

### 핵심 문제(체감)
- 공이 레인을 따라 굴러가는 “연속성”이 약함(중간에 허공/바닥 불안정, 시각적 끊김)
- 레인이 이어지지 않거나 단절된 듯 보임
- 공/핀 액션이 화면에서 잘 보이지 않음(카메라/스케일/조명)
- 물리가 가끔 불안정(터널링/이음새/좌표 불일치 가능성)

### 목표 결과
- 레인: **단일 시각 오브젝트 + 단일 바닥 콜라이더**로 끊김 제거
- 공: **절대 바닥을 통과/낙하하지 않도록**(CCD + fixed step)
- 카메라: 공/핀 액션이 “항상 화면 안에” 들어오도록
- 핀: 넘어짐이 자연스럽고, 판정이 흔들리지 않게

> 스택 고정: **Three.js 순정(react-three-fiber 사용 금지) + @dimforge/rapier3d-compat**

---

## 1) 작업 범위 (PR 단위로 나눠 진행)
### PR1 — 물리 안정화 & 레인 통합(최우선)
- 레인 바닥 collider를 **통짜 1개**로
- 공에 **CCD 활성화**
- fixed timestep + substep 적용
- collider debug draw 토글 추가(개발용)

### PR2 — 렌더링 연속성(레인 끊김/장면감)
- 레인 시각 오브젝트를 **단일 mesh**로 구성(또는 이음새 overlap)
- 거터/백보드 최소 추가(장면감)
- 기본 조명(ambient + directional) 및 그림자 최소 세팅

### PR3 — 카메라/UX(게임 느낌)
- 카메라 “AIM/ROLLING” 상태별 프리셋
- 공이 화면 밖으로 나가면 자동으로 따라가도록 follow cam
- FOV/near/far 튜닝(장난감 느낌 제거)

### PR4 — 핀 물리/판정
- 핀 콜라이더 단순화(캡슐/실린더 기반)
- 핀 쓰러짐 판정(각도 기반) + once-down 락
- 프레임 리셋/스페어 유지 정확화

---

## 2) 필수 아키텍처(구조) 규칙
### 2.1 단일 소스(Single Source of Truth)
- 물리(Rapier)가 좌표의 **진실**
- 렌더(Three)는 물리 상태를 받아서 mesh transform만 업데이트
- 렌더와 물리가 각각 따로 position을 바꾸면 금지(튐/낙하/불일치 원인)

### 2.2 월드 스케일 통일
- “대충 맞는” 스케일이라도 좋으니 하나로 통일
- 예시 권장(변경 가능):
    - laneLength = 18
    - laneWidth = 1.2
    - ballRadius = 0.11
    - pinHeight = 0.40

---

## 3) PR1: 물리 안정화 상세 요구
### 3.1 Rapier world 설정
- fixed timestep: 1/60
- substep: 2~4 (성능 고려)
- 중력: 기본 -9.81 (또는 스케일 맞춰 조정)

### 3.2 레인 바닥 collider (핵심)
- 레인 바닥 collider는 반드시 “통짜 1개”
- RigidBody: Fixed
- Collider: Cuboid(박스) 또는 Plane
- 레인을 여러 조각으로 만들지 말 것(이음새 gap으로 낙하 발생)

### 3.3 공 설정(터널링 방지)
- RigidBody: Dynamic
- Collider: Sphere
- 공에 CCD 활성화 (Rapier의 continuous collision / ccd 기능)
- 속도 상한 또는 damping 설정(너무 빠르면 충돌 누락 가능)

### 3.4 디버그 드로우(필수)
- 키 입력(예: `D`)로 collider debug draw 토글
- 화면에 collider wireframe을 렌더해서:
    - “보이는 바닥”과 “충돌 바닥”이 일치하는지 확인 가능하게

> PR1 완료 기준: 공이 어떤 샷에서도 바닥을 통과/낙하하지 않는다.

---

## 4) PR2: 레인 연속성(시각) & 장면감
### 4.1 레인 mesh 단일화
- 시각 레인도 가능하면 단일 mesh로
- 불가하면:
    - 구간을 overlap(겹치게) 배치하여 이음새가 보이지 않게
    - z-fighting 방지(미세 y 오프셋)

### 4.2 거터/백보드 최소 추가
- 좌/우 거터(얕은 홈 또는 가드)
- 핀 뒤 백보드(검은 판 1장)
- 이 2개만 있어도 “볼링장 장면” 느낌이 크게 올라감

### 4.3 조명
- AmbientLight + DirectionalLight
- 그림자(가능하면 낮은 품질로라도)
- Material은 meshStandardMaterial로 roughness/metalness 조정

---

## 5) PR3: 카메라/연출(체감 개선 최상위)
### 5.1 카메라 프리셋
- AIM 모드:
    - 공 뒤쪽 + 약간 위
    - 레인이 화면의 65~75% 차지
- ROLLING 모드:
    - 공을 부드럽게 따라감(lerp)
    - 공이 화면에서 사라지지 않게 가드

### 5.2 FOV/클리핑 튜닝
- 광각(FOV 큰 값) 금지 → 장난감 느낌
- near 너무 크면 레인 일부 클리핑 발생
- far 너무 작으면 핀/백보드 잘림

---

## 6) PR4: 핀 물리/판정/리셋
### 6.1 핀 콜라이더
- 단순 콜라이더 추천:
    - capsule or cylinder(+small sphere base)
- 질량/마찰/감쇠 적당히 조정(너무 가벼우면 날아감)

### 6.2 쓰러짐 판정
- 각도 기반:
    - up 벡터와 바닥 노멀 각도 > 25~35도면 down
- once down → 해당 프레임 동안 down 고정

### 6.3 리셋 규칙
- 1투구 후: down 핀 제거 또는 down 유지, standing만 남김
- 2투구 후: 다음 프레임 시작 시 10개 재배치

---

## 7) “문제-원인-해결” 빠른 진단표(작업 중 참고)
### 증상: 공이 중간에 떨어짐
- 원인: 바닥 collider 조각/gap, CCD 미적용, dt 불안정
- 해결: 바닥 통짜 + CCD + fixed step + substep

### 증상: 레인이 끊겨 보임
- 원인: 레인 mesh 분할, FOV 과다, z-fighting
- 해결: 단일 mesh, overlap, FOV 감소

### 증상: 공/핀 액션이 잘 안 보임
- 원인: 카메라 구도/거리, 공 스케일, follow 없음
- 해결: AIM/ROLLING 프리셋 + follow + 가드

---

## 8) 산출물 요구
- PR1~PR4 단계별 브랜치/PR 생성(가능하면)
- 각 PR에:
    - 변경 파일 목록
    - 핵심 상수(스케일/물리 파라미터/카메라 파라미터) 정리
    - 디버그 토글 사용법(D키 등)
- “재현 테스트”:
    - power=1.0, angle=±0.18, line=±0.45 등 극단 입력에서도 공 낙하/관통 없어야 함

---

## 9) 금지사항(중요)
- 레인 바닥 collider를 여러 조각으로 만들지 말 것
- 렌더(mesh) 좌표를 물리와 별도로 조작하지 말 것
- requestAnimationFrame dt를 그대로 물리에 넣지 말 것(고정 timestep 사용)
- “보기 좋게”를 위해 임시로 y를 흔들거나 scale로 속임수 쓰지 말 것(근본 문제 악화)

---
