import { forwardRef, useImperativeHandle, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Cylinder, Sphere } from '@react-three/drei';
import {
  PIN_HEIGHT,
  PIN_RADIUS_TOP,
  PIN_RADIUS_BOTTOM,
} from './constants';
import type { Quaternion } from 'three';
import type { Group } from 'three';

interface Pin3DProps {
  id: number;
  position: [number, number, number];
  isStanding: boolean;
  onFall?: (id: number) => void;
  isActive: boolean;
}

export interface Pin3DRef {
  reset: (position: [number, number, number]) => void;
  isDown: () => boolean;
  getRotation: () => Quaternion | null;
  markHit: () => void;
  getPosition: () => { x: number; y: number; z: number };
}

export const Pin3D = forwardRef<Pin3DRef, Pin3DProps>(function Pin3D(
  { position, isStanding, isActive },
  ref
) {
  const hitRef = useRef(false);
  const groupRef = useRef<Group>(null);
  const basePositionRef = useRef<[number, number, number]>(position);
  const fallParamsRef = useRef({
    rotXSpeed: 0,
    rotZSpeed: 0,
    driftX: 0,
    driftZ: 0,
    dropSpeed: 0,
  });

  useImperativeHandle(ref, () => ({
    reset: (newPosition: [number, number, number]) => {
      void newPosition;
      hitRef.current = false;
      fallParamsRef.current = {
        rotXSpeed: 0,
        rotZSpeed: 0,
        driftX: 0,
        driftZ: 0,
        dropSpeed: 0,
      };
      if (groupRef.current) {
        groupRef.current.rotation.set(0, 0, 0);
        groupRef.current.position.set(
          basePositionRef.current[0],
          basePositionRef.current[1],
          basePositionRef.current[2]
        );
      }
    },
    isDown: () => {
      return hitRef.current;
    },
    getRotation: () => {
      return null;
    },
    markHit: () => {
      if (hitRef.current) return;
      hitRef.current = true;
      fallParamsRef.current = {
        rotXSpeed: 0.04 + Math.random() * 0.02,
        rotZSpeed: (Math.random() - 0.5) * 0.04,
        driftX: (Math.random() - 0.5) * 0.003,
        driftZ: (Math.random() - 0.5) * 0.003,
        dropSpeed: 0.006,
      };
    },
    getPosition: () => {
      return { x: position[0], y: position[1], z: position[2] };
    },
  }));

  useFrame(() => {
    if (!groupRef.current || !hitRef.current) return;
    const params = fallParamsRef.current;
    const base = basePositionRef.current;

    const nextRotX = Math.min(groupRef.current.rotation.x + params.rotXSpeed, Math.PI / 2);
    const nextRotZ = groupRef.current.rotation.z + params.rotZSpeed;
    const clampedRotZ = Math.max(Math.min(nextRotZ, Math.PI / 2.2), -Math.PI / 2.2);
    const nextY = Math.max(groupRef.current.position.y - params.dropSpeed, base[1] - 0.18);

    groupRef.current.rotation.x = nextRotX;
    groupRef.current.rotation.z = clampedRotZ;
    groupRef.current.position.y = nextY;
    groupRef.current.position.x += params.driftX;
    groupRef.current.position.z += params.driftZ;

    params.rotXSpeed *= 0.99;
    params.rotZSpeed *= 0.99;
    params.driftX *= 0.97;
    params.driftZ *= 0.97;
    params.dropSpeed *= 0.99;
  });

  if (!isStanding) {
    return null;
  }

  if (isActive) {
    hitRef.current = hitRef.current || false;
  }

  return (
    <group ref={groupRef} position={position}>
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
  );
});
