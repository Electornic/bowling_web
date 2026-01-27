import type { PlayerScore } from '../../core/types';
import styles from './ResultScreen.module.css';

interface ScoreTableProps {
  playerScore: PlayerScore;
  cpuScore: PlayerScore;
}

export function ScoreTable({ playerScore, cpuScore }: ScoreTableProps) {
  return (
    <div className={styles.scoreTable}>
      <div className={styles.tableHeader}>
        <div className={styles.playerColumn}>Player</div>
        {Array.from({ length: 10 }, (_, i) => (
          <div key={i} className={styles.frameColumn}>
            {i + 1}
          </div>
        ))}
        <div className={styles.totalColumn}>Total</div>
      </div>

      <ScoreTableRow label="YOU" score={playerScore} highlight />
      <ScoreTableRow label="CPU" score={cpuScore} />
    </div>
  );
}

interface ScoreTableRowProps {
  label: string;
  score: PlayerScore;
  highlight?: boolean;
}

function ScoreTableRow({ label, score, highlight }: ScoreTableRowProps) {
  return (
    <div className={`${styles.tableRow} ${highlight ? styles.highlight : ''}`}>
      <div className={styles.playerColumn}>{label}</div>
      {score.frames.map((frame) => (
        <div key={frame.frameNumber} className={styles.frameColumn}>
          <div className={styles.throwsRow}>
            {frame.throws.map((t, i) => (
              <span key={i} className={styles.throwCell}>
                {formatThrow(t.pinsKnocked.length, t.isStrike, t.isSpare)}
              </span>
            ))}
          </div>
          <div className={styles.frameTotalCell}>
            {frame.score ?? '-'}
          </div>
        </div>
      ))}
      <div className={styles.totalColumn}>{score.totalScore}</div>
    </div>
  );
}

function formatThrow(pins: number, isStrike: boolean, isSpare: boolean): string {
  if (isStrike) return 'X';
  if (isSpare) return '/';
  if (pins === 0) return '-';
  return pins.toString();
}
