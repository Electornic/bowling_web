import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import type { Shot, ThrowResult } from '../core/types';
import {
  BALL_RADIUS,
  BALL_START_POSITION,
  BALL_STOP_FRAMES,
  BALL_STOP_VELOCITY,
  CAMERA_LOOK_AT,
  CAMERA_POSITION,
  FRICTION,
  GUARDRAIL_HEIGHT,
  LANE_CENTER_Z,
  LANE_END_Z,
  LANE_LENGTH,
  LANE_THICKNESS,
  LANE_WIDTH,
  GUTTER_WIDTH,
  MAX_BALL_SPEED,
  MIN_BALL_SPEED,
  PIN_DOWN_ANGLE,
  PIN_HEIGHT,
  PIN_POSITIONS,
  PIN_RADIUS_BOTTOM,
  PIN_RADIUS_TOP,
  RESTITUTION,
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

type PinBody = {
  id: number;
  body: RAPIER.RigidBody;
  collider: RAPIER.Collider;
  mesh: THREE.Object3D;
  initialPosition: THREE.Vector3;
};

type DebugPipeline = {
  render: (world: RAPIER.World) => { vertices: Float32Array; colors: Float32Array };
};

const FIXED_STEP = 1 / 60;
const SUBSTEPS = 2;
const MAX_SIMULATION_FRAMES = 600;

export const Scene3D = forwardRef<Scene3DRef, Scene3DProps>(function Scene3D(
  { standingPinIds, onThrowComplete, debug = false },
  ref
) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const onThrowCompleteRef = useRef(onThrowComplete);
  const standingPinIdsRef = useRef(standingPinIds);

  const worldRef = useRef<RAPIER.World | null>(null);
  const ballBodyRef = useRef<RAPIER.RigidBody | null>(null);
  const ballMeshRef = useRef<THREE.Mesh | null>(null);
  const pinsRef = useRef<PinBody[]>([]);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  const debugLineRef = useRef<THREE.LineSegments | null>(null);
  const debugPipelineRef = useRef<DebugPipeline | null>(null);
  const debugEnabledRef = useRef(debug);

  const isSimulatingRef = useRef(false);
  const simulationFrameCount = useRef(0);
  const stoppedFrames = useRef(0);
  const knockedPinIds = useRef<Set<number>>(new Set());
  const initialStandingPins = useRef<number[]>(standingPinIds);

  useEffect(() => {
    onThrowCompleteRef.current = onThrowComplete;
  }, [onThrowComplete]);

  useEffect(() => {
    standingPinIdsRef.current = standingPinIds;
  }, [standingPinIds]);

  useImperativeHandle(ref, () => ({
    applyShot: (shot: Shot) => {
      if (!ballBodyRef.current || !worldRef.current || isSimulatingRef.current) return;

      knockedPinIds.current.clear();
      initialStandingPins.current = [...standingPinIdsRef.current];
      simulationFrameCount.current = 0;
      stoppedFrames.current = 0;

      const speed = MIN_BALL_SPEED + shot.power * (MAX_BALL_SPEED - MIN_BALL_SPEED);
      const angle = shot.angleOffset;
      const startX = shot.lineOffset * (LANE_WIDTH / 2 - BALL_RADIUS);

      ballBodyRef.current.setTranslation({ x: startX, y: BALL_START_POSITION.y, z: BALL_START_POSITION.z }, true);
      ballBodyRef.current.setLinvel(
        {
          x: Math.sin(angle) * speed,
          y: 0,
          z: -Math.cos(angle) * speed,
        },
        true
      );
      ballBodyRef.current.setAngvel(
        {
          x: speed / BALL_RADIUS,
          y: shot.spin * 8,
          z: 0,
        },
        true
      );
      ballBodyRef.current.wakeUp();
      isSimulatingRef.current = true;
    },

    resetBall: () => {
      if (!ballBodyRef.current) return;
      ballBodyRef.current.setTranslation(BALL_START_POSITION, true);
      ballBodyRef.current.setRotation({ x: 0, y: 0, z: 0, w: 1 }, true);
      ballBodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      ballBodyRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
      ballBodyRef.current.sleep();
    },

    resetPins: (standingIds: number[]) => {
      const standingSet = new Set(standingIds);
      pinsRef.current.forEach((pin) => {
        const shouldStand = standingSet.has(pin.id);
        pin.collider.setEnabled(shouldStand);
        pin.mesh.visible = shouldStand;

        if (shouldStand) {
          pin.body.setTranslation(
            { x: pin.initialPosition.x, y: pin.initialPosition.y, z: pin.initialPosition.z },
            true
          );
          pin.body.setRotation({ x: 0, y: 0, z: 0, w: 1 }, true);
          pin.body.setLinvel({ x: 0, y: 0, z: 0 }, true);
          pin.body.setAngvel({ x: 0, y: 0, z: 0 }, true);
          pin.body.wakeUp();
        } else {
          pin.body.setTranslation({ x: 0, y: -5, z: 0 }, true);
          pin.body.sleep();
        }
      });
      knockedPinIds.current.clear();
      isSimulatingRef.current = false;
    },

    isSimulating: () => isSimulatingRef.current,
  }));

  useEffect(() => {
    let animationFrameId = 0;
    let mounted = true;

    const cleanupFns: Array<() => void> = [];

    const init = async () => {
      await RAPIER.init();
      if (!mounted) return;

      const container = containerRef.current;
      if (!container) return;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color('#1a1a2e');
      sceneRef.current = scene;

      const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 200);
      camera.position.set(CAMERA_POSITION.x, CAMERA_POSITION.y, CAMERA_POSITION.z);
      camera.lookAt(CAMERA_LOOK_AT.x, CAMERA_LOOK_AT.y, CAMERA_LOOK_AT.z);
      cameraRef.current = camera;

      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setPixelRatio(window.devicePixelRatio || 1);
      renderer.setSize(container.clientWidth, container.clientHeight);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      container.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      const ambient = new THREE.AmbientLight(0xffffff, 0.45);
      scene.add(ambient);

      const directional = new THREE.DirectionalLight(0xffffff, 1.0);
      directional.position.set(4, 6, 4);
      directional.castShadow = true;
      directional.shadow.mapSize.set(2048, 2048);
      directional.shadow.camera.near = 1;
      directional.shadow.camera.far = 50;
      directional.shadow.camera.left = -10;
      directional.shadow.camera.right = 10;
      directional.shadow.camera.top = 10;
      directional.shadow.camera.bottom = -10;
      scene.add(directional);

      const fill = new THREE.DirectionalLight(0x8899ff, 0.35);
      fill.position.set(-4, 3, -2);
      scene.add(fill);

      const laneFloorWidth = LANE_WIDTH + GUTTER_WIDTH * 2;
      const laneGeometry = new THREE.BoxGeometry(laneFloorWidth, LANE_THICKNESS, LANE_LENGTH);
      const laneMaterial = new THREE.MeshStandardMaterial({ color: '#d4a574', roughness: 0.6, metalness: 0.1 });
      const laneMesh = new THREE.Mesh(laneGeometry, laneMaterial);
      laneMesh.position.set(0, -LANE_THICKNESS / 2, LANE_CENTER_Z);
      laneMesh.receiveShadow = true;
      scene.add(laneMesh);

      const gutterMaterial = new THREE.MeshStandardMaterial({ color: '#1a1a1a', roughness: 0.8, metalness: 0 });
      const gutterGeometry = new THREE.BoxGeometry(GUTTER_WIDTH, 0.1, LANE_LENGTH);
      const leftGutter = new THREE.Mesh(gutterGeometry, gutterMaterial);
      leftGutter.position.set(-(LANE_WIDTH / 2 + GUTTER_WIDTH / 2), -0.1, LANE_CENTER_Z);
      leftGutter.receiveShadow = true;
      scene.add(leftGutter);

      const rightGutter = leftGutter.clone();
      rightGutter.position.set(LANE_WIDTH / 2 + GUTTER_WIDTH / 2, -0.1, LANE_CENTER_Z);
      scene.add(rightGutter);

      const guardrailGeometry = new THREE.BoxGeometry(0.2, GUARDRAIL_HEIGHT, LANE_LENGTH);
      const guardrailMaterial = new THREE.MeshStandardMaterial({ color: '#444444', roughness: 0.7, metalness: 0.1 });
      const leftRail = new THREE.Mesh(guardrailGeometry, guardrailMaterial);
      leftRail.position.set(-(LANE_WIDTH / 2 + GUTTER_WIDTH + 0.1), GUARDRAIL_HEIGHT / 2, LANE_CENTER_Z);
      leftRail.castShadow = true;
      scene.add(leftRail);

      const rightRail = leftRail.clone();
      rightRail.position.set(LANE_WIDTH / 2 + GUTTER_WIDTH + 0.1, GUARDRAIL_HEIGHT / 2, LANE_CENTER_Z);
      scene.add(rightRail);

      const backboardGeometry = new THREE.BoxGeometry(laneFloorWidth + 0.6, 2, 1);
      const backboardMaterial = new THREE.MeshStandardMaterial({ color: '#222222', roughness: 0.9, metalness: 0.05 });
      const backboard = new THREE.Mesh(backboardGeometry, backboardMaterial);
      backboard.position.set(0, 1, LANE_END_Z - 0.5);
      backboard.receiveShadow = true;
      scene.add(backboard);

      const world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
      world.integrationParameters.dt = FIXED_STEP / SUBSTEPS;
      worldRef.current = world;

      const laneBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed());
      world.createCollider(
        RAPIER.ColliderDesc.cuboid(laneFloorWidth / 2, LANE_THICKNESS / 2, LANE_LENGTH / 2)
          .setTranslation(0, -LANE_THICKNESS / 2, LANE_CENTER_Z)
          .setFriction(FRICTION)
          .setRestitution(RESTITUTION),
        laneBody
      );

      const leftRailBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed());
      world.createCollider(
        RAPIER.ColliderDesc.cuboid(0.1, GUARDRAIL_HEIGHT / 2, LANE_LENGTH / 2)
          .setTranslation(-(LANE_WIDTH / 2 + GUTTER_WIDTH + 0.1), GUARDRAIL_HEIGHT / 2, LANE_CENTER_Z)
          .setFriction(FRICTION)
          .setRestitution(RESTITUTION),
        leftRailBody
      );

      const rightRailBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed());
      world.createCollider(
        RAPIER.ColliderDesc.cuboid(0.1, GUARDRAIL_HEIGHT / 2, LANE_LENGTH / 2)
          .setTranslation(LANE_WIDTH / 2 + GUTTER_WIDTH + 0.1, GUARDRAIL_HEIGHT / 2, LANE_CENTER_Z)
          .setFriction(FRICTION)
          .setRestitution(RESTITUTION),
        rightRailBody
      );

      const backboardBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed());
      world.createCollider(
        RAPIER.ColliderDesc.cuboid((laneFloorWidth + 0.6) / 2, 1, 0.5)
          .setTranslation(0, 1, LANE_END_Z - 0.5)
          .setFriction(FRICTION)
          .setRestitution(RESTITUTION),
        backboardBody
      );

      const ballBody = world.createRigidBody(
        RAPIER.RigidBodyDesc.dynamic()
          .setTranslation(BALL_START_POSITION.x, BALL_START_POSITION.y, BALL_START_POSITION.z)
          .setLinvel(0, 0, 0)
          .setAngvel(0, 0, 0)
          .setLinearDamping(0.3)
          .setAngularDamping(0.3)
          .setCcdEnabled(true)
      );
      world.createCollider(
        RAPIER.ColliderDesc.ball(BALL_RADIUS)
          .setRestitution(RESTITUTION)
          .setFriction(FRICTION),
        ballBody
      );
      ballBodyRef.current = ballBody;

      const ballGeometry = new THREE.SphereGeometry(BALL_RADIUS, 32, 32);
      const ballMaterial = new THREE.MeshStandardMaterial({ color: '#1a202c', roughness: 0.4, metalness: 0.3 });
      const ballMesh = new THREE.Mesh(ballGeometry, ballMaterial);
      ballMesh.castShadow = true;
      ballMesh.position.set(BALL_START_POSITION.x, BALL_START_POSITION.y, BALL_START_POSITION.z);
      scene.add(ballMesh);
      ballMeshRef.current = ballMesh;

      const pinMaterial = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.5, metalness: 0.1 });
      const stripeMaterial = new THREE.MeshStandardMaterial({ color: '#cc0000', roughness: 0.5, metalness: 0.1 });

      pinsRef.current = PIN_POSITIONS.map(([x, z], index) => {
        const id = index + 1;
        const position = new THREE.Vector3(x, PIN_HEIGHT / 2, z);

        const body = world.createRigidBody(
          RAPIER.RigidBodyDesc.dynamic()
            .setTranslation(position.x, position.y, position.z)
            .setLinvel(0, 0, 0)
            .setAngvel(0, 0, 0)
            .setLinearDamping(0.5)
            .setAngularDamping(0.5)
        );

        const collider = world.createCollider(
          RAPIER.ColliderDesc.capsule(PIN_HEIGHT / 2 - PIN_RADIUS_BOTTOM, PIN_RADIUS_BOTTOM)
            .setRestitution(RESTITUTION)
            .setFriction(FRICTION),
          body
        );

        const pinGroup = new THREE.Group();
        const pinBodyMesh = new THREE.Mesh(
          new THREE.CylinderGeometry(PIN_RADIUS_TOP, PIN_RADIUS_BOTTOM, PIN_HEIGHT, 16),
          pinMaterial
        );
        pinBodyMesh.position.y = PIN_HEIGHT / 2;
        pinBodyMesh.castShadow = true;
        pinGroup.add(pinBodyMesh);

        const pinHead = new THREE.Mesh(new THREE.SphereGeometry(PIN_RADIUS_TOP * 1.1, 16, 16), pinMaterial);
        pinHead.position.y = PIN_HEIGHT;
        pinHead.castShadow = true;
        pinGroup.add(pinHead);

        const stripeTop = new THREE.Mesh(
          new THREE.CylinderGeometry(PIN_RADIUS_TOP * 1.1, PIN_RADIUS_TOP * 1.05, 0.05, 16),
          stripeMaterial
        );
        stripeTop.position.y = PIN_HEIGHT * 0.7;
        pinGroup.add(stripeTop);

        const stripeBottom = new THREE.Mesh(
          new THREE.CylinderGeometry(PIN_RADIUS_BOTTOM * 0.9, PIN_RADIUS_BOTTOM * 0.85, 0.06, 16),
          stripeMaterial
        );
        stripeBottom.position.y = PIN_HEIGHT * 0.3;
        pinGroup.add(stripeBottom);

        pinGroup.position.copy(position);
        scene.add(pinGroup);

        return { id, body, collider, mesh: pinGroup, initialPosition: position };
      });

      const initialStanding = new Set(standingPinIdsRef.current);
      pinsRef.current.forEach((pin) => {
        const shouldStand = initialStanding.has(pin.id);
        pin.collider.setEnabled(shouldStand);
        pin.mesh.visible = shouldStand;
        if (!shouldStand) {
          pin.body.setTranslation({ x: 0, y: -5, z: 0 }, true);
          pin.body.sleep();
        }
      });

      try {
        const DebugPipelineCtor = (RAPIER as unknown as { DebugRenderPipeline?: new () => DebugPipeline })
          .DebugRenderPipeline;
        if (!DebugPipelineCtor) throw new Error('DebugRenderPipeline not available');
        const pipeline = new DebugPipelineCtor();
        const debugGeometry = new THREE.BufferGeometry();
        const debugMaterial = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.65 });
        const debugLines = new THREE.LineSegments(debugGeometry, debugMaterial);
        debugLines.visible = debugEnabledRef.current;
        scene.add(debugLines);
        debugPipelineRef.current = pipeline;
        debugLineRef.current = debugLines;
      } catch {
        debugPipelineRef.current = null;
        debugLineRef.current = null;
      }

      const handleResize = () => {
        if (!container || !cameraRef.current || !rendererRef.current) return;
        cameraRef.current.aspect = container.clientWidth / container.clientHeight;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(container.clientWidth, container.clientHeight);
      };
      window.addEventListener('resize', handleResize);
      cleanupFns.push(() => window.removeEventListener('resize', handleResize));

      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'd' || event.key === 'D') {
          debugEnabledRef.current = !debugEnabledRef.current;
          if (debugLineRef.current) {
            debugLineRef.current.visible = debugEnabledRef.current;
          }
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      cleanupFns.push(() => window.removeEventListener('keydown', handleKeyDown));

      const upVector = new THREE.Vector3(0, 1, 0);
      const tempQuat = new THREE.Quaternion();
      const tempVec = new THREE.Vector3();

      let accumulator = 0;
      let lastTime = performance.now();

      const updateSimulationState = () => {
        if (!ballBodyRef.current) return;
        if (!isSimulatingRef.current) return;

        pinsRef.current.forEach((pin) => {
          if (!pin.mesh.visible) return;
          const rotation = pin.body.rotation();
          tempQuat.set(rotation.x, rotation.y, rotation.z, rotation.w);
          const pinUp = tempVec.set(0, 1, 0).applyQuaternion(tempQuat);
          const tilt = pinUp.angleTo(upVector);
          if (tilt > PIN_DOWN_ANGLE && !knockedPinIds.current.has(pin.id)) {
            knockedPinIds.current.add(pin.id);
          }
        });

        const velocity = ballBodyRef.current.linvel();
        const speed = Math.sqrt(velocity.x ** 2 + velocity.y ** 2 + velocity.z ** 2);
        const ballPos = ballBodyRef.current.translation();
        const ballStopped = speed < BALL_STOP_VELOCITY;
        const ballOutOfBounds = ballPos.z < LANE_END_Z - 2 || ballPos.y < -1;

        if (ballStopped || ballOutOfBounds) {
          stoppedFrames.current += 1;
        } else {
          stoppedFrames.current = 0;
        }

        simulationFrameCount.current += 1;

        if (stoppedFrames.current > BALL_STOP_FRAMES || simulationFrameCount.current > MAX_SIMULATION_FRAMES) {
          isSimulatingRef.current = false;
          const knockedArray = Array.from(knockedPinIds.current);
          const allPinsKnocked = knockedArray.length === initialStandingPins.current.length;
          const isStrike = initialStandingPins.current.length === 10 && allPinsKnocked;
          const isSpare = !isStrike && allPinsKnocked;

          onThrowCompleteRef.current({
            pinsKnocked: knockedArray,
            isStrike,
            isSpare,
          });
        }
      };

      const updateMeshesFromPhysics = () => {
        if (ballBodyRef.current && ballMeshRef.current) {
          const ballPos = ballBodyRef.current.translation();
          const ballRot = ballBodyRef.current.rotation();
          ballMeshRef.current.position.set(ballPos.x, ballPos.y, ballPos.z);
          ballMeshRef.current.quaternion.set(ballRot.x, ballRot.y, ballRot.z, ballRot.w);
        }

        pinsRef.current.forEach((pin) => {
          if (!pin.mesh.visible) return;
          const pos = pin.body.translation();
          const rot = pin.body.rotation();
          pin.mesh.position.set(pos.x, pos.y, pos.z);
          pin.mesh.quaternion.set(rot.x, rot.y, rot.z, rot.w);
        });
      };

      const updateCamera = () => {
        if (!cameraRef.current || !ballBodyRef.current) return;
        if (!isSimulatingRef.current) {
          cameraRef.current.position.lerp(
            new THREE.Vector3(CAMERA_POSITION.x, CAMERA_POSITION.y, CAMERA_POSITION.z),
            0.08
          );
          cameraRef.current.lookAt(CAMERA_LOOK_AT.x, CAMERA_LOOK_AT.y, CAMERA_LOOK_AT.z);
          return;
        }

        const ballPos = ballBodyRef.current.translation();
        const target = new THREE.Vector3(ballPos.x, ballPos.y, ballPos.z);
        const offset = new THREE.Vector3(0, 2.2, 5.5);
        const desired = target.clone().add(offset);

        cameraRef.current.position.lerp(desired, 0.12);
        cameraRef.current.lookAt(target.x, Math.max(0.1, target.y), target.z - 2);
      };

      const updateDebugLines = () => {
        if (!debugEnabledRef.current || !debugPipelineRef.current || !debugLineRef.current) return;
        const buffers = debugPipelineRef.current.render(world);
        const geometry = debugLineRef.current.geometry as THREE.BufferGeometry;
        geometry.setAttribute('position', new THREE.BufferAttribute(buffers.vertices, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(buffers.colors, 4));
        geometry.computeBoundingSphere();
      };

      const animate = (now: number) => {
        const delta = Math.min(0.1, (now - lastTime) / 1000);
        lastTime = now;
        accumulator += delta;

        while (accumulator >= FIXED_STEP) {
          for (let i = 0; i < SUBSTEPS; i += 1) {
            world.step();
          }
          accumulator -= FIXED_STEP;
          updateSimulationState();
        }

        updateMeshesFromPhysics();
        updateCamera();
        updateDebugLines();

        renderer.render(scene, camera);
        animationFrameId = requestAnimationFrame(animate);
      };

      animationFrameId = requestAnimationFrame(animate);

      cleanupFns.push(() => {
        cancelAnimationFrame(animationFrameId);
        renderer.dispose();
        scene.clear();
        if (renderer.domElement.parentElement) {
          renderer.domElement.parentElement.removeChild(renderer.domElement);
        }
        world.free();
      });
    };

    init();

    return () => {
      mounted = false;
      cleanupFns.forEach((fn) => fn());
    };
  }, []);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
});
