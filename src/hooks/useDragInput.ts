import { useCallback, useRef, useState } from 'react';
import type { DragInput } from '../core/types';

interface DragState {
  isDragging: boolean;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

interface UseDragInputOptions {
  onDragEnd?: (input: DragInput) => void;
  maxPower?: number;
  enabled?: boolean;
}

export function useDragInput(options: UseDragInputOptions = {}) {
  const { onDragEnd, maxPower = 300, enabled = true } = options;

  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
  });

  const containerRef = useRef<HTMLDivElement>(null);

  const getRelativePosition = useCallback(
    (clientX: number, clientY: number) => {
      if (!containerRef.current) return { x: 0, y: 0 };

      const rect = containerRef.current.getBoundingClientRect();
      return {
        x: (clientX - rect.left) / rect.width,
        y: (clientY - rect.top) / rect.height,
      };
    },
    []
  );

  const handleStart = useCallback(
    (clientX: number, clientY: number) => {
      if (!enabled) return;

      const pos = getRelativePosition(clientX, clientY);
      setDragState({
        isDragging: true,
        startX: pos.x,
        startY: pos.y,
        currentX: pos.x,
        currentY: pos.y,
      });
    },
    [enabled, getRelativePosition]
  );

  const handleMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!dragState.isDragging) return;

      const pos = getRelativePosition(clientX, clientY);
      setDragState((prev) => ({
        ...prev,
        currentX: pos.x,
        currentY: pos.y,
      }));
    },
    [dragState.isDragging, getRelativePosition]
  );

  const handleEnd = useCallback(() => {
    if (!dragState.isDragging) return;

    const dx = dragState.currentX - dragState.startX;
    const dy = dragState.currentY - dragState.startY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const power = Math.min(distance * 500, maxPower) / maxPower;
    const direction = Math.atan2(dx, -dy);

    const input: DragInput = {
      startX: dragState.startX,
      startY: dragState.startY,
      endX: dragState.currentX,
      endY: dragState.currentY,
      power,
      direction,
    };

    setDragState({
      isDragging: false,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
    });

    onDragEnd?.(input);
  }, [dragState, maxPower, onDragEnd]);

  // Mouse events
  const onMouseDown = useCallback(
    (e: React.MouseEvent) => handleStart(e.clientX, e.clientY),
    [handleStart]
  );

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => handleMove(e.clientX, e.clientY),
    [handleMove]
  );

  const onMouseUp = useCallback(() => handleEnd(), [handleEnd]);
  const onMouseLeave = useCallback(() => handleEnd(), [handleEnd]);

  // Touch events
  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      handleStart(touch.clientX, touch.clientY);
    },
    [handleStart]
  );

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      handleMove(touch.clientX, touch.clientY);
    },
    [handleMove]
  );

  const onTouchEnd = useCallback(() => handleEnd(), [handleEnd]);

  return {
    containerRef,
    dragState,
    handlers: {
      onMouseDown,
      onMouseMove,
      onMouseUp,
      onMouseLeave,
      onTouchStart,
      onTouchMove,
      onTouchEnd,
    },
  };
}
