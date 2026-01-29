import { RigidBody } from '@react-three/rapier';
import {
  LANE_WIDTH,
  LANE_LENGTH,
  LANE_THICKNESS,
  GUTTER_WIDTH,
  GUARDRAIL_HEIGHT,
  LANE_CENTER_Z,
  LANE_START_Z,
  LANE_END_Z,
} from './constants';

export function BowlingLane3D() {
  const laneFloorWidth = LANE_WIDTH + GUTTER_WIDTH * 2;
  const gutterDepth = 0.18;
  const gutterFloorHeight = 0.08;
  const gutterInnerWallHeight = gutterDepth + 0.06;
  const pitLength = 1.2;
  const pitDepth = 0.5;

  return (
    <group>
      {/* 레인 바닥 */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[0, -LANE_THICKNESS / 2, LANE_CENTER_Z]} receiveShadow>
          <boxGeometry args={[LANE_WIDTH, LANE_THICKNESS, LANE_LENGTH]} />
          <meshStandardMaterial color="#d4a574" />
        </mesh>
      </RigidBody>

      {/* 레인 라인 (시각적) */}
      <mesh position={[0, 0.01, LANE_CENTER_Z]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[LANE_WIDTH, LANE_LENGTH]} />
        <meshStandardMaterial color="#c4956a" transparent opacity={0.3} />
      </mesh>

      {/* 거터 경계 라인 */}
      <mesh position={[LANE_WIDTH / 2 - 0.02, 0.015, LANE_CENTER_Z]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.04, LANE_LENGTH]} />
        <meshStandardMaterial color="#f5e6c8" transparent opacity={0.5} />
      </mesh>
      <mesh position={[-LANE_WIDTH / 2 + 0.02, 0.015, LANE_CENTER_Z]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.04, LANE_LENGTH]} />
        <meshStandardMaterial color="#f5e6c8" transparent opacity={0.5} />
      </mesh>

      {/* 파울 라인 */}
      <mesh position={[0, 0.02, LANE_START_Z - 0.2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[LANE_WIDTH, 0.1]} />
        <meshStandardMaterial color="#333333" />
      </mesh>

      {/* 왼쪽 거터 */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh
          position={[
            -(LANE_WIDTH / 2 + GUTTER_WIDTH / 2),
            -gutterDepth,
            LANE_CENTER_Z,
          ]}
          receiveShadow
        >
          <boxGeometry args={[GUTTER_WIDTH, gutterFloorHeight, LANE_LENGTH]} />
          <meshStandardMaterial color="#0d0b0a" />
        </mesh>
      </RigidBody>

      {/* 왼쪽 거터 안쪽 벽 (시각) */}
      <mesh
        position={[-LANE_WIDTH / 2, -gutterDepth / 2, LANE_CENTER_Z]}
        receiveShadow
      >
        <boxGeometry args={[0.03, gutterInnerWallHeight, LANE_LENGTH]} />
        <meshStandardMaterial color="#1a1310" />
      </mesh>

      {/* 오른쪽 거터 */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh
          position={[
            LANE_WIDTH / 2 + GUTTER_WIDTH / 2,
            -gutterDepth,
            LANE_CENTER_Z,
          ]}
          receiveShadow
        >
          <boxGeometry args={[GUTTER_WIDTH, gutterFloorHeight, LANE_LENGTH]} />
          <meshStandardMaterial color="#0d0b0a" />
        </mesh>
      </RigidBody>

      {/* 오른쪽 거터 안쪽 벽 (시각) */}
      <mesh
        position={[LANE_WIDTH / 2, -gutterDepth / 2, LANE_CENTER_Z]}
        receiveShadow
      >
        <boxGeometry args={[0.03, gutterInnerWallHeight, LANE_LENGTH]} />
        <meshStandardMaterial color="#1a1310" />
      </mesh>

      {/* 왼쪽 가드레일 */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh
          position={[-(LANE_WIDTH / 2 + GUTTER_WIDTH + 0.1), GUARDRAIL_HEIGHT / 2, LANE_CENTER_Z]}
        >
          <boxGeometry args={[0.2, GUARDRAIL_HEIGHT, LANE_LENGTH]} />
          <meshStandardMaterial color="#444444" />
        </mesh>
      </RigidBody>

      {/* 오른쪽 가드레일 */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh
          position={[LANE_WIDTH / 2 + GUTTER_WIDTH + 0.1, GUARDRAIL_HEIGHT / 2, LANE_CENTER_Z]}
        >
          <boxGeometry args={[0.2, GUARDRAIL_HEIGHT, LANE_LENGTH]} />
          <meshStandardMaterial color="#444444" />
        </mesh>
      </RigidBody>

      {/* 핀 데크 영역 (뒤쪽 벽) */}
      <mesh position={[0, -LANE_THICKNESS / 2 - pitDepth / 2, LANE_END_Z - pitLength / 2]}>
        <boxGeometry args={[laneFloorWidth + 0.6, pitDepth, pitLength]} />
        <meshStandardMaterial color="#0a0a0a" />
      </mesh>
      <mesh position={[0, 0.5, LANE_END_Z - pitLength]}>
        <boxGeometry args={[laneFloorWidth + 0.6, 1, 0.2]} />
        <meshStandardMaterial color="#151515" />
      </mesh>
      <mesh position={[0, 1.2, LANE_END_Z - pitLength - 0.2]}>
        <boxGeometry args={[laneFloorWidth + 0.6, 0.4, 0.2]} />
        <meshStandardMaterial color="#202020" />
      </mesh>
    </group>
  );
}
