import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameContext } from '../../contexts/GameContext';
import { Button } from '../../components/Button';
import { ScoreTable } from './ScoreTable';
import styles from './ResultScreen.module.css';

export function ResultScreen() {
  const navigate = useNavigate();
  const { state, startGame, resetGame } = useGameContext();

  const playerScore = state.finalPlayerScore;
  const cpuScore = state.finalCpuScore;

  // 점수가 없으면 홈으로
  useEffect(() => {
    if (!playerScore || !cpuScore) {
      navigate('/');
    }
  }, [playerScore, cpuScore, navigate]);

  if (!playerScore || !cpuScore) {
    return null;
  }

  const playerTotal = playerScore.totalScore;
  const cpuTotal = cpuScore.totalScore;

  let result: 'WIN' | 'LOSE' | 'DRAW';
  if (playerTotal > cpuTotal) {
    result = 'WIN';
  } else if (playerTotal < cpuTotal) {
    result = 'LOSE';
  } else {
    result = 'DRAW';
  }

  const handlePlayAgain = () => {
    startGame();
    navigate('/game');
  };

  const handleGoHome = () => {
    resetGame();
    navigate('/');
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.resultBanner}>
          <div className={`${styles.resultText} ${styles[result.toLowerCase()]}`}>
            {result === 'WIN' && '승리!'}
            {result === 'LOSE' && '패배'}
            {result === 'DRAW' && '무승부'}
          </div>
          <div className={styles.scoreComparison}>
            <span className={styles.playerScore}>{playerTotal}</span>
            <span className={styles.vs}>VS</span>
            <span className={styles.cpuScore}>{cpuTotal}</span>
          </div>
        </div>

        <ScoreTable playerScore={playerScore} cpuScore={cpuScore} />

        <div className={styles.actions}>
          <Button size="large" onClick={handlePlayAgain}>
            다시하기
          </Button>
          <Button size="large" variant="secondary" onClick={handleGoHome}>
            홈으로
          </Button>
        </div>
      </div>
    </div>
  );
}
