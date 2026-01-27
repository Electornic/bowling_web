import type { Pin, Ball } from '../types';

export class PinEntity {
  private pin: Pin;
  private velocity: { x: number; y: number };

  constructor(pin: Pin) {
    this.pin = { ...pin };
    this.velocity = { x: 0, y: 0 };
  }

  getPin(): Pin {
    return { ...this.pin };
  }

  checkCollision(ball: Ball): boolean {
    if (!this.pin.isStanding) return false;

    const dx = ball.x - this.pin.x;
    const dy = ball.y - this.pin.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // 충돌 반경 (볼 + 핀)
    const collisionRadius = 0.04;

    return distance < collisionRadius;
  }

  applyImpact(ball: Ball): void {
    if (!this.pin.isStanding) return;

    const dx = this.pin.x - ball.x;
    const dy = this.pin.y - ball.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 0) {
      // 볼 속도에 비례한 충격
      const impactStrength = Math.sqrt(ball.vx ** 2 + ball.vy ** 2) * 2;
      this.velocity.x = (dx / distance) * impactStrength;
      this.velocity.y = (dy / distance) * impactStrength;
    }

    this.pin.isStanding = false;
  }

  update(deltaTime: number): void {
    if (this.pin.isStanding) return;

    this.pin.x += this.velocity.x * deltaTime;
    this.pin.y += this.velocity.y * deltaTime;

    // 감속
    this.velocity.x *= 0.95;
    this.velocity.y *= 0.95;
  }

  knockDown(): void {
    this.pin.isStanding = false;
  }

  reset(originalPin: Pin): void {
    this.pin = { ...originalPin };
    this.velocity = { x: 0, y: 0 };
  }
}
