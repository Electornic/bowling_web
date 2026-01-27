import { createContext, useContext, useReducer, type ReactNode } from 'react';
import type { Difficulty, PlayerScore } from '../core/types';

// Actions
type GameAction =
  | { type: 'SET_DIFFICULTY'; payload: Difficulty }
  | { type: 'START_GAME' }
  | { type: 'SAVE_FINAL_SCORES'; payload: { playerScore: PlayerScore; cpuScore: PlayerScore } }
  | { type: 'RESET_GAME' };

// State
interface ContextState {
  difficulty: Difficulty;
  isGameStarted: boolean;
  finalPlayerScore: PlayerScore | null;
  finalCpuScore: PlayerScore | null;
}

const initialState: ContextState = {
  difficulty: 'NORMAL',
  isGameStarted: false,
  finalPlayerScore: null,
  finalCpuScore: null,
};

// Reducer
function gameReducer(state: ContextState, action: GameAction): ContextState {
  switch (action.type) {
    case 'SET_DIFFICULTY':
      return { ...state, difficulty: action.payload };

    case 'START_GAME':
      return {
        ...state,
        isGameStarted: true,
        finalPlayerScore: null,
        finalCpuScore: null,
      };

    case 'SAVE_FINAL_SCORES':
      return {
        ...state,
        isGameStarted: false,
        finalPlayerScore: action.payload.playerScore,
        finalCpuScore: action.payload.cpuScore,
      };

    case 'RESET_GAME':
      return {
        ...state,
        isGameStarted: false,
        finalPlayerScore: null,
        finalCpuScore: null,
      };

    default:
      return state;
  }
}

// Context
interface GameContextType {
  state: ContextState;
  setDifficulty: (difficulty: Difficulty) => void;
  startGame: () => void;
  saveFinalScores: (playerScore: PlayerScore, cpuScore: PlayerScore) => void;
  resetGame: () => void;
}

const GameContext = createContext<GameContextType | null>(null);

// Provider
export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  const setDifficulty = (difficulty: Difficulty) => {
    dispatch({ type: 'SET_DIFFICULTY', payload: difficulty });
  };

  const startGame = () => {
    dispatch({ type: 'START_GAME' });
  };

  const saveFinalScores = (playerScore: PlayerScore, cpuScore: PlayerScore) => {
    dispatch({ type: 'SAVE_FINAL_SCORES', payload: { playerScore, cpuScore } });
  };

  const resetGame = () => {
    dispatch({ type: 'RESET_GAME' });
  };

  return (
    <GameContext.Provider
      value={{ state, setDifficulty, startGame, saveFinalScores, resetGame }}
    >
      {children}
    </GameContext.Provider>
  );
}

// Hook
export function useGameContext() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGameContext must be used within a GameProvider');
  }
  return context;
}
