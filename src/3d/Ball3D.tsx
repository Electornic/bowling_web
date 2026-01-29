import { forwardRef, useImperativeHandle, useRef } from 'react';
import { RigidBody, BallCollider, type RapierRigidBody } from '@react-three/rapier';
import { Sphere } from '@react-three/drei';
import { useAfterPhysicsStep } from '@react-three/rapier';
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
  BALL_STOP_VELOCITY,
  LANE_END_Z,
  LINEAR_DAMPING,
  ANGULAR_DAMPING,
} from './constants';

interface Ball3DProps {
  visible: boolean;
}

export interface Ball3DRef {
  applyShot: (shot: Shot) => void;
  applyImpact: (damping: number) => void;
  reset: () => void;
  getPosition: () => Vector3D;
  getVelocity: () => Vector3D;
  isStopped: () => boolean;
  isOutOfBounds: () => boolean;
}

export const Ball3D = forwardRef<Ball3DRef, Ball3DProps>(function Ball3D({ visible }, ref) {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const lastPositionRef = useRef<Vector3D>({ x: 0, y: 0, z: 0 });
  const lastVelocityRef = useRef<Vector3D>({ x: 0, y: 0, z: 0 });

  useAfterPhysicsStep(() => {
    const body = rigidBodyRef.current;
    if (!body) return;
    const pos = body.translation();
    const vel = body.linvel();
    lastPositionRef.current = { x: pos.x, y: pos.y, z: pos.z };
    lastVelocityRef.current = { x: vel.x, y: vel.y, z: vel.z };
  });

  useImperativeHandle(ref, () => ({
    applyShot: (shot: Shot) => {
      if (!rigidBodyRef.current) return;

      // Shot을 3D 속도로 변환
      const speed = MIN_BALL_SPEED + shot.power * (MAX_BALL_SPEED - MIN_BALL_SPEED);
      const angle = shot.angleOffset;

      // 시작 위치 (lineOffset 적용)
      const startX = shot.lineOffset * (LANE_WIDTH / 2 - BALL_RADIUS);
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
        x: speed / BALL_RADIUS, // 전진 회전 (롤링 근사)
        y: shot.spin * 8, // 좌우 스핀
        z: 0,
      };
      rigidBodyRef.current.setAngvel(angularVel, true);

      rigidBodyRef.current.wakeUp();
    },

    applyImpact: (damping: number) => {
      if (!rigidBodyRef.current) return;
      const vel = rigidBodyRef.current.linvel();
      rigidBodyRef.current.setLinvel(
        { x: vel.x * damping, y: vel.y * damping, z: vel.z * damping },
        true
      );
      const ang = rigidBodyRef.current.angvel();
      rigidBodyRef.current.setAngvel(
        { x: ang.x * damping, y: ang.y * damping, z: ang.z * damping },
        true
      );
    },

    reset: () => {
      if (!rigidBodyRef.current) return;

      rigidBodyRef.current.setTranslation(BALL_START_POSITION, true);
      rigidBodyRef.current.setRotation({ x: 0, y: 0, z: 0, w: 1 }, true);
      rigidBodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      rigidBodyRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
      rigidBodyRef.current.sleep();
      lastPositionRef.current = { ...BALL_START_POSITION };
      lastVelocityRef.current = { x: 0, y: 0, z: 0 };
    },

    getPosition: () => {
      return lastPositionRef.current;
    },

    getVelocity: () => {
      return lastVelocityRef.current;
    },

    isStopped: () => {
      const vel = lastVelocityRef.current;
      const speed = Math.sqrt(vel.x ** 2 + vel.y ** 2 + vel.z ** 2);
      return speed < BALL_STOP_VELOCITY;
    },

    isOutOfBounds: () => {
      const pos = lastPositionRef.current;
      // 핀 뒤쪽으로 갔거나, 거터로 떨어졌거나
      return pos.z < LANE_END_Z - 2 || pos.y < -1;
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
      linearDamping={LINEAR_DAMPING}
      angularDamping={ANGULAR_DAMPING}
      colliders={false}
      ccd={true} // Continuous Collision Detection
    >
      <BallCollider args={[BALL_RADIUS]} friction={FRICTION} restitution={RESTITUTION} />

      {/* 볼링공 시각적 표현 */}
      <Sphere args={[BALL_RADIUS, 32, 32]} castShadow>
        <meshStandardMaterial color="#1a202c" metalness={0.3} roughness={0.4} />
      </Sphere>
    </RigidBody>
  );
});
