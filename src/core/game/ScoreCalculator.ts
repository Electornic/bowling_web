import type { Frame, PlayerScore } from '../types';

export class ScoreCalculator {
  static calculateScore(frames: Frame[]): number {
    let total = 0;

    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i];
      if (!frame.throws.length) continue;

      const firstThrow = frame.throws[0]?.pinsKnocked.length ?? 0;
      const secondThrow = frame.throws[1]?.pinsKnocked.length ?? 0;

      if (i < 9) {
        // 1-9 프레임
        if (frame.throws[0]?.isStrike) {
          // 스트라이크: 10 + 다음 2투구
          total += 10 + this.getNextTwoThrows(frames, i);
        } else if (frame.throws[1]?.isSpare) {
          // 스페어: 10 + 다음 1투구
          total += 10 + this.getNextOneThrow(frames, i);
        } else {
          // 일반: 쓰러뜨린 핀 수
          total += firstThrow + secondThrow;
        }
      } else {
        // 10프레임: 모든 투구 합산
        total += frame.throws.reduce(
          (sum, t) => sum + t.pinsKnocked.length,
          0
        );
      }
    }

    return total;
  }

  private static getNextTwoThrows(frames: Frame[], currentIndex: number): number {
    const throws: number[] = [];

    for (let i = currentIndex + 1; i < frames.length && throws.length < 2; i++) {
      for (const t of frames[i].throws) {
        if (throws.length < 2) {
          throws.push(t.pinsKnocked.length);
        }
      }
    }

    return throws.reduce((sum, n) => sum + n, 0);
  }

  private static getNextOneThrow(frames: Frame[], currentIndex: number): number {
    for (let i = currentIndex + 1; i < frames.length; i++) {
      if (frames[i].throws.length > 0) {
        return frames[i].throws[0].pinsKnocked.length;
      }
    }
    return 0;
  }

  static createEmptyPlayerScore(): PlayerScore {
    const frames: Frame[] = [];
    for (let i = 1; i <= 10; i++) {
      frames.push({
        frameNumber: i,
        throws: [],
        score: null,
        isComplete: false,
      });
    }
    return { frames, totalScore: 0 };
  }
}
