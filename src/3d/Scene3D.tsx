import { useRef, useImperativeHandle, forwardRef, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { OrbitControls } from '@react-three/drei';
import { BowlingLane3D } from './BowlingLane3D';
import { Pin3D, type Pin3DRef } from './Pin3D';
import { Ball3D, type Ball3DRef } from './Ball3D';
import type { Shot, ThrowResult } from '../core/types';
import {
  PIN_POSITIONS,
  PIN_HEIGHT,
  CAMERA_POSITION,
  CAMERA_LOOK_AT,
  BALL_RADIUS,
  PIN_RADIUS_BOTTOM,
} from './constants';

interface Scene3DProps {
  standingPinIds: number[];
  onThrowComplete: (result: ThrowResult) => void;
  debug?: boolean;
}

export interface Scene3DRef {
  applyShot: (shot: Shot) => void;
  resetBall: () => void;
  resetPins: (standingIds: number[]) => void;
  isSimulating: () => boolean;
}

export const Scene3D = forwardRef<Scene3DRef, Scene3DProps>(function Scene3D(
  { standingPinIds, onThrowComplete, debug = false },
  ref
) {
  const ballRef = useRef<Ball3DRef>(null);
  const pinRefs = useRef<(Pin3DRef | null)[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const isSimulatingRef = useRef(false);
  const knockedPinIds = useRef<Set<number>>(new Set());
  const initialStandingPins = useRef<number[]>(standingPinIds);
  const simulationFrameCount = useRef(0);
  const stoppedFrames = useRef(0);
  const impactAppliedRef = useRef(false);
  const pendingShotRef = useRef<Shot | null>(null);
  const pendingResetBallRef = useRef(false);
  const pendingResetPinsRef = useRef<number[] | null>(null);

  useEffect(() => {
    if (!isSimulating) return;

    let frameId: number;
    const standingSet = new Set(initialStandingPins.current);

    const checkSimulation = () => {
      if (!ballRef.current) {
        frameId = requestAnimationFrame(checkSimulation);
        return;
      }

      if (pendingResetPinsRef.current) {
        const standingIds = pendingResetPinsRef.current;
        pendingResetPinsRef.current = null;
        pinRefs.current.forEach((pinRef, index) => {
          if (pinRef && standingIds.includes(index + 1)) {
            const [x, z] = PIN_POSITIONS[index];
            pinRef.reset([x, PIN_HEIGHT / 2, z]);
          }
        });
        knockedPinIds.current.clear();
      }

      if (pendingResetBallRef.current) {
        pendingResetBallRef.current = false;
        ballRef.current.reset();
      }

      if (pendingShotRef.current && !isSimulatingRef.current) {
        const shot = pendingShotRef.current;
        pendingShotRef.current = null;
        knockedPinIds.current.clear();
        initialStandingPins.current = [...standingPinIds];
        simulationFrameCount.current = 0;
        stoppedFrames.current = 0;
        impactAppliedRef.current = false;
        isSimulatingRef.current = true;
        setIsSimulating(true);
        ballRef.current.applyShot(shot);
      }

      const ballPos = ballRef.current.getPosition();
      const hitRadius = BALL_RADIUS + PIN_RADIUS_BOTTOM + 0.05;
      const hitRadiusSq = hitRadius * hitRadius;

      pinRefs.current.forEach((pinRef, index) => {
        const pinId = index + 1;
        if (!pinRef || !standingSet.has(pinId) || knockedPinIds.current.has(pinId)) return;
        const [pinX, pinZ] = PIN_POSITIONS[index];
        const dx = ballPos.x - pinX;
        const dz = ballPos.z - pinZ;
        if (dx * dx + dz * dz <= hitRadiusSq) {
          pinRef.markHit();
          knockedPinIds.current.add(pinId);
          if (!impactAppliedRef.current) {
            impactAppliedRef.current = true;
            ballRef.current?.applyImpact(0.25);
          }
        }
      });

      const ballStopped = ballRef.current.isStopped();
      const ballOutOfBounds = ballRef.current.isOutOfBounds();

      if (ballStopped || ballOutOfBounds) {
        stoppedFrames.current += 1;
      } else {
        stoppedFrames.current = 0;
      }

      simulationFrameCount.current += 1;

      if (stoppedFrames.current > 30 || simulationFrameCount.current > 600) {
        isSimulatingRef.current = false;
        setIsSimulating(false);

        const knockedArray = Array.from(knockedPinIds.current);
        const allPinsKnocked = knockedArray.length === initialStandingPins.current.length;
        const isStrike = initialStandingPins.current.length === 10 && allPinsKnocked;
        const isSpare = !isStrike && allPinsKnocked;

        onThrowComplete({
          pinsKnocked: knockedArray,
          isStrike,
          isSpare,
        });
        return;
      }

      frameId = requestAnimationFrame(checkSimulation);
    };

    frameId = requestAnimationFrame(checkSimulation);
    return () => cancelAnimationFrame(frameId);
  }, [isSimulating, onThrowComplete, standingPinIds]);

  useImperativeHandle(ref, () => ({
    applyShot: (shot: Shot) => {
      if (isSimulatingRef.current) return;
      pendingShotRef.current = shot;
      setIsSimulating(true);
    },

    resetBall: () => {
      if (!isSimulatingRef.current && ballRef.current) {
        ballRef.current.reset();
        pendingResetBallRef.current = false;
        return;
      }
      pendingResetBallRef.current = true;
    },

    resetPins: (standingIds: number[]) => {
      if (!isSimulatingRef.current) {
        pinRefs.current.forEach((pinRef, index) => {
          if (pinRef && standingIds.includes(index + 1)) {
            const [x, z] = PIN_POSITIONS[index];
            pinRef.reset([x, PIN_HEIGHT / 2, z]);
          }
        });
        knockedPinIds.current.clear();
        pendingResetPinsRef.current = null;
        return;
      }
      pendingResetPinsRef.current = standingIds;
    },

    isSimulating: () => isSimulating,
  }));

  return (
    <Canvas
      shadows
      camera={{
        position: [CAMERA_POSITION.x, CAMERA_POSITION.y, CAMERA_POSITION.z],
        fov: 50,
        near: 0.1,
        far: 200,
      }}
      onCreated={({ camera }) => {
        camera.lookAt(CAMERA_LOOK_AT.x, CAMERA_LOOK_AT.y, CAMERA_LOOK_AT.z);
      }}
      style={{ background: '#1b140f' }}
    >
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[10, 20, 10]}
        intensity={1}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <directionalLight position={[-10, 15, -10]} intensity={0.5} />

      <Physics gravity={[0, -9.81, 0]} debug={debug} timeStep={1 / 60}>
        <BowlingLane3D />

        {PIN_POSITIONS.map(([x, z], index) => {
          const pinId = index + 1;
          const isStanding = standingPinIds.includes(pinId);

          return (
            <Pin3D
              key={pinId}
              ref={(el) => {
                pinRefs.current[index] = el;
              }}
              id={pinId}
              position={[x, PIN_HEIGHT / 2, z]}
              isStanding={isStanding}
              isActive={isSimulating}
            />
          );
        })}

        <Ball3D ref={ballRef} visible />
      </Physics>

      {debug && <OrbitControls />}
    </Canvas>
  );
});
