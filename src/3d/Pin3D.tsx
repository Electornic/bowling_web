import { forwardRef, useImperativeHandle, useRef } from 'react';
import { RigidBody, CapsuleCollider, type RapierRigidBody } from '@react-three/rapier';
import { Cylinder, Sphere } from '@react-three/drei';
import {
  PIN_HEIGHT,
  PIN_RADIUS_TOP,
  PIN_RADIUS_BOTTOM,
  PIN_MASS,
  FRICTION,
  RESTITUTION,
  LINEAR_DAMPING,
  ANGULAR_DAMPING,
  PIN_DOWN_ANGLE,
} from './constants';
import { Quaternion, Vector3 } from 'three';

interface Pin3DProps {
  id: number;
  position: [number, number, number];
  isStanding: boolean;
  onFall?: (id: number) => void;
}

export interface Pin3DRef {
  reset: (position: [number, number, number]) => void;
  isDown: () => boolean;
  getRotation: () => Quaternion | null;
}

export const Pin3D = forwardRef<Pin3DRef, Pin3DProps>(function Pin3D(
  { position, isStanding },
  ref
) {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const upVector = useRef(new Vector3(0, 1, 0));
  const worldUp = useRef(new Vector3(0, 1, 0));

  useImperativeHandle(ref, () => ({
    reset: (newPosition: [number, number, number]) => {
      if (rigidBodyRef.current) {
        rigidBodyRef.current.setTranslation(
          { x: newPosition[0], y: newPosition[1], z: newPosition[2] },
          true
        );
        rigidBodyRef.current.setRotation({ x: 0, y: 0, z: 0, w: 1 }, true);
        rigidBodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
        rigidBodyRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
        rigidBodyRef.current.wakeUp();
      }
    },
    isDown: () => {
      if (!rigidBodyRef.current) return false;

      const rotation = rigidBodyRef.current.rotation();
      const quat = new Quaternion(rotation.x, rotation.y, rotation.z, rotation.w);
      const pinUp = upVector.current.clone().applyQuaternion(quat);
      const tiltAngle = pinUp.angleTo(worldUp.current);
      return tiltAngle > PIN_DOWN_ANGLE;
    },
    getRotation: () => {
      if (!rigidBodyRef.current) return null;
      const r = rigidBodyRef.current.rotation();
      return { x: r.x, y: r.y, z: r.z, w: r.w } as Quaternion;
    },
  }));

  if (!isStanding) {
    return null;
  }

  return (
    <RigidBody
      ref={rigidBodyRef}
      type="dynamic"
      position={position}
      mass={PIN_MASS}
      linearDamping={LINEAR_DAMPING}
      angularDamping={ANGULAR_DAMPING}
      colliders={false}
    >
      {/* Capsule 콜라이더 (안정적인 물리) */}
      <CapsuleCollider
        args={[PIN_HEIGHT / 2 - PIN_RADIUS_BOTTOM, PIN_RADIUS_BOTTOM]}
        friction={FRICTION}
        restitution={RESTITUTION}
      />

      {/* 핀 시각적 표현 */}
      <group>
        {/* 핀 몸체 (원통) */}
        <Cylinder
          args={[PIN_RADIUS_TOP, PIN_RADIUS_BOTTOM, PIN_HEIGHT, 16]}
          position={[0, PIN_HEIGHT / 2, 0]}
          castShadow
        >
          <meshStandardMaterial color="#ffffff" />
        </Cylinder>

        {/* 핀 머리 (구) */}
        <Sphere args={[PIN_RADIUS_TOP * 1.2, 16, 16]} position={[0, PIN_HEIGHT, 0]} castShadow>
          <meshStandardMaterial color="#ffffff" />
        </Sphere>

        {/* 빨간 줄무늬 */}
        <Cylinder
          args={[PIN_RADIUS_BOTTOM * 0.9, PIN_RADIUS_BOTTOM * 0.85, 0.15, 16]}
          position={[0, PIN_HEIGHT * 0.3, 0]}
        >
          <meshStandardMaterial color="#cc0000" />
        </Cylinder>
        <Cylinder
          args={[PIN_RADIUS_TOP * 1.1, PIN_RADIUS_TOP * 1.05, 0.1, 16]}
          position={[0, PIN_HEIGHT * 0.7, 0]}
        >
          <meshStandardMaterial color="#cc0000" />
        </Cylinder>
      </group>
    </RigidBody>
  );
});
