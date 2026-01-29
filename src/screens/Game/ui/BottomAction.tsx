import { Hand, Loader2 } from "lucide-react";
import styles from "./GameUI.module.css";

interface BottomActionProps {
  isPlayerTurn: boolean;
  currentTurn?: 'PLAYER' | 'CPU';
  isAnimating?: boolean;
  currentFrame?: number;
  ballNumber?: number;
  isAiming?: boolean;
}

export function BottomAction({
  isPlayerTurn,
  currentTurn = 'PLAYER',
  isAnimating = false,
  currentFrame = 1,
  ballNumber = 1,
  isAiming = false,
}: BottomActionProps) {
  const getFrameStatus = () => {
    if (currentFrame === 10) {
      if (ballNumber === 3) return "보너스 볼";
      return `10프레임 — ${ballNumber}구`;
    }
    return null;
  };

  const frameStatus = getFrameStatus();

  if (isAnimating) {
    return (
      <div className={styles.bottomAction}>
        <div className={styles.bottomActionContent}>
          <div className={styles.cpuWaiting}>
            <Loader2 className={styles.spinnerIcon} strokeWidth={2.5} />
            <div>
              <span className={styles.cpuText}>공이 굴러가는 중...</span>
              <div className={styles.cpuSubText}>잠시만 기다려줘</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
                  {isAiming ? "손을 떼서 투구" : "드래그해서 투구"}
                </div>
                <div className={styles.subText}>
                  {isAiming
                    ? "손을 떼면 공이 굴러가요"
                    : "위로 드래그해 방향/파워 조절"}
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
            <span className={styles.cpuText}>
              {currentTurn === 'CPU' ? 'CPU 턴...' : '대기 중...'}
            </span>
            <div className={styles.cpuSubText}>곧 시작돼요</div>
          </div>
        </div>
      </div>
    </div>
  );
}
