import type { DragInput, Turn } from '../../core/types';
import { useDragInput } from '../../hooks/useDragInput';
import styles from './GameScreen.module.css';

interface ControlAreaProps {
  onThrow: (input: DragInput) => void;
  enabled: boolean;
  currentTurn: Turn;
}

export function ControlArea({ onThrow, enabled, currentTurn }: ControlAreaProps) {
  const { containerRef, dragState, handlers } = useDragInput({
    onDragEnd: onThrow,
    enabled,
  });

  const isCpuTurn = currentTurn === 'CPU';

  return (
    <div
      ref={containerRef}
      className={`${styles.controlArea} ${enabled ? styles.enabled : styles.disabled}`}
      {...handlers}
    >
      {enabled && (
        <div className={styles.controlHint}>
          {dragState.isDragging
            ? 'Release to throw'
            : 'Drag to aim and throw'}
        </div>
      )}

      {dragState.isDragging && (
        <svg className={styles.dragIndicator}>
          <line
            x1={`${dragState.startX * 100}%`}
            y1={`${dragState.startY * 100}%`}
            x2={`${dragState.currentX * 100}%`}
            y2={`${dragState.currentY * 100}%`}
            stroke="#3b82f6"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle
            cx={`${dragState.startX * 100}%`}
            cy={`${dragState.startY * 100}%`}
            r="8"
            fill="#3b82f6"
          />
          <circle
            cx={`${dragState.currentX * 100}%`}
            cy={`${dragState.currentY * 100}%`}
            r="12"
            fill="#3b82f6"
            opacity="0.5"
          />
        </svg>
      )}

      {!enabled && isCpuTurn && (
        <div className={styles.waitingMessage}>
          CPU is throwing...
        </div>
      )}

      {!enabled && !isCpuTurn && !dragState.isDragging && (
        <div className={styles.waitingMessage}>
          Wait...
        </div>
      )}
    </div>
  );
}
