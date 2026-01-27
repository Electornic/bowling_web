import { RigidBody } from '@react-three/rapier';
import {
  LANE_WIDTH,
  LANE_LENGTH,
  LANE_THICKNESS,
  GUTTER_WIDTH,
  GUARDRAIL_HEIGHT,
} from './constants';

export function BowlingLane3D() {
  return (
    <group>
      {/* 레인 바닥 */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[0, -LANE_THICKNESS / 2, -LANE_LENGTH / 2]} receiveShadow>
          <boxGeometry args={[LANE_WIDTH, LANE_THICKNESS, LANE_LENGTH]} />
          <meshStandardMaterial color="#d4a574" />
        </mesh>
      </RigidBody>

      {/* 레인 라인 (시각적) */}
      <mesh position={[0, 0.01, -LANE_LENGTH / 2]}>
        <planeGeometry args={[LANE_WIDTH, LANE_LENGTH]} />
        <meshStandardMaterial color="#c4956a" transparent opacity={0.3} />
      </mesh>

      {/* 파울 라인 */}
      <mesh position={[0, 0.02, 20]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[LANE_WIDTH, 0.1]} />
        <meshStandardMaterial color="#333333" />
      </mesh>

      {/* 왼쪽 거터 */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh
          position={[-(LANE_WIDTH / 2 + GUTTER_WIDTH / 2), -0.3, -LANE_LENGTH / 2]}
          receiveShadow
        >
          <boxGeometry args={[GUTTER_WIDTH, 0.3, LANE_LENGTH]} />
          <meshStandardMaterial color="#1a1a1a" />
        </mesh>
      </RigidBody>

      {/* 오른쪽 거터 */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh
          position={[LANE_WIDTH / 2 + GUTTER_WIDTH / 2, -0.3, -LANE_LENGTH / 2]}
          receiveShadow
        >
          <boxGeometry args={[GUTTER_WIDTH, 0.3, LANE_LENGTH]} />
          <meshStandardMaterial color="#1a1a1a" />
        </mesh>
      </RigidBody>

      {/* 왼쪽 가드레일 */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh
          position={[-(LANE_WIDTH / 2 + GUTTER_WIDTH + 0.2), GUARDRAIL_HEIGHT / 2, -LANE_LENGTH / 2]}
        >
          <boxGeometry args={[0.4, GUARDRAIL_HEIGHT, LANE_LENGTH]} />
          <meshStandardMaterial color="#444444" />
        </mesh>
      </RigidBody>

      {/* 오른쪽 가드레일 */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh
          position={[LANE_WIDTH / 2 + GUTTER_WIDTH + 0.2, GUARDRAIL_HEIGHT / 2, -LANE_LENGTH / 2]}
        >
          <boxGeometry args={[0.4, GUARDRAIL_HEIGHT, LANE_LENGTH]} />
          <meshStandardMaterial color="#444444" />
        </mesh>
      </RigidBody>

      {/* 핀 데크 영역 (뒤쪽 벽) */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[0, 1, -LANE_LENGTH - 1]}>
          <boxGeometry args={[LANE_WIDTH + 4, 3, 2]} />
          <meshStandardMaterial color="#222222" />
        </mesh>
      </RigidBody>
    </group>
  );
}
