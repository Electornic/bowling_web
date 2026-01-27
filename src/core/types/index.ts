// Game State
export type GamePhase = 'READY' | 'AIM' | 'ROLLING' | 'RESULT';
export type Turn = 'PLAYER' | 'CPU';
export type Difficulty = 'EASY' | 'NORMAL' | 'HARD' | 'PRO';

// Pin
export interface Pin {
  id: number;
  x: number;
  y: number;
  isStanding: boolean;
}

// Ball
export interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  spin: number;
}

// Throw (투구)
export interface ThrowResult {
  pinsKnocked: number[];
  isStrike: boolean;
  isSpare: boolean;
}

// Frame
export interface Frame {
  frameNumber: number; // 1-10
  throws: ThrowResult[];
  score: number | null; // 누적 점수 (계산 전이면 null)
  isComplete: boolean;
}

// Player Score
export interface PlayerScore {
  frames: Frame[];
  totalScore: number;
}

// Game State
export interface GameState {
  phase: GamePhase;
  currentTurn: Turn;
  currentFrame: number; // 1-10
  currentThrow: number; // 1 or 2 (10프레임은 최대 3)
  playerScore: PlayerScore;
  cpuScore: PlayerScore;
  pins: Pin[];
  ball: Ball | null;
  difficulty: Difficulty;
}

// CPU Parameters (난이도별)
export interface CpuParameters {
  directionOffset: number; // 좌우 오차 범위
  angleOffset: number; // 진입 각도 오차
  powerVariance: number; // 힘 오차
  spinChance: number; // 스핀 사용 확률 (0-1)
  mistakeChance: number; // 실수 확률 (0-1)
}

// Drag Input
export interface DragInput {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  power: number; // 드래그 길이 기반
  direction: number; // 각도
}

// ==================== 3D Types ====================

// Shot (투구 파라미터 - GameCore ↔ Physics3D 인터페이스)
export interface Shot {
  lineOffset: number;    // -1 ~ 1 (레인 중심 기준 좌우 위치)
  angleOffset: number;   // -0.3 ~ 0.3 (라디안, yaw 방향)
  power: number;         // 0.5 ~ 1.0 (파워)
  spin: number;          // -1 ~ 1 (회전 방향/세기)
}

// 3D Vector
export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

// 3D Quaternion (회전)
export interface Quaternion3D {
  x: number;
  y: number;
  z: number;
  w: number;
}

// 3D Pin State
export interface PinState3D {
  id: number;
  position: Vector3D;
  rotation: Quaternion3D;
  isStanding: boolean;
}

// 3D Ball State
export interface BallState3D {
  position: Vector3D;
  rotation: Quaternion3D;
  velocity: Vector3D;
  angularVelocity: Vector3D;
}
