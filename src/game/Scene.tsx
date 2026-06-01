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
      <ambientLight intensity={3.0} color="#d8e8f0" />

      <pointLight position={[0,  5.4, -8]} color="#d8f0ff" intensity={14} distance={26} decay={2} />
      <pointLight position={[-7, 5.4, -8]} color="#c8e4ff" intensity={10} distance={22} decay={2} />
      <pointLight position={[7,  5.4, -8]} color="#c8e4ff" intensity={10} distance={22} decay={2} />
      <pointLight position={[0,  5.4, 0]}  color="#d8f0ff" intensity={14} distance={26} decay={2} />
      <pointLight position={[-7, 5.4, 0]}  color="#c8e4ff" intensity={10} distance={22} decay={2} />
      <pointLight position={[7,  5.4, 0]}  color="#c8e4ff" intensity={10} distance={22} decay={2} />
      <pointLight position={[0,  5.4, 8]}  color="#d8f0ff" intensity={14} distance={26} decay={2} />
      <pointLight position={[-7, 5.4, 8]}  color="#c8e4ff" intensity={10} distance={22} decay={2} />
      <pointLight position={[7,  5.4, 8]}  color="#c8e4ff" intensity={10} distance={22} decay={2} />

      <pointLight position={[-12, 3, -12]} color="#aaccee" intensity={7} distance={22} decay={2} />
      <pointLight position={[12,  3, -12]} color="#aaccee" intensity={7} distance={22} decay={2} />
      <pointLight position={[-12, 3, 12]}  color="#aaccee" intensity={7} distance={22} decay={2} />
      <pointLight position={[12,  3, 12]}  color="#aaccee" intensity={7} distance={22} decay={2} />

      <pointLight position={[0,  2.5, -13]} color="#c0d8f0" intensity={5} distance={16} decay={2} />
      <pointLight position={[0,  2.5, 13]}  color="#c0d8f0" intensity={5} distance={16} decay={2} />
      <pointLight position={[-13, 2.5, 0]}  color="#c0d8f0" intensity={5} distance={16} decay={2} />
      <pointLight position={[13,  2.5, 0]}  color="#c0d8f0" intensity={5} distance={16} decay={2} />

      <pointLight position={[0, 1.1, -13]}  color="#ffd040" intensity={2.5} distance={14} decay={2} />
      <pointLight position={[0, 1.1, 13]}   color="#ffd040" intensity={2.5} distance={14} decay={2} />
      <pointLight position={[-13, 1.1, 0]}  color="#ffd040" intensity={2.5} distance={14} decay={2} />
      <pointLight position={[13, 1.1, 0]}   color="#ffd040" intensity={2.5} distance={14} decay={2} />

      <pointLight position={[13, 0.5, 4]}    color="#ff4400" intensity={2.5} distance={9}  decay={2} />
      <pointLight position={[-12, 0.5, -8]}  color="#00ffaa" intensity={1.8} distance={8}  decay={2} />
      <pointLight position={[12, 0.5, -8]}   color="#ffaa00" intensity={1.8} distance={8}  decay={2} />

      {/* Corridor lights — west (garden) — brighter, wider reach */}
      <pointLight position={[-15, 4.5, 0]} color="#44ff88" intensity={10} distance={14} decay={2} />
      <pointLight position={[-19, 4.0, 0]} color="#66ffaa" intensity={8}  distance={12} decay={2} />
      {/* Corridor lights — east (generator) */}
      <pointLight position={[15, 4.5, 0]}  color="#ffaa44" intensity={10} distance={14} decay={2} />
      <pointLight position={[19, 4.0, 0]}  color="#ffcc66" intensity={8}  distance={12} decay={2} />

      {/* Fog — pushed far enough to see into new rooms */}
      <fog attach="fog" args={['#0a1018', 44, 140]} />

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
