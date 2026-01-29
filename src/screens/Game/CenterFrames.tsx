import type { PlayerScore, Turn } from '../../core/types';
import styles from './GameScreen.module.css';

interface CenterFramesProps {
  playerScore: PlayerScore;
  cpuScore: PlayerScore;
  currentFrame: number;
  currentTurn: Turn;
}

export function CenterFrames({
  playerScore,
  cpuScore,
  currentFrame,
  currentTurn,
}: CenterFramesProps) {
  return (
    <div className={styles.centerFrames}>
      <div className={styles.classicHeaderRow}>
        <div className={styles.classicLabelCell}>Frame</div>
        {playerScore.frames.map((frame) => (
          <div key={`h-${frame.frameNumber}`} className={styles.classicHeaderCell}>
            {frame.frameNumber}
          </div>
        ))}
        <div className={styles.classicTotalHeader}>Total</div>
      </div>

      <ScoreRow
        label="나"
        score={playerScore}
        currentFrame={currentFrame}
        isActive={currentTurn === 'PLAYER'}
      />
      <ScoreRow
        label="CPU"
        score={cpuScore}
        currentFrame={currentFrame}
        isActive={currentTurn === 'CPU'}
      />
    </div>
  );
}

function ScoreRow({
  label,
  score,
  currentFrame,
  isActive,
}: {
  label: string;
  score: PlayerScore;
  currentFrame: number;
  isActive: boolean;
}) {
  return (
    <div className={`${styles.classicScoreRow} ${isActive ? styles.classicScoreRowActive : ''}`}>
      <div className={styles.classicLabelCell}>{label}</div>
      {score.frames.map((frame) => {
        const isCurrent = frame.frameNumber === currentFrame;
        const boxes = getFrameBoxes(frame, frame.frameNumber);
        return (
          <div
            key={`${label}-${frame.frameNumber}`}
            className={`${styles.classicFrameCell} ${isCurrent ? styles.classicFrameCellCurrent : ''}`}
          >
            <div className={styles.classicThrowRow}>
              {boxes.map((value, index) => (
                <span
                  key={`${label}-${frame.frameNumber}-t-${index}`}
                  className={styles.classicThrowBox}
                >
                  {value}
                </span>
              ))}
            </div>
            <div className={styles.classicScoreValue}>
              {frame.score !== null ? frame.score : ''}
            </div>
          </div>
        );
      })}
      <div className={styles.classicTotalCell}>{score.totalScore}</div>
    </div>
  );
}

function getFrameBoxes(
  frame: PlayerScore['frames'][number],
  frameNumber: number
): string[] {
  const boxes = frameNumber === 10 ? ['', '', ''] : ['', ''];
  const throws = frame.throws;

  if (frameNumber < 10) {
    if (throws[0]) {
      if (throws[0].isStrike) {
        boxes[1] = 'X';
      } else {
        boxes[0] = formatThrow(throws[0].pinsKnocked.length, throws[0].isStrike, throws[0].isSpare);
      }
    }
    if (throws[1]) {
      boxes[1] = throws[1].isSpare
        ? '/'
        : formatThrow(throws[1].pinsKnocked.length, throws[1].isStrike, throws[1].isSpare);
    }
    return boxes;
  }

  for (let i = 0; i < Math.min(throws.length, 3); i += 1) {
    boxes[i] = formatThrow(throws[i].pinsKnocked.length, throws[i].isStrike, throws[i].isSpare);
  }
  return boxes;
}

function formatThrow(pins: number, isStrike: boolean, isSpare: boolean): string {
  if (isStrike) return 'X';
  if (isSpare) return '/';
  if (pins === 0) return '-';
  return pins.toString();
}
