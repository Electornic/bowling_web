import type { Frame, ThrowResult } from '../types';

export class FrameManager {
  private frames: Frame[];
  private currentFrame: number;
  private currentThrow: number;

  constructor() {
    this.frames = this.initializeFrames();
    this.currentFrame = 1;
    this.currentThrow = 1;
  }

  private initializeFrames(): Frame[] {
    const frames: Frame[] = [];
    for (let i = 1; i <= 10; i++) {
      frames.push({
        frameNumber: i,
        throws: [],
        score: null,
        isComplete: false,
      });
    }
    return frames;
  }

  getCurrentFrame(): number {
    return this.currentFrame;
  }

  getCurrentThrow(): number {
    return this.currentThrow;
  }

  getFrames(): Frame[] {
    return [...this.frames];
  }

  recordThrow(result: ThrowResult): void {
    const frame = this.frames[this.currentFrame - 1];
    frame.throws.push(result);

    if (this.isFrameComplete(frame)) {
      frame.isComplete = true;
      this.advanceFrame();
    } else {
      this.currentThrow++;
    }
  }

  private isFrameComplete(frame: Frame): boolean {
    if (frame.frameNumber < 10) {
      // 1-9 프레임: 스트라이크 또는 2투구 완료
      return frame.throws[0]?.isStrike || frame.throws.length >= 2;
    } else {
      // 10프레임: 특별 규칙
      if (frame.throws.length < 2) return false;
      if (frame.throws.length === 2) {
        // 스트라이크나 스페어면 3투구 가능
        const hasBonus = frame.throws[0]?.isStrike || frame.throws[1]?.isSpare;
        return !hasBonus;
      }
      return frame.throws.length >= 3;
    }
  }

  private advanceFrame(): void {
    if (this.currentFrame < 10) {
      this.currentFrame++;
      this.currentThrow = 1;
    }
  }

  isGameComplete(): boolean {
    return this.frames[9].isComplete;
  }

  reset(): void {
    this.frames = this.initializeFrames();
    this.currentFrame = 1;
    this.currentThrow = 1;
  }
}
