import type { PlayerScore, Turn } from '../../core/types';
import styles from './GameScreen.module.css';

interface ScoreBoardProps {
  playerScore: PlayerScore;
  cpuScore: PlayerScore;
  currentFrame: number;
  currentTurn: Turn;
}

export function ScoreBoard({
  playerScore,
  cpuScore,
  currentFrame,
  currentTurn,
}: ScoreBoardProps) {
  return (
    <div className={styles.scoreBoard}>
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

interface ScoreRowProps {
  label: string;
  score: PlayerScore;
  currentFrame: number;
  isActive: boolean;
}

function ScoreRow({ label, score, currentFrame, isActive }: ScoreRowProps) {
  return (
    <div className={`${styles.scoreRow} ${isActive ? styles.active : ''}`}>
      <div className={styles.playerLabel}>{label}</div>
      <div className={styles.frames}>
        {score.frames.map((frame) => (
          <div
            key={frame.frameNumber}
            className={`${styles.frame} ${
              frame.frameNumber === currentFrame ? styles.currentFrame : ''
            }`}
          >
            <div className={styles.frameNumber}>{frame.frameNumber}</div>
            <div className={styles.throws}>
              {frame.throws.map((t, i) => (
                <span key={i} className={styles.throwValue}>
                  {formatThrow(t.pinsKnocked.length, t.isStrike, t.isSpare)}
                </span>
              ))}
            </div>
            <div className={styles.frameScore}>
              {frame.score !== null ? frame.score : ''}
            </div>
          </div>
        ))}
      </div>
      <div className={styles.totalScore}>{score.totalScore}</div>
    </div>
  );
}

function formatThrow(
  pins: number,
  isStrike: boolean,
  isSpare: boolean
): string {
  if (isStrike) return 'X';
  if (isSpare) return '/';
  if (pins === 0) return '-';
  return pins.toString();
}
