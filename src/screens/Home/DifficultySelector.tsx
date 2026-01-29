import type { Difficulty } from '../../core/types';
import styles from './HomeScreen.module.css';

interface DifficultySelectorProps {
  selected: Difficulty;
  onSelect: (difficulty: Difficulty) => void;
}

const DIFFICULTIES: { value: Difficulty; label: string; description: string }[] = [
  { value: 'EASY', label: '쉬움', description: '가볍게 즐기기' },
  { value: 'NORMAL', label: '보통', description: '균형 잡힌 난이도' },
  { value: 'HARD', label: '어려움', description: '숙련자용' },
  { value: 'PRO', label: '프로', description: '최고 난이도' },
];

export function DifficultySelector({ selected, onSelect }: DifficultySelectorProps) {
  return (
    <div className={styles.difficultySelector}>
      <h3 className={styles.selectorTitle}>난이도 선택</h3>
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
