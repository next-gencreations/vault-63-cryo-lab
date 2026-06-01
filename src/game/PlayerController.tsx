import * as THREE from 'three';
import { MutableRefObject, useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { PointerLockControls } from '@react-three/drei';
import { TERMINALS_3D, INTERACT_RADIUS, PLAYER_SPEED, PLAYER_SPRINT, isInAllowedZone, detectRoom } from './constants';

interface Props {
  onNearTerminal: (id: string | null) => void;
  onLock: () => void;
  onUnlock: () => void;
  onRoomChange: (room: string) => void;
  paused: boolean;
  isMobile: boolean;
  cameraRotRef: MutableRefObject<{ yaw: number; pitch: number }>;
  moveInputRef: MutableRefObject<{ x: number; z: number }>;
  playerPosRef: MutableRefObject<{ x: number; z: number }>;
}

export function PlayerController({
  onNearTerminal, onLock, onUnlock, onRoomChange, paused,
  isMobile, cameraRotRef, moveInputRef, playerPosRef,
}: Props) {
  const { camera } = useThree();
  const keys       = useRef(new Set<string>());
  const plcRef     = useRef<any>(null);

  const lastNearest = useRef<string | null>(null);
  const lastRoom    = useRef<string>('cryolab');

  // Doom-style velocity with momentum
  const vel    = useRef(new THREE.Vector3());
  const target = useRef(new THREE.Vector3());
  const fwd    = useRef(new THREE.Vector3());
  const rgt    = useRef(new THREE.Vector3());
  const euler  = useRef(new THREE.Euler(0, 0, 0, 'YXZ'));
  const bobPhase = useRef(0);

  useEffect(() => {
    camera.position.set(0, 1.7, 9);
    if (isMobile) {
      cameraRotRef.current = { yaw: 0, pitch: 0 };
      camera.rotation.set(0, 0, 0, 'YXZ');
    } else {
      camera.lookAt(0, 1.7, -3);
    }
  }, [camera, isMobile, cameraRotRef]);

  useEffect(() => {
    if (isMobile) return;
    const down = (e: KeyboardEvent) => {
      keys.current.add(e.code);
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
    };
    const up = (e: KeyboardEvent) => keys.current.delete(e.code);
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, [isMobile]);

  useEffect(() => {
    if (!isMobile && paused && plcRef.current?.isLocked) plcRef.current.unlock();
  }, [paused, isMobile]);

  useFrame((_, delta) => {
    if (paused) return;

    const dt     = Math.min(delta, 0.05);
    const k      = keys.current;
    const sprint = k.has('ShiftLeft') || k.has('ShiftRight');
    const maxSpd = sprint ? PLAYER_SPRINT : PLAYER_SPEED;

    target.current.set(0, 0, 0);

    if (isMobile) {
      camera.rotation.set(cameraRotRef.current.pitch, cameraRotRef.current.yaw, 0, 'YXZ');
      const mx = moveInputRef.current.x;
      const mz = moveInputRef.current.z;
      if (mx !== 0 || mz !== 0) {
        const yaw = cameraRotRef.current.yaw;
        fwd.current.set(-Math.sin(yaw), 0, -Math.cos(yaw));
        rgt.current.set( Math.cos(yaw), 0, -Math.sin(yaw));
        target.current.addScaledVector(fwd.current, -mz);
        target.current.addScaledVector(rgt.current,  mx);
      }
    } else {
      if (!plcRef.current?.isLocked) {
        vel.current.lerp(new THREE.Vector3(), Math.min(1, dt * 18));
        return;
      }
      euler.current.setFromQuaternion(camera.quaternion, 'YXZ');
      const yaw = euler.current.y;
      fwd.current.set(-Math.sin(yaw), 0, -Math.cos(yaw));
      rgt.current.set( Math.cos(yaw), 0, -Math.sin(yaw));

      if (k.has('KeyW') || k.has('ArrowUp'))    target.current.add(fwd.current);
      if (k.has('KeyS') || k.has('ArrowDown'))  target.current.sub(fwd.current);
      if (k.has('KeyA') || k.has('ArrowLeft'))  target.current.sub(rgt.current);
      if (k.has('KeyD') || k.has('ArrowRight')) target.current.add(rgt.current);
    }

    // Doom-style: snap accelerate, smooth decelerate
    const moving = target.current.lengthSq() > 0.001;
    if (moving) target.current.normalize().multiplyScalar(maxSpd);
    vel.current.lerp(target.current, Math.min(1, dt * (moving ? 14 : 22)));

    // Slide-along-wall collision
    if (vel.current.lengthSq() > 0.01) {
      const move = vel.current.clone().multiplyScalar(dt);
      const cx = camera.position.x;
      const cz = camera.position.z;
      const nx = cx + move.x;
      const nz = cz + move.z;

      if      (isInAllowedZone(nx, nz)) { camera.position.x = nx; camera.position.z = nz; }
      else if (isInAllowedZone(nx, cz)) { camera.position.x = nx; }
      else if (isInAllowedZone(cx, nz)) { camera.position.z = nz; }
    }

    // Head-bob
    if (moving && vel.current.lengthSq() > 0.8) {
      bobPhase.current += dt * (sprint ? 14 : 9);
      camera.position.y = 1.7 + Math.sin(bobPhase.current) * 0.042;
    } else {
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, 1.7, dt * 12);
    }

    // Shared refs
    playerPosRef.current.x = camera.position.x;
    playerPosRef.current.z = camera.position.z;

    // Room detection
    const room = detectRoom(camera.position.x, camera.position.z);
    if (room !== lastRoom.current) {
      lastRoom.current = room;
      onRoomChange(room);
    }

    // Terminal proximity
    let nearest: string | null = null;
    let nearestDist = Infinity;
    for (const t of TERMINALS_3D) {
      const dx   = t.position[0] - camera.position.x;
      const dz   = t.position[2] - camera.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < INTERACT_RADIUS && dist < nearestDist) { nearest = t.id; nearestDist = dist; }
    }
    if (nearest !== lastNearest.current) { lastNearest.current = nearest; onNearTerminal(nearest); }
  });

  if (isMobile) return null;

  return (
    <PointerLockControls
      ref={plcRef}
      onLock={onLock}
      onUnlock={onUnlock}
      maxPolarAngle={Math.PI * 0.75}
      minPolarAngle={Math.PI * 0.25}
    />
  );
}
