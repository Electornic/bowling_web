import { MoveUp } from "lucide-react";
import styles from "./GameUI.module.css";

interface AimingUIProps {
  direction: number; // -1 to 1 (left to right)
  power: number; // 0 to 1 (weak to strong)
  isAiming: boolean;
}

export function AimingUI({ direction, power, isAiming }: AimingUIProps) {
  if (!isAiming) return null;

  // Power color and label based on strength
  const getPowerStyle = () => {
    if (power < 0.3) return { fill: styles.gaugeFillWeak, label: styles.powerLabelWeak, text: "WEAK" };
    if (power > 0.85) return { fill: styles.gaugeFillStrong, label: styles.powerLabelStrong, text: "TOO STRONG" };
    return { fill: styles.gaugeFillGood, label: styles.powerLabelGood, text: "GOOD" };
  };

  const powerStyle = getPowerStyle();

  return (
    <>
      {/* Direction Arrow - Bottom center, pointing forward */}
      <div className={styles.aimingContainer}>
        <div
          className={styles.directionArrow}
          style={{ transform: `translateX(${direction * 100}px)` }}
        >
          {/* Arrow */}
          <div className={styles.arrowContainer}>
            <MoveUp className={styles.arrowIcon} strokeWidth={3} />

            {/* Direction indicator line */}
            <div className={styles.directionLine}>
              <div className={styles.directionDot} />
            </div>
          </div>

          {/* Predicted path hint (slightly irregular) */}
          <div className={styles.predictedPath}>
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className={styles.pathDot}
                style={{ opacity: 0.3 + (i * 0.1) }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Power Gauge - Right side only (simplified) */}
      <div className={styles.powerGauge}>
        <div className={styles.gaugeContainer}>
          <div className={styles.gaugeInner}>
            {/* Label */}
            <div className={styles.gaugeLabel}>Power</div>

            {/* Vertical gauge */}
            <div className={styles.gaugeTrack}>
              {/* Fill */}
              <div
                className={`${styles.gaugeFill} ${powerStyle.fill}`}
                style={{ height: `${power * 100}%` }}
              />

              {/* Optimal zone indicator */}
              <div className={styles.optimalZone}>
                <div className={styles.optimalMark} />
              </div>
            </div>

            {/* Power label */}
            <div className={`${styles.powerLabel} ${powerStyle.label}`}>
              {powerStyle.text}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
