import { MutableRefObject, Suspense } from 'react';
import { Room } from './Room';
import { GardenRoom } from './GardenRoom';
import { GeneratorRoom } from './GeneratorRoom';
import { CryoTube3D } from './CryoTube3D';
import { Terminal3D } from './Terminal3D';
import { PlayerController } from './PlayerController';
import { TERMINALS_3D } from './constants';

interface Props {
  introStep: number;
  nearbyTerminal: string | null;
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

export function Scene({
  introStep, nearbyTerminal, onNearTerminal, onLock, onUnlock, onRoomChange, paused,
  isMobile, cameraRotRef, moveInputRef, playerPosRef,
}: Props) {
  return (
    <>
      {/* ── Main cryo lab lights ── */}
      <ambientLight intensity={1.1} color="#d8e8f0" />

      <pointLight position={[0,  5.4, -8]} color="#d8f0ff" intensity={8.0} distance={22} decay={2} />
      <pointLight position={[-7, 5.4, -8]} color="#c8e4ff" intensity={6.0} distance={18} decay={2} />
      <pointLight position={[7,  5.4, -8]} color="#c8e4ff" intensity={6.0} distance={18} decay={2} />
      <pointLight position={[0,  5.4, 0]}  color="#d8f0ff" intensity={8.0} distance={22} decay={2} />
      <pointLight position={[-7, 5.4, 0]}  color="#c8e4ff" intensity={6.0} distance={18} decay={2} />
      <pointLight position={[7,  5.4, 0]}  color="#c8e4ff" intensity={6.0} distance={18} decay={2} />
      <pointLight position={[0,  5.4, 8]}  color="#d8f0ff" intensity={8.0} distance={22} decay={2} />
      <pointLight position={[-7, 5.4, 8]}  color="#c8e4ff" intensity={6.0} distance={18} decay={2} />
      <pointLight position={[7,  5.4, 8]}  color="#c8e4ff" intensity={6.0} distance={18} decay={2} />

      <pointLight position={[-12, 3, -12]} color="#aaccee" intensity={4.0} distance={18} decay={2} />
      <pointLight position={[12,  3, -12]} color="#aaccee" intensity={4.0} distance={18} decay={2} />
      <pointLight position={[-12, 3, 12]}  color="#aaccee" intensity={4.0} distance={18} decay={2} />
      <pointLight position={[12,  3, 12]}  color="#aaccee" intensity={4.0} distance={18} decay={2} />

      <pointLight position={[0,  2.5, -13]} color="#c0d8f0" intensity={3.0} distance={12} decay={2} />
      <pointLight position={[0,  2.5, 13]}  color="#c0d8f0" intensity={3.0} distance={12} decay={2} />
      <pointLight position={[-13, 2.5, 0]}  color="#c0d8f0" intensity={3.0} distance={12} decay={2} />
      <pointLight position={[13,  2.5, 0]}  color="#c0d8f0" intensity={3.0} distance={12} decay={2} />

      <pointLight position={[0, 1.1, -13]}  color="#ffd040" intensity={1.4} distance={12} decay={2} />
      <pointLight position={[0, 1.1, 13]}   color="#ffd040" intensity={1.4} distance={12} decay={2} />
      <pointLight position={[-13, 1.1, 0]}  color="#ffd040" intensity={1.4} distance={12} decay={2} />
      <pointLight position={[13, 1.1, 0]}   color="#ffd040" intensity={1.4} distance={12} decay={2} />

      <pointLight position={[13, 0.5, 4]}    color="#ff4400" intensity={1.4} distance={7}  decay={2} />
      <pointLight position={[-12, 0.5, -8]}  color="#00ffaa" intensity={0.9} distance={6}  decay={2} />
      <pointLight position={[12, 0.5, -8]}   color="#ffaa00" intensity={0.9} distance={6}  decay={2} />

      {/* Corridor lights — west (garden) */}
      <pointLight position={[-18, 4.5, 0]} color="#44ff88" intensity={3} distance={10} decay={2} />
      {/* Corridor lights — east (generator) */}
      <pointLight position={[18, 4.5, 0]}  color="#ffaa44" intensity={3} distance={10} decay={2} />

      {/* Fog — extended for multi-room world */}
      <fog attach="fog" args={['#0a1018', 28, 80]} />

      <Suspense fallback={null}>
        <Room />
        <GardenRoom />
        <GeneratorRoom />
        <CryoTube3D introStep={introStep} />
      </Suspense>

      {TERMINALS_3D.map(t => (
        <Terminal3D key={t.id} terminal={t} isNearby={nearbyTerminal === t.id} />
      ))}

      <PlayerController
        onNearTerminal={onNearTerminal}
        onLock={onLock}
        onUnlock={onUnlock}
        onRoomChange={onRoomChange}
        paused={paused}
        isMobile={isMobile}
        cameraRotRef={cameraRotRef}
        moveInputRef={moveInputRef}
        playerPosRef={playerPosRef}
      />
    </>
  );
}
