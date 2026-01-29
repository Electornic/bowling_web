import { MoveUp } from "lucide-react";
import styles from "./GameUI.module.css";

interface AimingUIProps {
  direction: number; // -1 to 1 (left to right)
  power: number; // 0 to 1 (weak to strong)
  spin: number; // -1 to 1
  isAiming: boolean;
}

export function AimingUI({ direction, power, spin, isAiming }: AimingUIProps) {
  if (!isAiming) return null;
  const safeSpin = Number.isFinite(spin) ? spin : 0;

  // Power color and label based on strength
  const getPowerStyle = () => {
    if (power < 0.3) return { fill: styles.gaugeFillWeak, label: styles.powerLabelWeak, text: "약함" };
    if (power > 0.85) return { fill: styles.gaugeFillStrong, label: styles.powerLabelStrong, text: "너무 강함" };
    return { fill: styles.gaugeFillGood, label: styles.powerLabelGood, text: "좋음" };
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
            <div className={styles.gaugeLabel}>파워</div>

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

      {/* Spin indicator */}
      <div className={styles.spinIndicator}>
          <div className={styles.spinLabel}>스핀</div>
          <div className={styles.spinTrack}>
            <div className={styles.spinCenter} />
            <div
              className={styles.spinFill}
              style={{
              transform: `translateX(${safeSpin * 40}px)`,
              opacity: Math.min(1, Math.abs(safeSpin) + 0.2),
              }}
            />
          </div>
          <div className={styles.spinValue}>
          {safeSpin >= 0 ? '▶' : '◀'} {Math.round(Math.abs(safeSpin) * 100)}
          </div>
      </div>
    </>
  );
}
