import { Hand, Loader2 } from "lucide-react";
import styles from "./GameUI.module.css";

interface BottomActionProps {
  isPlayerTurn: boolean;
  currentFrame?: number;
  ballNumber?: number;
  isAiming?: boolean;
}

export function BottomAction({
  isPlayerTurn,
  currentFrame = 1,
  ballNumber = 1,
  isAiming = false,
}: BottomActionProps) {
  const getFrameStatus = () => {
    if (currentFrame === 10) {
      if (ballNumber === 3) return "Bonus Ball";
      return `Frame 10 — Ball ${ballNumber}`;
    }
    return null;
  };

  const frameStatus = getFrameStatus();

  if (isPlayerTurn) {
    return (
      <div className={styles.bottomAction}>
        <div className={styles.bottomActionContent}>
          <div className={styles.bottomActionInner}>
            {/* Frame status for 10th frame */}
            {frameStatus && (
              <div className={styles.frameStatusBadge}>
                <span className={styles.frameStatusText}>{frameStatus}</span>
              </div>
            )}

            {/* Main instruction */}
            <div className={styles.mainInstruction}>
              <Hand
                className={`${styles.handIcon} ${isAiming ? styles.handIconAiming : ""}`}
              />
              <div className={styles.instructionText}>
                <div className={styles.mainText}>
                  {isAiming ? "Release to Bowl" : "Drag to Bowl"}
                </div>
                <div className={styles.subText}>
                  {isAiming
                    ? "Let go to throw the ball"
                    : "Drag up to aim and set power"}
                </div>
              </div>
            </div>

            {/* Touch area hint for mobile */}
            <div className={styles.touchHint}>
              <div className={styles.touchHintBar} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.bottomAction}>
      <div className={styles.bottomActionContent}>
        <div className={styles.cpuWaiting}>
          <Loader2 className={styles.spinnerIcon} strokeWidth={2.5} />
          <div>
            <span className={styles.cpuText}>CPU is Playing...</span>
            <div className={styles.cpuSubText}>Watch the shot</div>
          </div>
        </div>
      </div>
    </div>
  );
}
