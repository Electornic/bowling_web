import type { PlayerScore, Turn } from '../../core/types';
import styles from './GameScreen.module.css';

interface SideFramesProps {
  playerScore: PlayerScore;
  cpuScore: PlayerScore;
  currentFrame: number;
  currentTurn: Turn;
}

export function SideFrames({
  playerScore,
  cpuScore,
  currentFrame,
  currentTurn,
}: SideFramesProps) {
  return (
    <div className={styles.sideFrames}>
      <FrameColumn
        label="나"
        score={playerScore}
        isActive={currentTurn === 'PLAYER'}
        currentFrame={currentFrame}
        align="left"
      />
      <FrameColumn
        label="CPU"
        score={cpuScore}
        isActive={currentTurn === 'CPU'}
        currentFrame={currentFrame}
        align="right"
      />
    </div>
  );
}

interface FrameColumnProps {
  label: string;
  score: PlayerScore;
  isActive: boolean;
  currentFrame: number;
  align: 'left' | 'right';
}

function FrameColumn({
  label,
  score,
  isActive,
  currentFrame,
  align,
}: FrameColumnProps) {
  const columnClass =
    align === 'left' ? styles.sideColumnLeft : styles.sideColumnRight;

  return (
    <div className={`${styles.sideColumn} ${columnClass}`}>
      <div className={styles.sideHeader}>
        <span className={styles.sideName}>{label}</span>
        <span className={styles.sideTotal}>{score.totalScore}</span>
      </div>
      <div className={styles.frameList}>
        {score.frames.map((frame) => {
          const isCurrent = frame.frameNumber === currentFrame;
          return (
            <div
              key={frame.frameNumber}
              className={`${styles.frameRow} ${isCurrent ? styles.frameRowActive : ''}`}
            >
              <span className={styles.frameIndex}>{frame.frameNumber}</span>
              <div className={styles.throwCells}>
                {frame.throws.map((t, i) => (
                  <span key={i} className={styles.throwCell}>
                    {formatThrow(t.pinsKnocked.length, t.isStrike, t.isSpare)}
                  </span>
                ))}
              </div>
              <span className={styles.frameScoreSmall}>
                {frame.score !== null ? frame.score : ''}
              </span>
            </div>
          );
        })}
      </div>
      <div className={`${styles.sideTurnBadge} ${isActive ? styles.sideTurnBadgeActive : ''}`}>
        {isActive ? 'TURN' : ''}
      </div>
    </div>
  );
}

function formatThrow(pins: number, isStrike: boolean, isSpare: boolean): string {
  if (isStrike) return 'X';
  if (isSpare) return '/';
  if (pins === 0) return '-';
  return pins.toString();
}
