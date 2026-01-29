import { useEffect, useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameContext } from '../../contexts/GameContext';
import { useGame3D } from '../../hooks/useGame3D';
import { useAimInput } from '../../hooks/useAimInput';
import { Scene3D, type Scene3DRef } from '../../3d/Scene3D';
import { TopHUD, BottomAction, AimingUI, GameOverlay, type OverlayType } from './ui';
import type { GameState, Shot } from '../../core/types';
import { CenterFrames } from './CenterFrames';
import styles from './GameScreen.module.css';

export function GameScreen() {
  const navigate = useNavigate();
  const { state: contextState, saveFinalScores } = useGameContext();
  const scene3DRef = useRef<Scene3DRef>(null);
  const [gameOverlay, setGameOverlay] = useState<{ type: OverlayType; show: boolean }>({
    type: null,
    show: false,
  });

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
    startNewGame,
    dismissOverlay,
    handleThrowComplete,
    setScene3DRef,
    checkCpuTurn,
  } = useGame3D(contextState.difficulty, { onGameOver: handleGameOver });

  // 오버레이 동기화 (useGame3D의 overlay를 GameOverlay 형식으로 변환)
  useEffect(() => {
    if (overlay.visible && overlay.text) {
      const typeMap: Record<string, OverlayType> = {
        'STRIKE!': 'strike',
        'SPARE!': 'spare',
        'BONUS BALL': 'bonus',
        'GUTTER': 'gutter',
      };
      const type = typeMap[overlay.text] || null;
      setGameOverlay({ type, show: true });
    }
  }, [overlay.visible, overlay.text]);

  const handleOverlayDismiss = useCallback(() => {
    setGameOverlay({ type: null, show: false });
    dismissOverlay();
  }, [dismissOverlay]);

  // 오버레이 자동 dismiss (1.5초 후)
  useEffect(() => {
    if (gameOverlay.show) {
      const timer = setTimeout(() => {
        handleOverlayDismiss();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [gameOverlay.show, handleOverlayDismiss]);

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

  const isPlayerTurn = gameState.currentTurn === 'PLAYER' && !isAnimating && !overlay.visible && !gameOverlay.show;

  const handleShot = useCallback((shot: Shot) => {
    if (!isPlayerTurn) return;
    playerShot(shot);
  }, [isPlayerTurn, playerShot]);

  // 새로운 Pointer 기반 입력 훅 사용
  const { containerRef, aimState, pointerHandlers } = useAimInput({
    enabled: isPlayerTurn,
    onShot: handleShot,
  });

  // 10프레임 볼 번호 계산
  const getBallNumber = () => {
    if (gameState.currentFrame !== 10) return 1;
    const frames = gameState.currentTurn === 'PLAYER'
      ? gameState.playerScore.frames
      : gameState.cpuScore.frames;
    const frame = frames[9];
    if (!frame) return 1;
    return frame.throws.length + 1;
  };

  // 난이도 타입 변환
  const difficultyMap: Record<string, 'Easy' | 'Normal' | 'Hard' | 'Pro'> = {
    EASY: 'Easy',
    NORMAL: 'Normal',
    HARD: 'Hard',
    PRO: 'Pro',
  };

  return (
    <div
      ref={containerRef}
      className={styles.container}
      {...pointerHandlers}
    >
      {/* 3D Game World - Full Bleed */}
      <div className={styles.gameWorld}>
        <Scene3D
          ref={scene3DRef}
          standingPinIds={standingPinIds}
          onThrowComplete={handleThrowComplete}
          debug={false}
        />

        {/* Bowling lane background gradient (visual enhancement) */}
        <div className={styles.laneBackground} />
      </div>

      {/* UI Overlays */}
      <TopHUD
        playerName="PLAYER 1"
        playerScore={gameState.playerScore.totalScore}
        cpuScore={gameState.cpuScore.totalScore}
        currentFrame={gameState.currentFrame}
        totalFrames={10}
        isPlayerTurn={gameState.currentTurn === 'PLAYER'}
        difficulty={difficultyMap[contextState.difficulty] || 'Normal'}
      />

      <CenterFrames
        playerScore={gameState.playerScore}
        cpuScore={gameState.cpuScore}
        currentFrame={gameState.currentFrame}
        currentTurn={gameState.currentTurn}
      />

      <AimingUI
        direction={aimState.direction}
        power={aimState.power}
        isAiming={aimState.isAiming}
      />

      <GameOverlay
        type={gameOverlay.type}
        show={gameOverlay.show}
        onDismiss={handleOverlayDismiss}
      />

      <BottomAction
        isPlayerTurn={gameState.currentTurn === 'PLAYER' && !isAnimating}
        currentFrame={gameState.currentFrame}
        ballNumber={getBallNumber()}
        isAiming={aimState.isAiming}
      />
    </div>
  );
}
