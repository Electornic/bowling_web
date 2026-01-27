import type { Difficulty, DragInput, Pin } from '../types';
import { CPU_PARAMETERS } from './difficulty';

export class CpuController {
  private difficulty: Difficulty;

  constructor(difficulty: Difficulty) {
    this.difficulty = difficulty;
  }

  setDifficulty(difficulty: Difficulty): void {
    this.difficulty = difficulty;
  }

  generateThrow(remainingPins: Pin[]): DragInput {
    const params = CPU_PARAMETERS[this.difficulty];

    // 기본 목표: 중앙 또는 남은 핀 중심
    const targetX = this.calculateTargetX(remainingPins);

    // 오차 적용
    const directionError = (Math.random() - 0.5) * 2 * params.directionOffset;
    const powerError = 1 + (Math.random() - 0.5) * 2 * params.powerVariance;

    // 실수 발생 시 큰 오차
    const isMistake = Math.random() < params.mistakeChance;
    const mistakeMultiplier = isMistake ? 3 : 1;

    const direction = targetX + directionError * mistakeMultiplier;
    const power = Math.min(1, Math.max(0.5, 0.8 * powerError));

    return {
      startX: 0.5,
      startY: 1,
      endX: 0.5 + direction * 0.3,
      endY: 0.3,
      power,
      direction: direction * Math.PI * 0.25,
    };
  }

  private calculateTargetX(remainingPins: Pin[]): number {
    if (remainingPins.length === 0) return 0;

    // 남은 핀들의 평균 X 위치 계산
    const avgX =
      remainingPins.reduce((sum, pin) => sum + pin.x, 0) / remainingPins.length;

    // -0.5 ~ 0.5 범위로 정규화 (레인 중심 기준)
    return avgX - 0.5;
  }
}
