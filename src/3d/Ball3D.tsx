import { forwardRef, useImperativeHandle, useRef } from 'react';
import { RigidBody, BallCollider, type RapierRigidBody } from '@react-three/rapier';
import { Sphere } from '@react-three/drei';
import type { Shot, Vector3D } from '../core/types';
import {
  BALL_RADIUS,
  BALL_MASS,
  FRICTION,
  RESTITUTION,
  BALL_START_POSITION,
  MAX_BALL_SPEED,
  MIN_BALL_SPEED,
  LANE_WIDTH,
} from './constants';

interface Ball3DProps {
  visible: boolean;
}

export interface Ball3DRef {
  applyShot: (shot: Shot) => void;
  reset: () => void;
  getPosition: () => Vector3D;
  getVelocity: () => Vector3D;
  isStopped: () => boolean;
  isOutOfBounds: () => boolean;
}

export const Ball3D = forwardRef<Ball3DRef, Ball3DProps>(function Ball3D({ visible }, ref) {
  const rigidBodyRef = useRef<RapierRigidBody>(null);

  useImperativeHandle(ref, () => ({
    applyShot: (shot: Shot) => {
      if (!rigidBodyRef.current) return;

      // Shot을 3D 속도로 변환
      const speed = MIN_BALL_SPEED + shot.power * (MAX_BALL_SPEED - MIN_BALL_SPEED);
      const angle = shot.angleOffset;

      // 시작 위치 (lineOffset 적용)
      const startX = shot.lineOffset * (LANE_WIDTH / 2 - BALL_RADIUS - 0.5);
      rigidBodyRef.current.setTranslation(
        { x: startX, y: BALL_START_POSITION.y, z: BALL_START_POSITION.z },
        true
      );

      // 선속도 (핀 방향 = 음의 Z)
      const linearVel = {
        x: Math.sin(angle) * speed,
        y: 0,
        z: -Math.cos(angle) * speed,
      };
      rigidBodyRef.current.setLinvel(linearVel, true);

      // 각속도 (스핀)
      const angularVel = {
        x: speed * 0.5, // 전진 회전
        y: shot.spin * 8, // 좌우 스핀
        z: 0,
      };
      rigidBodyRef.current.setAngvel(angularVel, true);

      rigidBodyRef.current.wakeUp();
    },

    reset: () => {
      if (!rigidBodyRef.current) return;

      rigidBodyRef.current.setTranslation(BALL_START_POSITION, true);
      rigidBodyRef.current.setRotation({ x: 0, y: 0, z: 0, w: 1 }, true);
      rigidBodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      rigidBodyRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
      rigidBodyRef.current.sleep();
    },

    getPosition: () => {
      if (!rigidBodyRef.current) {
        return { x: 0, y: 0, z: 0 };
      }
      const pos = rigidBodyRef.current.translation();
      return { x: pos.x, y: pos.y, z: pos.z };
    },

    getVelocity: () => {
      if (!rigidBodyRef.current) {
        return { x: 0, y: 0, z: 0 };
      }
      const vel = rigidBodyRef.current.linvel();
      return { x: vel.x, y: vel.y, z: vel.z };
    },

    isStopped: () => {
      if (!rigidBodyRef.current) return true;

      const vel = rigidBodyRef.current.linvel();
      const speed = Math.sqrt(vel.x ** 2 + vel.y ** 2 + vel.z ** 2);
      return speed < 0.5;
    },

    isOutOfBounds: () => {
      if (!rigidBodyRef.current) return false;

      const pos = rigidBodyRef.current.translation();
      // 핀 뒤쪽으로 갔거나, 거터로 떨어졌거나
      return pos.z < -62 || pos.y < -2;
    },
  }));

  if (!visible) {
    return null;
  }

  return (
    <RigidBody
      ref={rigidBodyRef}
      type="dynamic"
      position={[BALL_START_POSITION.x, BALL_START_POSITION.y, BALL_START_POSITION.z]}
      mass={BALL_MASS}
      linearDamping={0.3}
      angularDamping={0.3}
      colliders={false}
      ccd={true} // Continuous Collision Detection
    >
      <BallCollider args={[BALL_RADIUS]} friction={FRICTION} restitution={RESTITUTION} />

      {/* 볼링공 시각적 표현 */}
      <Sphere args={[BALL_RADIUS, 32, 32]} castShadow>
        <meshStandardMaterial color="#1a202c" metalness={0.3} roughness={0.4} />
      </Sphere>

      {/* 손가락 구멍 */}
      <group rotation={[0, 0, 0]}>
        <Sphere args={[0.08, 16, 16]} position={[0.15, 0.3, 0]}>
          <meshStandardMaterial color="#0a0a0a" />
        </Sphere>
        <Sphere args={[0.08, 16, 16]} position={[-0.15, 0.3, 0]}>
          <meshStandardMaterial color="#0a0a0a" />
        </Sphere>
        <Sphere args={[0.1, 16, 16]} position={[0, 0.1, 0.2]}>
          <meshStandardMaterial color="#0a0a0a" />
        </Sphere>
      </group>
    </RigidBody>
  );
});
