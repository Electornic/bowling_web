import { useCallback, useRef, useState } from 'react';
import type { Difficulty, Shot, ThrowResult, GameState } from '../core/types';
import { GameStateManager } from '../core/game/GameState';
import type { Scene3DRef } from '../3d/Scene3D';
import { BALL_RADIUS, LANE_WIDTH, PIN_POSITIONS } from '../3d/constants';

export interface OverlayState {
  visible: boolean;
  text: string;
  subText?: string;
}

interface UseGame3DOptions {
  onGameOver?: (state: GameState) => void;
}

export function useGame3D(difficulty: Difficulty = 'NORMAL', options: UseGame3DOptions = {}) {
  const { onGameOver } = options;

  const gameManager = useRef(new GameStateManager(difficulty));
  const scene3DRef = useRef<Scene3DRef | null>(null);

  const [gameState, setGameState] = useState(() => gameManager.current.getState());
  const [isAnimating, setIsAnimating] = useState(false);
  const [overlay, setOverlay] = useState<OverlayState>({ visible: false, text: '' });
  const [standingPinIds, setStandingPinIds] = useState<number[]>([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  const [cpuHasShotThisTurn, setCpuHasShotThisTurn] = useState(false);
  const [lastShotAppliedAt, setLastShotAppliedAt] = useState<number | null>(null);
  const standingPinIdsRef = useRef<number[]>([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

  const pendingAction = useRef<'NEXT_THROW' | 'SWITCH_TURN' | 'GAME_OVER' | null>(null);
  const shouldResetPinsRef = useRef(false);
  const cpuHasShotRef = useRef(false);
  const cpuShotTimeoutRef = useRef<number | null>(null);
  const shotTimeoutRef = useRef<number | null>(null);
  const activeShotTokenRef = useRef<number | null>(null);
  const shotTokenCounterRef = useRef(0);

  const setScene3DRef = useCallback((ref: Scene3DRef | null) => {
    scene3DRef.current = ref;
  }, []);

  const syncState = useCallback(() => {
    setGameState(gameManager.current.getState());
  }, []);

  const syncStandingPinsRef = useCallback((pins: number[]) => {
    standingPinIdsRef.current = pins;
  }, []);

  const handleThrowComplete = useCallback((result: ThrowResult, token?: number) => {
    if (activeShotTokenRef.current === null) {
      return;
    }
    if (typeof token === 'number' && activeShotTokenRef.current !== token) {
      return;
    }
    activeShotTokenRef.current = null;
    if (shotTimeoutRef.current !== null) {
      window.clearTimeout(shotTimeoutRef.current);
      shotTimeoutRef.current = null;
    }
    const currentStandingPins = standingPinIdsRef.current;
    const filteredPins = result.pinsKnocked.filter((id) => currentStandingPins.includes(id));
    const allPinsKnocked = filteredPins.length === currentStandingPins.length;
    const isStrike = currentStandingPins.length === 10 && allPinsKnocked;
    const isSpare = !isStrike && allPinsKnocked;
    const sanitizedResult: ThrowResult = {
      pinsKnocked: filteredPins,
      isStrike,
      isSpare,
    };

    const info = gameManager.current.recordThrow(sanitizedResult);
    shouldResetPinsRef.current = info.shouldResetPins;

    // 남은 핀 업데이트
    const newStandingPins = currentStandingPins.filter(
      (id) => !sanitizedResult.pinsKnocked.includes(id)
    );
    setStandingPinIds(newStandingPins);
    syncStandingPinsRef(newStandingPins);

    // 오버레이 표시
    if (sanitizedResult.isStrike) {
      setOverlay({ visible: true, text: 'STRIKE!' });
    } else if (sanitizedResult.isSpare) {
      setOverlay({ visible: true, text: 'SPARE!' });
    } else {
      const count = sanitizedResult.pinsKnocked.length;
      setOverlay({
        visible: true,
        text: count === 0 ? 'GUTTER' : `${count} PIN${count > 1 ? 'S' : ''}`,
      });
    }

    // 다음 액션 결정
    if (gameManager.current.isGameOver()) {
      pendingAction.current = 'GAME_OVER';
    } else if (info.isTurnComplete) {
      pendingAction.current = 'SWITCH_TURN';
    } else {
      pendingAction.current = 'NEXT_THROW';
    }

    setIsAnimating(false);
    setTimeout(() => {
      if (pendingAction.current) {
        dismissOverlay();
      }
    }, 800);
    syncState();
  }, [syncState, syncStandingPinsRef]);

  const startShotTimeout = useCallback(() => {
    shotTokenCounterRef.current += 1;
    const token = shotTokenCounterRef.current;
    activeShotTokenRef.current = token;
    if (shotTimeoutRef.current !== null) {
      window.clearTimeout(shotTimeoutRef.current);
    }
    shotTimeoutRef.current = window.setTimeout(() => {
      if (activeShotTokenRef.current !== token) return;
      shotTimeoutRef.current = null;
      handleThrowComplete({
        pinsKnocked: [],
        isStrike: false,
        isSpare: false,
      }, token);
    }, 8000);
  }, [handleThrowComplete]);

  const triggerCpuShot = useCallback(() => {
    if (!scene3DRef.current || isAnimating) return;
    if (cpuHasShotRef.current) return;

    // CPU Shot 생성 (난이도 기반)
    const state = gameManager.current.getState();
    const shot = generateCpuShot(state.difficulty, standingPinIdsRef.current);

    cpuHasShotRef.current = true;
    setCpuHasShotThisTurn(true);
    setIsAnimating(true);
    gameManager.current.setPhase('ROLLING');
    scene3DRef.current.applyShot(shot);
    setLastShotAppliedAt(Date.now());
    startShotTimeout();
    syncState();
  }, [isAnimating, syncState, startShotTimeout]);

  const scheduleCpuShot = useCallback((delay: number) => {
    if (cpuShotTimeoutRef.current !== null) return;
    if (cpuHasShotRef.current) return;
    cpuShotTimeoutRef.current = window.setTimeout(() => {
      cpuShotTimeoutRef.current = null;
      triggerCpuShot();
    }, delay);
  }, [triggerCpuShot]);

  const dismissOverlay = useCallback(() => {
    setOverlay({ visible: false, text: '' });

    const action = pendingAction.current;
    pendingAction.current = null;

    if (action === 'GAME_OVER') {
      onGameOver?.(gameManager.current.getState());
      return;
    }

    // 핀/볼 리셋은 다음 턴 시작 시에만 실행
    if (action === 'SWITCH_TURN' || action === 'NEXT_THROW') {
      const shouldFullReset = action === 'SWITCH_TURN' || shouldResetPinsRef.current;
      if (shouldFullReset) {
        const fullPins = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        setStandingPinIds(fullPins);
        syncStandingPinsRef(fullPins);
        scene3DRef.current?.resetPins([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      }
      shouldResetPinsRef.current = false;

      scene3DRef.current?.resetBall();
    }

    if (action === 'SWITCH_TURN') {
      gameManager.current.switchTurn();
      syncState();

      // CPU 턴이면 자동 투구
      const state = gameManager.current.getState();
      if (state.currentTurn === 'CPU') {
        cpuHasShotRef.current = false;
        setCpuHasShotThisTurn(false);
        gameManager.current.setPhase('AIM');
        syncState();
        scheduleCpuShot(1000);
      } else {
        cpuHasShotRef.current = false;
        setCpuHasShotThisTurn(false);
        gameManager.current.setPhase('AIM');
        syncState();
      }
    } else if (action === 'NEXT_THROW') {
      const state = gameManager.current.getState();
      if (state.currentTurn === 'CPU') {
        cpuHasShotRef.current = false;
        setCpuHasShotThisTurn(false);
        gameManager.current.setPhase('AIM');
        syncState();
        scheduleCpuShot(1000);
      } else {
        cpuHasShotRef.current = false;
        setCpuHasShotThisTurn(false);
        gameManager.current.setPhase('AIM');
        syncState();
      }
    }
  }, [syncState, onGameOver, scheduleCpuShot]);

  const playerShot = useCallback((shot: Shot) => {
    if (!scene3DRef.current || isAnimating) return;
    if (gameManager.current.getState().currentTurn !== 'PLAYER') return;

    setIsAnimating(true);
    gameManager.current.setPhase('ROLLING');
    scene3DRef.current.applyShot(shot);
    setLastShotAppliedAt(Date.now());
    startShotTimeout();
    syncState();
  }, [isAnimating, syncState, startShotTimeout]);

  const startNewGame = useCallback((newDifficulty?: Difficulty) => {
    const diff = newDifficulty ?? difficulty;
    gameManager.current.reset(diff);
    gameManager.current.setPhase('AIM');
    setOverlay({ visible: false, text: '' });
    const fullPins = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    setStandingPinIds(fullPins);
    syncStandingPinsRef(fullPins);
    pendingAction.current = null;
    shouldResetPinsRef.current = false;
    cpuHasShotRef.current = false;
    setCpuHasShotThisTurn(false);
    setLastShotAppliedAt(null);
    if (cpuShotTimeoutRef.current !== null) {
      window.clearTimeout(cpuShotTimeoutRef.current);
      cpuShotTimeoutRef.current = null;
    }
    if (shotTimeoutRef.current !== null) {
      window.clearTimeout(shotTimeoutRef.current);
      shotTimeoutRef.current = null;
    }
    activeShotTokenRef.current = null;

    // 씬 리셋
    setTimeout(() => {
      scene3DRef.current?.resetBall();
      scene3DRef.current?.resetPins([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    }, 100);

    syncState();
  }, [difficulty, syncState, syncStandingPinsRef]);

  // 드래그 입력을 Shot으로 변환
  const dragToShot = useCallback((dragX: number, _dragY: number, power: number): Shot => {
    return {
      lineOffset: Math.max(-1, Math.min(1, dragX * 2)),
      angleOffset: Math.max(-0.3, Math.min(0.3, dragX * 0.4)),
      power: Math.max(0.5, Math.min(1, power)),
      spin: dragX * 0.5,
    };
  }, []);

  // CPU 턴 자동 시작
  const checkCpuTurn = useCallback(() => {
    const state = gameManager.current.getState();
    if (
      state.phase === 'AIM' &&
      state.currentTurn === 'CPU' &&
      !isAnimating &&
      !overlay.visible
    ) {
      scheduleCpuShot(500);
    }
  }, [isAnimating, overlay.visible, scheduleCpuShot]);

  return {
    gameState,
    isAnimating,
    overlay,
    standingPinIds,
    playerShot,
    dragToShot,
    startNewGame,
    dismissOverlay,
    handleThrowComplete,
    setScene3DRef,
    checkCpuTurn,
    cpuHasShotThisTurn,
    lastShotAppliedAt,
  };
}

// CPU Shot 생성 함수
function generateCpuShot(difficulty: Difficulty, standingPinIds: number[]): Shot {
  const difficultyParams: Record<Difficulty, { accuracy: number; powerVar: number; mistakeChance: number }> = {
    EASY: { accuracy: 0.28, powerVar: 0.18, mistakeChance: 0.18 },
    NORMAL: { accuracy: 0.18, powerVar: 0.12, mistakeChance: 0.1 },
    HARD: { accuracy: 0.1, powerVar: 0.08, mistakeChance: 0.05 },
    PRO: { accuracy: 0.06, powerVar: 0.05, mistakeChance: 0.02 },
  };

  const params = difficultyParams[difficulty];

  const clamp = (value: number, min: number, max: number) =>
    Math.min(Math.max(value, min), max);

  // 남은 핀 중심 계산 (핀 실제 x 좌표 기준)
  let targetOffset = 0;
  if (standingPinIds.length > 0) {
    const xs = standingPinIds.map((id) => {
      const index = id - 1;
      const pos = PIN_POSITIONS[index];
      return pos ? pos[0] : 0;
    });
    const avgX = xs.reduce((sum, x) => sum + x, 0) / xs.length;
    const maxX = (LANE_WIDTH / 2) - BALL_RADIUS;
    targetOffset = clamp(avgX / maxX, -1, 1);
  }

  // 실수 체크
  const isMistake = Math.random() < params.mistakeChance;
  const mistakeMultiplier = isMistake ? 2 : 1;

  // 오차 적용
  const lineNoise = (Math.random() - 0.5) * params.accuracy * mistakeMultiplier;
  const angleNoise = (Math.random() - 0.5) * params.accuracy * 0.4 * mistakeMultiplier;
  const lineOffset = clamp((targetOffset + lineNoise) * 0.85, -1, 1);
  const angleOffset = clamp(targetOffset * 0.08 + angleNoise, -0.22, 0.22);
  const power = clamp(0.78 + (Math.random() - 0.5) * params.powerVar, 0.55, 0.95);
  const spin = clamp((Math.random() - 0.5) * 0.08, -0.12, 0.12);

  return {
    lineOffset,
    angleOffset,
    power,
    spin,
  };
}
