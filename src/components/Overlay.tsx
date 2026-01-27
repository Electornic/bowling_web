import styles from './Overlay.module.css';

interface OverlayProps {
  children: React.ReactNode;
  visible: boolean;
  onClick?: () => void;
}

export function Overlay({ children, visible, onClick }: OverlayProps) {
  if (!visible) return null;

  return (
    <div className={styles.overlay} onClick={onClick}>
      <div className={styles.content} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

interface ResultOverlayProps {
  text: string;
  subText?: string;
  visible: boolean;
  onClick?: () => void;
}

export function ResultOverlay({ text, subText, visible, onClick }: ResultOverlayProps) {
  if (!visible) return null;

  return (
    <div className={styles.resultOverlay} onClick={onClick}>
      <div className={styles.resultText}>{text}</div>
      {subText && <div className={styles.resultSubText}>{subText}</div>}
      <div className={styles.tapHint}>Tap to continue</div>
    </div>
  );
}
