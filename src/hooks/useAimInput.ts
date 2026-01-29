import { useState, useCallback, useRef, useEffect } from 'react';
import type { Shot } from '../core/types';
import { SPIN_WINDOW_MS, SPIN_SENS } from '../3d/constants';

// 유틸 함수
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// 상수 (game_screen.md 기준)
const INPUT_AREA_RATIO = 0.40; // 화면 하단 40%에서만 입력 시작 가능

interface AimState {
  isAiming: boolean;
  direction: number; // -1 to 1
  power: number; // 0 to 1
  spin: number; // -1 to 1
}

interface PointerSample {
  x: number;
  y: number;
  time: number;
}

interface UseAimInputOptions {
  enabled: boolean;
  onShot: (shot: Shot) => void;
}

export function useAimInput({ enabled, onShot }: UseAimInputOptions) {
  const [aimState, setAimState] = useState<AimState>({
    isAiming: false,
    direction: 0,
    power: 0,
    spin: 0,
  });

  const startPosRef = useRef<{ x: number; y: number } | null>(null);
  const samplesRef = useRef<PointerSample[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // MAX_DRAG 계산 (뷰포트 높이 기준)
  const getMaxDrag = useCallback(() => {
    return Math.min(window.innerHeight * 0.38, 320);
  }, []);

  // 릴리즈 안정화: 마지막 60~100ms 동안의 샘플 평균
  const getStabilizedPosition = useCallback(() => {
    const now = Date.now();
    const recentSamples = samplesRef.current.filter(
      (s) => now - s.time < SPIN_WINDOW_MS
    );

    if (recentSamples.length === 0) {
      const lastSample = samplesRef.current[samplesRef.current.length - 1];
      return lastSample || { x: 0, y: 0 };
    }

    const avgX = recentSamples.reduce((sum, s) => sum + s.x, 0) / recentSamples.length;
    const avgY = recentSamples.reduce((sum, s) => sum + s.y, 0) / recentSamples.length;

    return { x: avgX, y: avgY };
  }, []);

  const getSpinFromSamples = useCallback((samples: PointerSample[]) => {
    if (samples.length < 2) return 0;
    const recent = samples.filter((s) => Date.now() - s.time <= SPIN_WINDOW_MS);
    if (recent.length < 2) return 0;
    const first = recent[0];
    const last = recent[recent.length - 1];
    const dxRecent = last.x - first.x;
    const width = window.innerWidth || 0;
    if (!Number.isFinite(width) || width <= 0) return 0;
    if (!Number.isFinite(dxRecent)) return 0;
    const spin = clamp((dxRecent / width) * SPIN_SENS, -1, 1);
    return spin;
  }, []);

  // Pointer 이벤트 핸들러
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!enabled) return;

      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const relativeY = (e.clientY - rect.top) / rect.height;

      // 입력 시작 영역 제한: 하단 40%에서만 시작 가능
      if (relativeY < (1 - INPUT_AREA_RATIO)) return;

      // 포인터 캡처
      (e.target as HTMLElement).setPointerCapture(e.pointerId);

      startPosRef.current = { x: e.clientX, y: e.clientY };
      samplesRef.current = [{ x: e.clientX, y: e.clientY, time: Date.now() }];

      setAimState({
        isAiming: true,
        direction: 0,
        power: 0,
        spin: 0,
      });
    },
    [enabled]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!aimState.isAiming || !startPosRef.current) return;

      const currentX = e.clientX;
      const currentY = e.clientY;

      // 샘플 기록
      samplesRef.current.push({ x: currentX, y: currentY, time: Date.now() });
      // 오래된 샘플 제거 (200ms 이상)
      const now = Date.now();
      samplesRef.current = samplesRef.current.filter((s) => now - s.time < 200);
      if (samplesRef.current.length > 60) {
        samplesRef.current = samplesRef.current.slice(samplesRef.current.length - 60);
      }

      const viewportWidth = window.innerWidth;
      const maxDrag = getMaxDrag();

      const dx = currentX - startPosRef.current.x;
      const dy = startPosRef.current.y - currentY; // 위로 드래그 = 양수
      const dragLength = Math.sqrt(dx * dx + dy * dy);
      const t = clamp(dragLength / maxDrag, 0, 1);

      // 좌우 방향 (둔감하게 - game_screen.md 기준)
      const normalizedDx = dx / viewportWidth;
      const direction = clamp(normalizedDx * 2, -1, 1);

      // 파워 곡선 (초반 빠르고 후반 완만)
      const power = clamp(0.15 + Math.pow(t, 0.75) * 0.85, 0.15, 1);
      const spin = getSpinFromSamples(samplesRef.current);

      setAimState({
        isAiming: true,
        direction,
        power,
        spin,
      });
    },
    [aimState.isAiming, getMaxDrag, getSpinFromSamples]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!aimState.isAiming || !startPosRef.current) return;

      // 포인터 릴리즈
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);

      // 안정화된 위치로 최종 값 계산
      const stabilized = getStabilizedPosition();
      const viewportWidth = window.innerWidth;
      const maxDrag = getMaxDrag();

      const dx = stabilized.x - startPosRef.current.x;
      const dy = startPosRef.current.y - stabilized.y;
      const dragLength = Math.sqrt(dx * dx + dy * dy);
      const t = clamp(dragLength / maxDrag, 0, 1);

      // 좌우 감도 (둔하게)
      const normalizedDx = dx / viewportWidth;
      const lineOffset = clamp(normalizedDx * 0.55, -0.45, 0.45);
      const angleOffset = clamp(normalizedDx * 0.16, -0.18, 0.18);

      // 파워 곡선
      const power = clamp(0.15 + Math.pow(t, 0.75) * 0.85, 0.15, 1);
      const spin = getSpinFromSamples(samplesRef.current);

      const shot: Shot = {
        lineOffset,
        angleOffset,
        power,
        spin,
      };

      // 최소 드래그 체크
      if (dragLength > 20) {
        onShot(shot);
      }

      // 상태 리셋
      setAimState({
        isAiming: false,
        direction: 0,
        power: 0,
        spin: 0,
      });
      startPosRef.current = null;
      samplesRef.current = [];
    },
    [aimState.isAiming, getMaxDrag, getStabilizedPosition, onShot]
  );

  const handlePointerCancel = useCallback(
    (e: React.PointerEvent) => {
      if (!aimState.isAiming) return;

      (e.target as HTMLElement).releasePointerCapture(e.pointerId);

      setAimState({
        isAiming: false,
        direction: 0,
        power: 0,
        spin: 0,
      });
      startPosRef.current = null;
      samplesRef.current = [];
    },
    [aimState.isAiming]
  );

  // ESC로 취소
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && aimState.isAiming) {
        setAimState({
          isAiming: false,
          direction: 0,
          power: 0,
          spin: 0,
        });
        startPosRef.current = null;
        samplesRef.current = [];
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [aimState.isAiming]);

  return {
    containerRef,
    aimState,
    pointerHandlers: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerCancel: handlePointerCancel,
    },
  };
}
