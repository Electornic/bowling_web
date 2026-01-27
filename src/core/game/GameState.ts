import type { GameState, GamePhase, Difficulty, Pin, Ball, ThrowResult } from '../types';
import { FrameManager } from './FrameManager';
import { TurnManager } from './TurnManager';
import { ScoreCalculator } from './ScoreCalculator';

export interface ThrowResultInfo {
  shouldResetPins: boolean;
  isFrameComplete: boolean;
  isTurnComplete: boolean;
}

export class GameStateManager {
  private state: GameState;
  private frameManagerPlayer: FrameManager;
  private frameManagerCpu: FrameManager;
  private turnManager: TurnManager;

  constructor(difficulty: Difficulty = 'NORMAL') {
    this.frameManagerPlayer = new FrameManager();
    this.frameManagerCpu = new FrameManager();
    this.turnManager = new TurnManager();
    this.state = this.createInitialState(difficulty);
  }

  private createInitialState(difficulty: Difficulty): GameState {
    return {
      phase: 'READY',
      currentTurn: 'PLAYER',
      currentFrame: 1,
      currentThrow: 1,
      playerScore: ScoreCalculator.createEmptyPlayerScore(),
      cpuScore: ScoreCalculator.createEmptyPlayerScore(),
      pins: this.createPins(),
      ball: null,
      difficulty,
    };
  }

  private createPins(): Pin[] {
    const pins: Pin[] = [];
    const positions = [
      [0.5, 0.1],
      [0.4, 0.2], [0.6, 0.2],
      [0.3, 0.3], [0.5, 0.3], [0.7, 0.3],
      [0.2, 0.4], [0.4, 0.4], [0.6, 0.4], [0.8, 0.4],
    ];

    positions.forEach((pos, index) => {
      pins.push({
        id: index + 1,
        x: pos[0],
        y: pos[1],
        isStanding: true,
      });
    });

    return pins;
  }

  getState(): GameState {
    return { ...this.state };
  }

  setPhase(phase: GamePhase): void {
    this.state.phase = phase;
  }

  setDifficulty(difficulty: Difficulty): void {
    this.state.difficulty = difficulty;
  }

  setBall(ball: Ball | null): void {
    this.state.ball = ball;
  }

  knockDownPins(pinIds: number[]): void {
    this.state.pins = this.state.pins.map((pin) => ({
      ...pin,
      isStanding: pinIds.includes(pin.id) ? false : pin.isStanding,
    }));
  }

  resetPins(): void {
    this.state.pins = this.createPins();
  }

  getStandingPins(): Pin[] {
    return this.state.pins.filter((pin) => pin.isStanding);
  }

  private getCurrentFrameManager(): FrameManager {
    return this.state.currentTurn === 'PLAYER'
      ? this.frameManagerPlayer
      : this.frameManagerCpu;
  }

  recordThrow(result: ThrowResult): ThrowResultInfo {
    const fm = this.getCurrentFrameManager();
    const wasFrameComplete = fm.isGameComplete();

    fm.recordThrow(result);

    this.updateScores();
    this.syncState();

    const isFrameComplete = fm.getCurrentFrame() > this.state.currentFrame ||
      (fm.isGameComplete() && !wasFrameComplete);

    return {
      shouldResetPins: result.isStrike || isFrameComplete,
      isFrameComplete,
      isTurnComplete: isFrameComplete,
    };
  }

  private updateScores(): void {
    const playerFrames = this.frameManagerPlayer.getFrames();
    const cpuFrames = this.frameManagerCpu.getFrames();

    this.state.playerScore = {
      frames: playerFrames,
      totalScore: ScoreCalculator.calculateScore(playerFrames),
    };

    this.state.cpuScore = {
      frames: cpuFrames,
      totalScore: ScoreCalculator.calculateScore(cpuFrames),
    };
  }

  private syncState(): void {
    const fm = this.getCurrentFrameManager();
    this.state.currentFrame = fm.getCurrentFrame();
    this.state.currentThrow = fm.getCurrentThrow();
    this.state.currentTurn = this.turnManager.getCurrentTurn();
  }

  switchTurn(): void {
    this.turnManager.switchTurn();
    this.state.currentTurn = this.turnManager.getCurrentTurn();

    const fm = this.getCurrentFrameManager();
    this.state.currentFrame = fm.getCurrentFrame();
    this.state.currentThrow = fm.getCurrentThrow();
  }

  isGameOver(): boolean {
    return (
      this.frameManagerPlayer.isGameComplete() &&
      this.frameManagerCpu.isGameComplete()
    );
  }

  isCurrentPlayerDone(): boolean {
    return this.getCurrentFrameManager().isGameComplete();
  }

  reset(difficulty?: Difficulty): void {
    this.frameManagerPlayer.reset();
    this.frameManagerCpu.reset();
    this.turnManager.reset();
    this.state = this.createInitialState(difficulty ?? this.state.difficulty);
  }
}
