import { useCallback, useRef, useState } from 'react';
import type { Difficulty, Shot, ThrowResult, GameState } from '../core/types';
import { GameStateManager } from '../core/game/GameState';
import type { Scene3DRef } from '../3d/Scene3D';

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

  const pendingAction = useRef<'NEXT_THROW' | 'SWITCH_TURN' | 'GAME_OVER' | null>(null);
  const shouldResetPinsRef = useRef(false);

  const setScene3DRef = useCallback((ref: Scene3DRef | null) => {
    scene3DRef.current = ref;
  }, []);

  const syncState = useCallback(() => {
    setGameState(gameManager.current.getState());
  }, []);

  const handleThrowComplete = useCallback((result: ThrowResult) => {
    const info = gameManager.current.recordThrow(result);
    shouldResetPinsRef.current = info.shouldResetPins;

    // 남은 핀 업데이트
    const newStandingPins = standingPinIds.filter(
      (id) => !result.pinsKnocked.includes(id)
    );
    setStandingPinIds(newStandingPins);

    // 오버레이 표시
    if (result.isStrike) {
      setOverlay({ visible: true, text: 'STRIKE!' });
    } else if (result.isSpare) {
      setOverlay({ visible: true, text: 'SPARE!' });
    } else {
      const count = result.pinsKnocked.length;
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
    syncState();
  }, [standingPinIds, syncState]);

  const dismissOverlay = useCallback(() => {
    setOverlay({ visible: false, text: '' });

    const action = pendingAction.current;
    pendingAction.current = null;

    if (action === 'GAME_OVER') {
      onGameOver?.(gameManager.current.getState());
      return;
    }

    // 핀 리셋
    if (shouldResetPinsRef.current) {
      setStandingPinIds([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      scene3DRef.current?.resetPins([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      shouldResetPinsRef.current = false;
    }

    // 볼 리셋
    scene3DRef.current?.resetBall();

    if (action === 'SWITCH_TURN') {
      gameManager.current.switchTurn();
      syncState();

      // CPU 턴이면 자동 투구
      const state = gameManager.current.getState();
      if (state.currentTurn === 'CPU') {
        setTimeout(() => triggerCpuShot(), 1000);
      } else {
        gameManager.current.setPhase('AIM');
        syncState();
      }
    } else if (action === 'NEXT_THROW') {
      const state = gameManager.current.getState();
      if (state.currentTurn === 'CPU') {
        setTimeout(() => triggerCpuShot(), 1000);
      } else {
        gameManager.current.setPhase('AIM');
        syncState();
      }
    }
  }, [syncState, onGameOver]);

  const playerShot = useCallback((shot: Shot) => {
    if (!scene3DRef.current || isAnimating) return;
    if (gameManager.current.getState().currentTurn !== 'PLAYER') return;

    setIsAnimating(true);
    gameManager.current.setPhase('ROLLING');
    scene3DRef.current.applyShot(shot);
    syncState();
  }, [isAnimating, syncState]);

  const triggerCpuShot = useCallback(() => {
    if (!scene3DRef.current || isAnimating) return;

    // CPU Shot 생성 (난이도 기반)
    const state = gameManager.current.getState();
    const shot = generateCpuShot(state.difficulty, standingPinIds);

    setIsAnimating(true);
    gameManager.current.setPhase('ROLLING');
    scene3DRef.current.applyShot(shot);
    syncState();
  }, [isAnimating, standingPinIds, syncState]);

  const startNewGame = useCallback((newDifficulty?: Difficulty) => {
    const diff = newDifficulty ?? difficulty;
    gameManager.current.reset(diff);
    gameManager.current.setPhase('AIM');
    setOverlay({ visible: false, text: '' });
    setStandingPinIds([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    pendingAction.current = null;
    shouldResetPinsRef.current = false;

    // 씬 리셋
    setTimeout(() => {
      scene3DRef.current?.resetBall();
      scene3DRef.current?.resetPins([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    }, 100);

    syncState();
  }, [difficulty, syncState]);

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
      setTimeout(() => triggerCpuShot(), 1000);
    }
  }, [isAnimating, overlay.visible, triggerCpuShot]);

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
  };
}

// CPU Shot 생성 함수
function generateCpuShot(difficulty: Difficulty, standingPinIds: number[]): Shot {
  const difficultyParams: Record<Difficulty, { accuracy: number; powerVar: number; mistakeChance: number }> = {
    EASY: { accuracy: 0.4, powerVar: 0.3, mistakeChance: 0.3 },
    NORMAL: { accuracy: 0.25, powerVar: 0.2, mistakeChance: 0.15 },
    HARD: { accuracy: 0.12, powerVar: 0.1, mistakeChance: 0.05 },
    PRO: { accuracy: 0.05, powerVar: 0.05, mistakeChance: 0.02 },
  };

  const params = difficultyParams[difficulty];

  // 남은 핀 중심 계산 (간단히)
  let targetOffset = 0;
  if (standingPinIds.length < 10 && standingPinIds.length > 0) {
    // 스페어 시도: 남은 핀 방향으로
    const avgPinIndex = standingPinIds.reduce((sum, id) => sum + id, 0) / standingPinIds.length;
    targetOffset = (avgPinIndex - 5.5) * 0.1;
  }

  // 실수 체크
  const isMistake = Math.random() < params.mistakeChance;
  const mistakeMultiplier = isMistake ? 3 : 1;

  // 오차 적용
  const lineOffset = targetOffset + (Math.random() - 0.5) * params.accuracy * mistakeMultiplier;
  const angleOffset = (Math.random() - 0.5) * params.accuracy * 0.5 * mistakeMultiplier;
  const power = 0.7 + (Math.random() - 0.5) * params.powerVar;
  const spin = (Math.random() - 0.5) * 0.3;

  return {
    lineOffset: Math.max(-1, Math.min(1, lineOffset)),
    angleOffset: Math.max(-0.3, Math.min(0.3, angleOffset)),
    power: Math.max(0.5, Math.min(1, power)),
    spin: Math.max(-1, Math.min(1, spin)),
  };
}
