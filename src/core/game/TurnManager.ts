import type { Turn } from '../types';

export class TurnManager {
  private currentTurn: Turn;
  private frameThrowsPlayer: number;
  private frameThrowsCpu: number;

  constructor() {
    this.currentTurn = 'PLAYER';
    this.frameThrowsPlayer = 0;
    this.frameThrowsCpu = 0;
  }

  getCurrentTurn(): Turn {
    return this.currentTurn;
  }

  switchTurn(): void {
    this.currentTurn = this.currentTurn === 'PLAYER' ? 'CPU' : 'PLAYER';
  }

  recordThrow(): void {
    if (this.currentTurn === 'PLAYER') {
      this.frameThrowsPlayer++;
    } else {
      this.frameThrowsCpu++;
    }
  }

  shouldSwitchTurn(_isStrike: boolean, isFrameComplete: boolean): boolean {
    // 프레임이 완료되면 턴 교체
    return isFrameComplete;
  }

  resetFrame(): void {
    this.frameThrowsPlayer = 0;
    this.frameThrowsCpu = 0;
  }

  reset(): void {
    this.currentTurn = 'PLAYER';
    this.frameThrowsPlayer = 0;
    this.frameThrowsCpu = 0;
  }
}
