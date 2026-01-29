import { Zap, Flame, Award, AlertCircle, TrendingUp } from "lucide-react";
import styles from "./GameUI.module.css";

export type OverlayType =
  | "strike"
  | "spare"
  | "bonus"
  | "too-strong"
  | "too-far-left"
  | "too-far-right"
  | "gutter"
  | null;

interface GameOverlayProps {
  type: OverlayType;
  show: boolean;
  onDismiss?: () => void;
}

export function GameOverlay({ type, show, onDismiss }: GameOverlayProps) {
  if (!show || !type) return null;

  const getOverlayContent = () => {
    switch (type) {
      case "strike":
        return {
          icon: <Flame className={`${styles.overlayIcon} ${styles.iconStrike}`} strokeWidth={2.5} />,
          title: "스트라이크",
          subtitle: "완벽해!",
          gradient: styles.gradientStrike,
          glow: "rgba(251, 191, 36, 0.5)",
          small: false,
        };
      case "spare":
        return {
          icon: <Zap className={`${styles.overlayIcon} ${styles.iconSpare}`} strokeWidth={2.5} />,
          title: "스페어",
          subtitle: "좋은 커버!",
          gradient: styles.gradientSpare,
          glow: "rgba(34, 211, 238, 0.5)",
          small: false,
        };
      case "bonus":
        return {
          icon: <Award className={`${styles.overlayIcon} ${styles.iconBonus}`} strokeWidth={2.5} />,
          title: "보너스 볼",
          subtitle: "계속 가자!",
          gradient: styles.gradientBonus,
          glow: "rgba(168, 85, 247, 0.5)",
          small: false,
        };
      case "too-strong":
        return {
          icon: <TrendingUp className={`${styles.overlayIconSmall} ${styles.iconError}`} strokeWidth={2.5} />,
          title: "너무 강함",
          subtitle: "",
          gradient: styles.gradientError,
          glow: "rgba(239, 68, 68, 0.5)",
          small: true,
        };
      case "too-far-left":
        return {
          icon: <AlertCircle className={`${styles.overlayIconSmall} ${styles.iconWarning}`} strokeWidth={2.5} />,
          title: "너무 왼쪽",
          subtitle: "",
          gradient: styles.gradientWarning,
          glow: "rgba(249, 115, 22, 0.5)",
          small: true,
        };
      case "too-far-right":
        return {
          icon: <AlertCircle className={`${styles.overlayIconSmall} ${styles.iconWarning}`} strokeWidth={2.5} />,
          title: "너무 오른쪽",
          subtitle: "",
          gradient: styles.gradientWarning,
          glow: "rgba(249, 115, 22, 0.5)",
          small: true,
        };
      case "gutter":
        return {
          icon: <AlertCircle className={`${styles.overlayIconSmall} ${styles.iconGutter}`} strokeWidth={2.5} />,
          title: "거터",
          subtitle: "",
          gradient: styles.gradientGutter,
          glow: "rgba(156, 163, 175, 0.5)",
          small: true,
        };
      default:
        return null;
    }
  };

  const content = getOverlayContent();
  if (!content) return null;

  return (
    <div className={styles.overlayContainer} onClick={onDismiss}>
      <div className={styles.overlayInner}>
        {/* Glow effect */}
        {!content.small && (
          <div
            className={styles.overlayGlow}
            style={{ backgroundColor: content.glow }}
          />
        )}

        {/* Main content */}
        <div
          className={`${styles.overlayCard} ${
            content.small ? styles.overlayCardSmall : styles.overlayCardLarge
          }`}
        >
          <div className={styles.overlayContent}>
            {content.icon}

            <div
              className={`${styles.overlayTitle} ${content.gradient} ${
                content.small ? styles.overlayTitleSmall : styles.overlayTitleLarge
              }`}
            >
              {content.title}
            </div>

            {content.subtitle && (
              <div className={styles.overlaySubtitle}>{content.subtitle}</div>
            )}

            {/* Tap to dismiss hint */}
            <div className={styles.dismissHint}>탭해서 계속</div>
          </div>
        </div>
      </div>
    </div>
  );
}
