import type { Ball, DragInput } from '../types';

export class BallEntity {
  private ball: Ball;

  constructor() {
    this.ball = this.createDefault();
  }

  private createDefault(): Ball {
    return {
      x: 0.5,
      y: 0.85,
      vx: 0,
      vy: 0,
      spin: 0,
    };
  }

  getBall(): Ball {
    return { ...this.ball };
  }

  setFromDragInput(input: DragInput): void {
    // 볼은 레인 하단에서 시작
    // 드래그 방향으로 던짐 (위쪽으로)
    const dx = input.endX - input.startX;

    this.ball = {
      x: 0.5 + dx * 0.5, // 드래그 방향에 따라 시작 위치 조절
      y: 0.85,
      vx: dx * input.power * 0.3, // 좌우 방향
      vy: -input.power * 1.2, // 위쪽으로 (음수)
      spin: input.direction * 0.3,
    };
  }

  update(deltaTime: number): void {
    // 기본 물리 업데이트
    this.ball.x += this.ball.vx * deltaTime;
    this.ball.y += this.ball.vy * deltaTime;

    // 스핀에 의한 커브
    this.ball.vx += this.ball.spin * deltaTime * 0.05;

    // 마찰에 의한 감속 (약간)
    this.ball.vx *= 0.995;
    this.ball.vy *= 0.998;
    this.ball.spin *= 0.99;
  }

  isOutOfBounds(): boolean {
    return this.ball.y < -0.1 || this.ball.x < 0 || this.ball.x > 1;
  }

  isStopped(): boolean {
    const speed = Math.sqrt(this.ball.vx ** 2 + this.ball.vy ** 2);
    return speed < 0.01;
  }

  reset(): void {
    this.ball = this.createDefault();
  }
}
