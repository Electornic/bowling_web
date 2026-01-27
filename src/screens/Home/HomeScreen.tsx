import { useNavigate } from 'react-router-dom';
import { useGameContext } from '../../contexts/GameContext';
import { Button } from '../../components/Button';
import { DifficultySelector } from './DifficultySelector';
import styles from './HomeScreen.module.css';

export function HomeScreen() {
  const navigate = useNavigate();
  const { state, setDifficulty, startGame } = useGameContext();

  const handleStartGame = () => {
    startGame();
    navigate('/game');
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.title}>Bowling</h1>
        <p className={styles.subtitle}>VS CPU</p>

        <DifficultySelector
          selected={state.difficulty}
          onSelect={setDifficulty}
        />

        <div className={styles.actions}>
          <Button size="large" fullWidth onClick={handleStartGame}>
            Start Game
          </Button>
        </div>
      </div>
    </div>
  );
}
