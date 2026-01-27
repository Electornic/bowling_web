// 월드 단위: 1 unit ≈ 10cm
// 실제 볼링 레인: 폭 1.05m, 길이 18.3m

export const LANE_WIDTH = 10.5;
export const LANE_LENGTH = 60;
export const LANE_THICKNESS = 0.5;
export const GUTTER_WIDTH = 1;
export const GUARDRAIL_HEIGHT = 1;

// 핀 크기
export const PIN_HEIGHT = 1.5;
export const PIN_RADIUS_TOP = 0.15;
export const PIN_RADIUS_BOTTOM = 0.25;

// 볼 크기
export const BALL_RADIUS = 0.55;

// 핀 배치 좌표 (x, z) - 레인 끝에서 삼각형 배치
// z는 레인 시작점 기준 (음의 Z 방향으로 공이 굴러감)
export const PIN_POSITIONS: [number, number][] = [
  [0, -55],                              // 1번 (헤드핀)
  [-0.6, -56.2], [0.6, -56.2],           // 2-3번
  [-1.2, -57.4], [0, -57.4], [1.2, -57.4], // 4-6번
  [-1.8, -58.6], [-0.6, -58.6], [0.6, -58.6], [1.8, -58.6], // 7-10번
];

// 볼 시작 위치
export const BALL_START_POSITION = { x: 0, y: BALL_RADIUS + 0.1, z: 25 };

// 물리 상수
export const BALL_MASS = 7;
export const PIN_MASS = 1.5;
export const FRICTION = 0.4;
export const RESTITUTION = 0.3;
export const LINEAR_DAMPING = 0.5;
export const ANGULAR_DAMPING = 0.5;

// 쓰러짐 판정 각도 (라디안) - 약 30도
export const PIN_DOWN_ANGLE = Math.PI / 6;

// 볼 멈춤 판정
export const BALL_STOP_VELOCITY = 0.5;
export const BALL_STOP_FRAMES = 30;

// 투구 속도 매핑
export const MAX_BALL_SPEED = 25;
export const MIN_BALL_SPEED = 10;

// 카메라 위치
export const CAMERA_POSITION = { x: 0, y: 8, z: 35 };
export const CAMERA_LOOK_AT = { x: 0, y: 0, z: -30 };
