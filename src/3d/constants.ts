// 월드 단위: 1 unit = 1 meter
// 실제 볼링 레인: 폭 1.05m, 길이 18.3m (MVP는 비율 중심)

export const LANE_WIDTH = 1.7;
export const LANE_LENGTH = 13.5;
export const LANE_THICKNESS = 0.2;
export const GUTTER_WIDTH = 0.28;
export const GUARDRAIL_HEIGHT = 0.25;

export const LANE_START_Z = 0;
export const LANE_END_Z = -LANE_LENGTH;
export const LANE_CENTER_Z = (LANE_START_Z + LANE_END_Z) / 2;

// 핀 크기
export const PIN_HEIGHT = 0.38;
export const PIN_RADIUS_TOP = 0.035;
export const PIN_RADIUS_BOTTOM = 0.05;

// 볼 크기
export const BALL_RADIUS = 0.11;

// 핀 배치 좌표 (x, z) - 레인 끝에서 삼각형 배치
// z는 레인 시작점 기준 (음의 Z 방향으로 공이 굴러감)
const PIN_ROW_SPACING = 0.3;
const PIN_COL_SPACING = 0.32;
const PIN_DECK_Z = LANE_END_Z + 2.0;

export const PIN_POSITIONS: [number, number][] = [
  [0, PIN_DECK_Z], // 1번 (헤드핀)
  [-PIN_COL_SPACING / 2, PIN_DECK_Z - PIN_ROW_SPACING],
  [PIN_COL_SPACING / 2, PIN_DECK_Z - PIN_ROW_SPACING],
  [-PIN_COL_SPACING, PIN_DECK_Z - PIN_ROW_SPACING * 2],
  [0, PIN_DECK_Z - PIN_ROW_SPACING * 2],
  [PIN_COL_SPACING, PIN_DECK_Z - PIN_ROW_SPACING * 2],
  [-PIN_COL_SPACING * 1.5, PIN_DECK_Z - PIN_ROW_SPACING * 3],
  [-PIN_COL_SPACING / 2, PIN_DECK_Z - PIN_ROW_SPACING * 3],
  [PIN_COL_SPACING / 2, PIN_DECK_Z - PIN_ROW_SPACING * 3],
  [PIN_COL_SPACING * 1.5, PIN_DECK_Z - PIN_ROW_SPACING * 3],
];

// 볼 시작 위치
export const BALL_START_POSITION = { x: 0, y: BALL_RADIUS + 0.02, z: -1.5 };

// 물리 상수
export const BALL_MASS = 7;
export const PIN_MASS = 1.5;
export const FRICTION = 0.38;
export const RESTITUTION = 0.3;
export const LINEAR_DAMPING = 0.32;
export const ANGULAR_DAMPING = 0.3;

// 쓰러짐 판정 각도 (라디안) - 약 30도
export const PIN_DOWN_ANGLE = Math.PI / 6;

// 볼 멈춤 판정
export const BALL_STOP_VELOCITY = 0.08;
export const BALL_STOP_FRAMES = 30;

// 투구 속도 매핑
export const MAX_BALL_SPEED = 12.4;
export const MIN_BALL_SPEED = 6.8;

// 카메라 위치
export const CAMERA_POSITION = { x: 0, y: 1.55, z: 3.1 };
export const CAMERA_LOOK_AT = { x: 0, y: 0.2, z: -4.6 };
