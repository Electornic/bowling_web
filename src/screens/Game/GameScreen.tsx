import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameContext } from '../../contexts/GameContext';
import { useGame } from '../../hooks/useGame';
import { ScoreBoard } from './ScoreBoard';
import { BowlingLane } from './BowlingLane';
import { ControlArea } from './ControlArea';
import { ResultOverlay } from '../../components/Overlay';
import type { GameState } from '../../core/types';
import styles from './GameScreen.module.css';

export function GameScreen() {
  const navigate = useNavigate();
  const { state: contextState, saveFinalScores } = useGameContext();

  const handleGameOver = useCallback((finalState: GameState) => {
    saveFinalScores(finalState.playerScore, finalState.cpuScore);
    setTimeout(() => navigate('/result'), 500);
  }, [saveFinalScores, navigate]);

  const {
    gameState,
    isAnimating,
    overlay,
    playerThrow,
    startNewGame,
    getBallPosition,
    getPinStates,
    dismissOverlay,
  } = useGame(contextState.difficulty, { onGameOver: handleGameOver });

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

  const isPlayerTurn = gameState.currentTurn === 'PLAYER' && !isAnimating && !overlay.visible;
  const ball = getBallPosition();
  const pins = getPinStates();

  return (
    <div className={styles.container}>
      <ScoreBoard
        playerScore={gameState.playerScore}
        cpuScore={gameState.cpuScore}
        currentFrame={gameState.currentFrame}
        currentTurn={gameState.currentTurn}
      />

      <div className={styles.laneContainer}>
        <BowlingLane
          pins={pins.length > 0 ? pins : gameState.pins}
          ball={ball}
        />

        <ResultOverlay
          visible={overlay.visible}
          text={overlay.text}
          subText={overlay.subText}
          onClick={dismissOverlay}
        />
      </div>

      <ControlArea
        onThrow={playerThrow}
        enabled={isPlayerTurn}
        currentTurn={gameState.currentTurn}
      />
    </div>
  );
}
