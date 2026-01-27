import type { Pin, Ball, DragInput, ThrowResult } from '../types';
import { BallEntity } from './Ball';
import { PinEntity } from './Pin';

export class PhysicsEngine {
  private ball: BallEntity;
  private pins: PinEntity[];
  private originalPins: Pin[];
  private isSimulating: boolean;
  private knockedPinIds: number[];

  constructor(pins: Pin[]) {
    this.ball = new BallEntity();
    this.originalPins = pins.map((p) => ({ ...p }));
    this.pins = pins.map((p) => new PinEntity(p));
    this.isSimulating = false;
    this.knockedPinIds = [];
  }

  startThrow(input: DragInput): void {
    this.ball.setFromDragInput(input);
    this.isSimulating = true;
    this.knockedPinIds = [];
  }

  update(deltaTime: number): boolean {
    if (!this.isSimulating) return false;

    // 볼 업데이트
    this.ball.update(deltaTime);
    const ballState = this.ball.getBall();

    // 핀 충돌 체크
    for (const pin of this.pins) {
      if (pin.checkCollision(ballState)) {
        pin.applyImpact(ballState);
        this.knockedPinIds.push(pin.getPin().id);
      }
    }

    // 핀 업데이트
    for (const pin of this.pins) {
      pin.update(deltaTime);
    }

    // 핀끼리 충돌 (간단한 버전)
    this.checkPinToPinCollision();

    // 시뮬레이션 종료 조건
    if (this.ball.isOutOfBounds() || this.ball.isStopped()) {
      this.isSimulating = false;
    }

    return this.isSimulating;
  }

  private checkPinToPinCollision(): void {
    const pinStates = this.pins.map((p) => p.getPin());

    for (let i = 0; i < pinStates.length; i++) {
      for (let j = i + 1; j < pinStates.length; j++) {
        const pinA = pinStates[i];
        const pinB = pinStates[j];

        // 쓰러진 핀이 서있는 핀과 충돌
        if (!pinA.isStanding && pinB.isStanding) {
          const dx = pinB.x - pinA.x;
          const dy = pinB.y - pinA.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 0.05) {
            this.pins[j].knockDown();
            if (!this.knockedPinIds.includes(pinB.id)) {
              this.knockedPinIds.push(pinB.id);
            }
          }
        }
      }
    }
  }

  getResult(): ThrowResult {
    const standingCount = this.pins.filter((p) => p.getPin().isStanding).length;
    const totalPins = this.pins.length;
    const knockedCount = this.knockedPinIds.length;

    return {
      pinsKnocked: [...this.knockedPinIds],
      isStrike: knockedCount === 10 && totalPins === 10,
      isSpare: standingCount === 0 && knockedCount < 10,
    };
  }

  getBallPosition(): Ball {
    return this.ball.getBall();
  }

  getPinStates(): Pin[] {
    return this.pins.map((p) => p.getPin());
  }

  isRunning(): boolean {
    return this.isSimulating;
  }

  resetPins(): void {
    this.pins = this.originalPins.map((p) => new PinEntity({ ...p, isStanding: true }));
    this.knockedPinIds = [];
  }

  updateStandingPins(standingPins: Pin[]): void {
    const standingIds = new Set(standingPins.map((p) => p.id));
    this.pins = this.originalPins.map((p) =>
      new PinEntity({ ...p, isStanding: standingIds.has(p.id) })
    );
  }

  reset(): void {
    this.ball.reset();
    this.resetPins();
    this.isSimulating = false;
    this.knockedPinIds = [];
  }
}
