import { useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameContext } from '../../contexts/GameContext';
import { useGame3D } from '../../hooks/useGame3D';
import { Scene3D, type Scene3DRef } from '../../3d/Scene3D';
import { ScoreBoard } from './ScoreBoard';
import { ControlArea3D } from './ControlArea3D';
import { ResultOverlay } from '../../components/Overlay';
import type { GameState } from '../../core/types';
import styles from './GameScreen.module.css';

export function GameScreen() {
  const navigate = useNavigate();
  const { state: contextState, saveFinalScores } = useGameContext();
  const scene3DRef = useRef<Scene3DRef>(null);

  const handleGameOver = useCallback((finalState: GameState) => {
    saveFinalScores(finalState.playerScore, finalState.cpuScore);
    setTimeout(() => navigate('/result'), 500);
  }, [saveFinalScores, navigate]);

  const {
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
  } = useGame3D(contextState.difficulty, { onGameOver: handleGameOver });

  // Scene3D ref 연결
  useEffect(() => {
    setScene3DRef(scene3DRef.current);
  }, [setScene3DRef]);

  // 게임 시작 시 초기화
  useEffect(() => {
    startNewGame(contextState.difficulty);
  }, []);

  // 게임이 시작되지 않았으면 홈으로
  useEffect(() => {
    if (!contextState.isGameStarted && gameState.phase === 'READY') {
      navigate('/');
    }
  }, [contextState.isGameStarted, gameState.phase, navigate]);

  // CPU 턴 체크
  useEffect(() => {
    checkCpuTurn();
  }, [gameState.phase, gameState.currentTurn, isAnimating, overlay.visible, checkCpuTurn]);

  const isPlayerTurn = gameState.currentTurn === 'PLAYER' && !isAnimating && !overlay.visible;

  const handleDragEnd = useCallback((dragX: number, dragY: number, power: number) => {
    if (!isPlayerTurn) return;
    const shot = dragToShot(dragX, dragY, power);
    playerShot(shot);
  }, [isPlayerTurn, dragToShot, playerShot]);

  return (
    <div className={styles.container}>
      <ScoreBoard
        playerScore={gameState.playerScore}
        cpuScore={gameState.cpuScore}
        currentFrame={gameState.currentFrame}
        currentTurn={gameState.currentTurn}
      />

      <div className={styles.laneContainer}>
        <Scene3D
          ref={scene3DRef}
          standingPinIds={standingPinIds}
          onThrowComplete={handleThrowComplete}
          debug={false}
        />

        <ResultOverlay
          visible={overlay.visible}
          text={overlay.text}
          subText={overlay.subText}
          onClick={dismissOverlay}
        />
      </div>

      <ControlArea3D
        onDragEnd={handleDragEnd}
        enabled={isPlayerTurn}
        currentTurn={gameState.currentTurn}
      />
    </div>
  );
}
