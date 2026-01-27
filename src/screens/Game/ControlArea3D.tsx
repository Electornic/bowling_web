import { useRef, useState, useCallback } from 'react';
import type { Turn } from '../../core/types';
import styles from './GameScreen.module.css';

interface ControlArea3DProps {
  onDragEnd: (dragX: number, dragY: number, power: number) => void;
  enabled: boolean;
  currentTurn: Turn;
}

interface DragState {
  isDragging: boolean;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

export function ControlArea3D({ onDragEnd, enabled, currentTurn }: ControlArea3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
  });

  const getRelativePosition = useCallback((clientX: number, clientY: number) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: (clientX - rect.left) / rect.width - 0.5, // -0.5 ~ 0.5
      y: (clientY - rect.top) / rect.height - 0.5,
    };
  }, []);

  const handleStart = useCallback((clientX: number, clientY: number) => {
    if (!enabled) return;
    const pos = getRelativePosition(clientX, clientY);
    setDragState({
      isDragging: true,
      startX: pos.x,
      startY: pos.y,
      currentX: pos.x,
      currentY: pos.y,
    });
  }, [enabled, getRelativePosition]);

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!dragState.isDragging) return;
    const pos = getRelativePosition(clientX, clientY);
    setDragState((prev) => ({
      ...prev,
      currentX: pos.x,
      currentY: pos.y,
    }));
  }, [dragState.isDragging, getRelativePosition]);

  const handleEnd = useCallback(() => {
    if (!dragState.isDragging) return;

    const dx = dragState.currentX - dragState.startX;
    const dy = dragState.startY - dragState.currentY; // 위로 드래그 = 양수

    // 파워 계산 (드래그 거리)
    const distance = Math.sqrt(dx * dx + dy * dy);
    const power = Math.min(1, distance * 2);

    // 최소 파워 체크
    if (power > 0.1) {
      onDragEnd(dx * 2, dy, power);
    }

    setDragState({
      isDragging: false,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
    });
  }, [dragState, onDragEnd]);

  // Mouse events
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    handleStart(e.clientX, e.clientY);
  }, [handleStart]);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    handleMove(e.clientX, e.clientY);
  }, [handleMove]);

  const onMouseUp = useCallback(() => handleEnd(), [handleEnd]);
  const onMouseLeave = useCallback(() => {
    if (dragState.isDragging) handleEnd();
  }, [dragState.isDragging, handleEnd]);

  // Touch events
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    handleStart(touch.clientX, touch.clientY);
  }, [handleStart]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    handleMove(touch.clientX, touch.clientY);
  }, [handleMove]);

  const onTouchEnd = useCallback(() => handleEnd(), [handleEnd]);

  const isCpuTurn = currentTurn === 'CPU';

  // 드래그 화살표 계산
  const arrowLength = dragState.isDragging
    ? Math.sqrt(
        (dragState.currentX - dragState.startX) ** 2 +
        (dragState.currentY - dragState.startY) ** 2
      ) * 200
    : 0;


  return (
    <div
      ref={containerRef}
      className={`${styles.controlArea} ${enabled ? styles.enabled : styles.disabled}`}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {enabled && !dragState.isDragging && (
        <div className={styles.controlHint}>
          Drag up to throw
        </div>
      )}

      {enabled && dragState.isDragging && (
        <div className={styles.controlHint}>
          Release to throw
        </div>
      )}

      {dragState.isDragging && (
        <svg className={styles.dragIndicator}>
          {/* 시작점 */}
          <circle
            cx={`${(dragState.startX + 0.5) * 100}%`}
            cy={`${(dragState.startY + 0.5) * 100}%`}
            r="10"
            fill="#3b82f6"
          />
          {/* 현재점 */}
          <circle
            cx={`${(dragState.currentX + 0.5) * 100}%`}
            cy={`${(dragState.currentY + 0.5) * 100}%`}
            r="15"
            fill="#3b82f6"
            opacity="0.6"
          />
          {/* 연결선 */}
          <line
            x1={`${(dragState.startX + 0.5) * 100}%`}
            y1={`${(dragState.startY + 0.5) * 100}%`}
            x2={`${(dragState.currentX + 0.5) * 100}%`}
            y2={`${(dragState.currentY + 0.5) * 100}%`}
            stroke="#3b82f6"
            strokeWidth="4"
            strokeLinecap="round"
          />
          {/* 파워 인디케이터 */}
          <text
            x={`${(dragState.currentX + 0.5) * 100}%`}
            y={`${(dragState.currentY + 0.5) * 100 - 3}%`}
            fill="white"
            fontSize="14"
            textAnchor="middle"
          >
            {Math.round(arrowLength / 2)}%
          </text>
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
