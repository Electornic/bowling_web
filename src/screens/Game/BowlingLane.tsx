import { useEffect, useRef } from 'react';
import type { Pin, Ball } from '../../core/types';
import styles from './GameScreen.module.css';

interface BowlingLaneProps {
  pins: Pin[];
  ball: Ball | null;
  width?: number;
  height?: number;
}

export function BowlingLane({
  pins,
  ball,
  width = 300,
  height = 500,
}: BowlingLaneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Draw lane
    drawLane(ctx, width, height);

    // Draw pins
    drawPins(ctx, pins, width, height);

    // Draw ball
    if (ball) {
      drawBall(ctx, ball, width, height);
    }
  }, [pins, ball, width, height]);

  return (
    <canvas
      ref={canvasRef}
      className={styles.canvas}
      width={width}
      height={height}
    />
  );
}

function drawLane(ctx: CanvasRenderingContext2D, width: number, height: number) {
  // Lane background
  ctx.fillStyle = '#d4a574';
  ctx.fillRect(0, 0, width, height);

  // Lane lines
  ctx.strokeStyle = '#8b6f47';
  ctx.lineWidth = 1;

  // Vertical guides
  const guides = [0.25, 0.5, 0.75];
  for (const g of guides) {
    ctx.beginPath();
    ctx.moveTo(width * g, 0);
    ctx.lineTo(width * g, height);
    ctx.stroke();
  }

  // Foul line
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, height * 0.85);
  ctx.lineTo(width, height * 0.85);
  ctx.stroke();

  // Gutters
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(0, 0, 10, height);
  ctx.fillRect(width - 10, 0, 10, height);
}

function drawPins(
  ctx: CanvasRenderingContext2D,
  pins: Pin[],
  width: number,
  height: number
) {
  const pinRadius = 12;

  for (const pin of pins) {
    const x = pin.x * width;
    const y = pin.y * height;

    if (pin.isStanding) {
      // Standing pin
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#cc0000';
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.arc(x, y, pinRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Pin number
      ctx.fillStyle = '#333';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(pin.id.toString(), x, y);
    } else {
      // Knocked down pin (faded)
      ctx.fillStyle = 'rgba(150, 150, 150, 0.3)';
      ctx.beginPath();
      ctx.arc(x, y, pinRadius * 0.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawBall(
  ctx: CanvasRenderingContext2D,
  ball: Ball,
  width: number,
  height: number
) {
  const x = ball.x * width;
  const y = ball.y * height;
  const radius = 18;

  // Ball shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.beginPath();
  ctx.ellipse(x + 3, y + 3, radius, radius * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Ball
  const gradient = ctx.createRadialGradient(
    x - radius * 0.3,
    y - radius * 0.3,
    0,
    x,
    y,
    radius
  );
  gradient.addColorStop(0, '#4a5568');
  gradient.addColorStop(1, '#1a202c');

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  // Finger holes
  ctx.fillStyle = '#0f0f0f';
  ctx.beginPath();
  ctx.arc(x - 5, y - 5, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + 5, y - 5, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x, y + 3, 4, 0, Math.PI * 2);
  ctx.fill();
}
