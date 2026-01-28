import { User, Trophy } from "lucide-react";
import styles from "./GameUI.module.css";

interface TopHUDProps {
  playerName: string;
  playerScore: number;
  cpuScore: number;
  currentFrame: number;
  totalFrames: number;
  isPlayerTurn: boolean;
  difficulty: "Easy" | "Normal" | "Hard" | "Pro";
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
  const difficultyStyle = {
    Easy: styles.difficultyEasy,
    Normal: styles.difficultyNormal,
    Hard: styles.difficultyHard,
    Pro: styles.difficultyPro,
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
            Frame {currentFrame} / {totalFrames}
          </div>
          <div
            className={`${styles.turnBadge} ${
              isPlayerTurn ? styles.turnBadgePlayer : styles.turnBadgeCpu
            }`}
          >
            <span className={styles.turnText}>
              {isPlayerTurn ? "Your Turn" : "CPU Turn"}
            </span>
          </div>
        </div>

        {/* CPU Section */}
        <div className={styles.cpuSection}>
          <div className={styles.cpuInfo}>
            <div className={styles.cpuName}>
              <span className={styles.cpuLabel}>CPU</span>
              <span className={`${styles.difficultyBadge} ${difficultyStyle[difficulty]}`}>
                {difficulty}
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
