import type { Difficulty } from '../../core/types';
import styles from './HomeScreen.module.css';

interface DifficultySelectorProps {
  selected: Difficulty;
  onSelect: (difficulty: Difficulty) => void;
}

const DIFFICULTIES: { value: Difficulty; label: string; description: string }[] = [
  { value: 'EASY', label: 'Easy', description: 'For beginners' },
  { value: 'NORMAL', label: 'Normal', description: 'Balanced challenge' },
  { value: 'HARD', label: 'Hard', description: 'For experienced players' },
  { value: 'PRO', label: 'Pro', description: 'Maximum challenge' },
];

export function DifficultySelector({ selected, onSelect }: DifficultySelectorProps) {
  return (
    <div className={styles.difficultySelector}>
      <h3 className={styles.selectorTitle}>Select Difficulty</h3>
      <div className={styles.difficultyOptions}>
        {DIFFICULTIES.map((diff) => (
          <button
            key={diff.value}
            className={`${styles.difficultyOption} ${
              selected === diff.value ? styles.selected : ''
            }`}
            onClick={() => onSelect(diff.value)}
          >
            <span className={styles.difficultyLabel}>{diff.label}</span>
            <span className={styles.difficultyDesc}>{diff.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
