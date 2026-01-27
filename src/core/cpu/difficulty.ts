import type { CpuParameters, Difficulty } from '../types';

export const CPU_PARAMETERS: Record<Difficulty, CpuParameters> = {
  EASY: {
    directionOffset: 0.4,
    angleOffset: 0.3,
    powerVariance: 0.3,
    spinChance: 0.1,
    mistakeChance: 0.3,
  },
  NORMAL: {
    directionOffset: 0.25,
    angleOffset: 0.2,
    powerVariance: 0.2,
    spinChance: 0.3,
    mistakeChance: 0.15,
  },
  HARD: {
    directionOffset: 0.12,
    angleOffset: 0.1,
    powerVariance: 0.1,
    spinChance: 0.5,
    mistakeChance: 0.05,
  },
  PRO: {
    directionOffset: 0.05,
    angleOffset: 0.05,
    powerVariance: 0.05,
    spinChance: 0.7,
    mistakeChance: 0.02,
  },
};
