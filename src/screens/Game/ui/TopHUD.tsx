import { User, Trophy } from "lucide-react";
import type { Difficulty } from "../../../core/types";
import styles from "./GameUI.module.css";

interface TopHUDProps {
  playerName: string;
  playerScore: number;
  cpuScore: number;
  currentFrame: number;
  totalFrames: number;
  isPlayerTurn: boolean;
  difficulty: Difficulty;
}

export function TopHUD({
  playerName,
  playerScore,
  cpuScore,
  currentFrame,
  totalFrames,
  isPlayerTurn,
  difficulty,
}: TopHUDProps) {
  const difficultyStyle: Record<Difficulty, string> = {
    EASY: styles.difficultyEasy,
    NORMAL: styles.difficultyNormal,
    HARD: styles.difficultyHard,
    PRO: styles.difficultyPro,
  };

  const difficultyLabel: Record<Difficulty, string> = {
    EASY: "쉬움",
    NORMAL: "보통",
    HARD: "어려움",
    PRO: "프로",
  };

  return (
    <div className={styles.topHud}>
      <div className={styles.topHudContent}>
        {/* Player Section */}
        <div className={styles.playerSection}>
          <div className={styles.playerAvatar}>
            <User className={styles.avatarIcon} />
          </div>
          <div className={styles.playerInfo}>
            <div className={styles.playerName}>{playerName}</div>
            <div className={styles.score}>{playerScore}</div>
          </div>
        </div>

        {/* Center Frame & Turn Status */}
        <div className={styles.centerStatus}>
          <div className={styles.frameText}>
            프레임 {currentFrame} / {totalFrames}
          </div>
          <div
            className={`${styles.turnBadge} ${
              isPlayerTurn ? styles.turnBadgePlayer : styles.turnBadgeCpu
            }`}
          >
            <span className={styles.turnText}>
              {isPlayerTurn ? "내 턴" : "CPU 턴"}
            </span>
          </div>
        </div>

        {/* CPU Section */}
        <div className={styles.cpuSection}>
          <div className={styles.cpuInfo}>
            <div className={styles.cpuName}>
              <span className={styles.cpuLabel}>CPU</span>
              <span className={`${styles.difficultyBadge} ${difficultyStyle[difficulty]}`}>
                {difficultyLabel[difficulty]}
              </span>
            </div>
            <div className={styles.score}>{cpuScore}</div>
          </div>
          <div className={styles.cpuAvatar}>
            <Trophy className={styles.avatarIcon} />
          </div>
        </div>
      </div>
    </div>
  );
}
