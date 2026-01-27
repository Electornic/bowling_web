import { useCallback, useEffect, useRef, useState } from 'react';
import type { Difficulty, DragInput, ThrowResult, Pin, GameState } from '../core/types';
import { GameStateManager } from '../core/game/GameState';
import { PhysicsEngine } from '../core/physics/PhysicsEngine';
import { CpuController } from '../core/cpu/CpuController';

export interface OverlayState {
  visible: boolean;
  text: string;
  subText?: string;
}

interface UseGameOptions {
  onGameOver?: (state: GameState) => void;
}

export function useGame(difficulty: Difficulty = 'NORMAL', options: UseGameOptions = {}) {
  const { onGameOver } = options;

  const gameManager = useRef(new GameStateManager(difficulty));
  const physicsEngine = useRef<PhysicsEngine | null>(null);
  const cpuController = useRef(new CpuController(difficulty));

  const [gameState, setGameState] = useState(() => gameManager.current.getState());
  const [isAnimating, setIsAnimating] = useState(false);
  const [overlay, setOverlay] = useState<OverlayState>({ visible: false, text: '' });
  const [renderTrigger, setRenderTrigger] = useState(0);

  const pendingAction = useRef<'NEXT_THROW' | 'SWITCH_TURN' | 'GAME_OVER' | null>(null);
  const shouldResetPinsRef = useRef(false);

  const initPhysics = useCallback(() => {
    const state = gameManager.current.getState();
    physicsEngine.current = new PhysicsEngine(state.pins);
  }, []);

  const syncState = useCallback(() => {
    setGameState(gameManager.current.getState());
  }, []);

  const handleThrowComplete = useCallback(() => {
    if (!physicsEngine.current) return;

    const result = physicsEngine.current.getResult();
    const info = gameManager.current.recordThrow(result);

    shouldResetPinsRef.current = info.shouldResetPins;

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

    syncState();
  }, [syncState]);

  // 애니메이션 루프
  useEffect(() => {
    if (!isAnimating || !physicsEngine.current) return;

    let animationId: number;
    let lastTime = performance.now();

    const loop = (time: number) => {
      const delta = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;

      const isRunning = physicsEngine.current!.update(delta);
      setRenderTrigger((n) => n + 1);

      if (!isRunning) {
        setIsAnimating(false);
        handleThrowComplete();
        return;
      }

      animationId = requestAnimationFrame(loop);
    };

    animationId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationId);
  }, [isAnimating, handleThrowComplete]);

  const dismissOverlay = useCallback(() => {
    setOverlay({ visible: false, text: '' });

    const action = pendingAction.current;
    pendingAction.current = null;

    if (action === 'GAME_OVER') {
      onGameOver?.(gameManager.current.getState());
      return;
    }

    if (shouldResetPinsRef.current) {
      physicsEngine.current?.resetPins();
      gameManager.current.resetPins();
      shouldResetPinsRef.current = false;
    }

    if (action === 'SWITCH_TURN') {
      gameManager.current.switchTurn();
      syncState();

      // CPU 턴이면 자동 투구
      const state = gameManager.current.getState();
      if (state.currentTurn === 'CPU') {
        setTimeout(() => triggerCpuThrow(), 800);
      } else {
        gameManager.current.setPhase('AIM');
        syncState();
      }
    } else if (action === 'NEXT_THROW') {
      // 같은 턴의 다음 투구
      const state = gameManager.current.getState();
      if (state.currentTurn === 'CPU') {
        setTimeout(() => triggerCpuThrow(), 800);
      } else {
        gameManager.current.setPhase('AIM');
        syncState();
      }
    }
  }, [syncState, onGameOver]);

  const playerThrow = useCallback((input: DragInput) => {
    if (!physicsEngine.current || isAnimating) return;
    if (gameManager.current.getState().currentTurn !== 'PLAYER') return;

    setIsAnimating(true);
    gameManager.current.setPhase('ROLLING');
    physicsEngine.current.startThrow(input);
    syncState();
  }, [isAnimating, syncState]);

  const triggerCpuThrow = useCallback(() => {
    if (!physicsEngine.current || isAnimating) return;

    const standingPins = gameManager.current.getStandingPins();
    const input = cpuController.current.generateThrow(standingPins);

    setIsAnimating(true);
    gameManager.current.setPhase('ROLLING');
    physicsEngine.current.startThrow(input);
    syncState();
  }, [isAnimating, syncState]);

  const cpuThrow = useCallback(() => {
    triggerCpuThrow();
  }, [triggerCpuThrow]);

  const getBallPosition = useCallback(() => {
    return physicsEngine.current?.getBallPosition() ?? null;
  }, []);

  const getPinStates = useCallback((): Pin[] => {
    return physicsEngine.current?.getPinStates() ?? [];
  }, []);

  const getThrowResult = useCallback((): ThrowResult | null => {
    if (!physicsEngine.current) return null;
    return physicsEngine.current.getResult();
  }, []);

  const startNewGame = useCallback((newDifficulty?: Difficulty) => {
    const diff = newDifficulty ?? difficulty;
    gameManager.current.reset(diff);
    cpuController.current.setDifficulty(diff);
    initPhysics();
    gameManager.current.setPhase('AIM');
    setOverlay({ visible: false, text: '' });
    pendingAction.current = null;
    shouldResetPinsRef.current = false;
    syncState();
  }, [difficulty, initPhysics, syncState]);

  // 첫 CPU 턴 자동 시작
  useEffect(() => {
    if (
      gameState.phase === 'AIM' &&
      gameState.currentTurn === 'CPU' &&
      !isAnimating &&
      !overlay.visible
    ) {
      setTimeout(() => triggerCpuThrow(), 800);
    }
  }, [gameState.phase, gameState.currentTurn, isAnimating, overlay.visible, triggerCpuThrow]);

  return {
    gameState,
    isAnimating,
    overlay,
    playerThrow,
    cpuThrow,
    getBallPosition,
    getPinStates,
    getThrowResult,
    startNewGame,
    initPhysics,
    dismissOverlay,
    renderTrigger,
  };
}
