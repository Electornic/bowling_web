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
  const [ballVisible, setBallVisible] = useState(true);
  const knockedPinIds = useRef<Set<number>>(new Set());
  const initialStandingPins = useRef<number[]>(standingPinIds);
  const simulationFrameCount = useRef(0);

  // 시뮬레이션 체크
  useEffect(() => {
    if (!isSimulating) return;

    let frameId: number;
    let stoppedFrames = 0;

    const checkSimulation = () => {
      if (!ballRef.current) {
        frameId = requestAnimationFrame(checkSimulation);
        return;
      }

      // 핀 쓰러짐 체크
      pinRefs.current.forEach((pinRef, index) => {
        if (pinRef && pinRef.isDown() && !knockedPinIds.current.has(index + 1)) {
          knockedPinIds.current.add(index + 1);
        }
      });

      // 볼 멈춤 체크
      const ballStopped = ballRef.current.isStopped();
      const ballOutOfBounds = ballRef.current.isOutOfBounds();

      if (ballStopped || ballOutOfBounds) {
        stoppedFrames++;
      } else {
        stoppedFrames = 0;
      }

      simulationFrameCount.current++;

      // 시뮬레이션 종료 조건
      if (stoppedFrames > 30 || simulationFrameCount.current > 600) {
        setIsSimulating(false);

        // 결과 생성
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
  }, [isSimulating, onThrowComplete]);

  useImperativeHandle(ref, () => ({
    applyShot: (shot: Shot) => {
      if (!ballRef.current || isSimulating) return;

      knockedPinIds.current.clear();
      initialStandingPins.current = [...standingPinIds];
      simulationFrameCount.current = 0;
      setBallVisible(true);
      setIsSimulating(true);
      ballRef.current.applyShot(shot);
    },

    resetBall: () => {
      ballRef.current?.reset();
      setBallVisible(true);
    },

    resetPins: (standingIds: number[]) => {
      pinRefs.current.forEach((pinRef, index) => {
        if (pinRef && standingIds.includes(index + 1)) {
          const [x, z] = PIN_POSITIONS[index];
          pinRef.reset([x, PIN_HEIGHT / 2, z]);
        }
      });
      knockedPinIds.current.clear();
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
      style={{ background: '#1a1a2e' }}
    >
      {/* 조명 */}
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[10, 20, 10]}
        intensity={1}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <directionalLight position={[-10, 15, -10]} intensity={0.5} />

      {/* 물리 월드 */}
      <Physics gravity={[0, -9.81, 0]} debug={debug}>
        {/* 레인 */}
        <BowlingLane3D />

        {/* 핀 */}
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
            />
          );
        })}

        {/* 볼링공 */}
        <Ball3D ref={ballRef} visible={ballVisible} />
      </Physics>

      {/* 카메라 컨트롤 (디버그용) */}
      {debug && <OrbitControls />}
    </Canvas>
  );
});
