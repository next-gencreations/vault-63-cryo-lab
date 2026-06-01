import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { TradingData } from "./useTradingData";

type RoomId =
  | "cryo"
  | "medical"
  | "botanical"
  | "living"
  | "shower"
  | "armory"
  | "reactor"
  | "security"
  | "overseer"
  | "elevator";

type WeaponId = "pistol" | "shotgun" | "laser" | "plasma";

type EnemyType =
  | "FUD RAIDER"
  | "WHALE THIEF"
  | "LIQUIDATION GHOUL"
  | "RUG PULL BOSS"
  | "FLASH CRASH PHANTOM"
  | "CIRCUIT BREAKER";

type Enemy = {
  id: string;
  type: EnemyType;
  room: RoomId;
  position: [number, number, number];
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  stealValue: number;
  color: string;
  radius: number;
};

type Props = {
  open: boolean;
  onClose: () => void;
  tradingData: TradingData;
};

type RoomDef = {
  id: RoomId;
  label: string;
  short: string;
  position: [number, number, number];
  color: string;
  purpose: string;
};

const API_BASE =
  import.meta.env.VITE_API_BASE ||
  "https://coinbase-trader-bot-r39n.onrender.com";

const ROOMS: RoomDef[] = [
  { id: "cryo", label: "Cryo Bay", short: "CRYO", position: [0, 0, 0], color: "#00aaff", purpose: "Wake point and emergency defence." },
  { id: "medical", label: "Medical Bay", short: "MED", position: [0, 0, -22], color: "#00ff88", purpose: "Heal health and remove radiation." },
  { id: "botanical", label: "Botanical Lab", short: "BOT", position: [-18, 0, -44], color: "#33ff44", purpose: "Food production and recovery buffs." },
  { id: "living", label: "Living Quarters", short: "LIVE", position: [18, 0, -44], color: "#ffaa33", purpose: "Rest area and save point." },
  { id: "shower", label: "Shower Block", short: "SHOWER", position: [18, 0, -66], color: "#66ccff", purpose: "Decontamination and rad reduction." },
  { id: "armory", label: "Armory", short: "ARM", position: [-18, 0, -66], color: "#ffdd22", purpose: "Unlock pistol, shotgun, laser and plasma." },
  { id: "reactor", label: "Reactor", short: "REACTOR", position: [0, 0, -88], color: "#ffaa00", purpose: "Power core and vault shield." },
  { id: "security", label: "Security", short: "SEC", position: [-18, 0, -110], color: "#ff4444", purpose: "Raid tracking and defence upgrades." },
  { id: "overseer", label: "Overseer Office", short: "OVERSEER", position: [18, 0, -110], color: "#aa88ff", purpose: "Story missions and vault control." },
  { id: "elevator", label: "Surface Elevator", short: "EXIT", position: [0, 0, -132], color: "#ffffff", purpose: "End level extraction." },
];

const WEAPONS: Record<WeaponId, { name: string; damage: number; ammoUse: number; range: number; fireDelay: number }> = {
  pistol: { name: "10MM PISTOL", damage: 36, ammoUse: 1, range: 22, fireDelay: 220 },
  shotgun: { name: "COMBAT SHOTGUN", damage: 88, ammoUse: 3, range: 16, fireDelay: 520 },
  laser: { name: "LASER PISTOL", damage: 52, ammoUse: 2, range: 30, fireDelay: 300 },
  plasma: { name: "PLASMA RIFLE", damage: 76, ammoUse: 4, range: 26, fireDelay: 390 },
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function money(n: number) {
  return "$" + Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function nearestRoom(x: number, z: number): RoomDef {
  return ROOMS.reduce((best, room) => {
    const bd = Math.hypot(best.position[0] - x, best.position[2] - z);
    const rd = Math.hypot(room.position[0] - x, room.position[2] - z);
    return rd < bd ? room : best;
  }, ROOMS[0]);
}

function roomById(id: RoomId) {
  return ROOMS.find((r) => r.id === id) || ROOMS[0];
}

function randomRoomForEnemy(): RoomId {
  const enemyRooms: RoomId[] = ["medical", "botanical", "living", "armory", "reactor", "security", "overseer"];
  return enemyRooms[Math.floor(Math.random() * enemyRooms.length)];
}

function makeEnemy(difficulty: number, trading: TradingData): Enemy {
  const pnl = Number(trading.todayPnl || 0);
  const lossStreak = Number(trading.lossStreak || 0);
  const profitHeat = pnl > 0 ? pnl : 0;
  const roll = Math.random();

  let type: EnemyType = "FUD RAIDER";
  if (lossStreak >= 5 && roll > 0.62) type = "RUG PULL BOSS";
  else if (profitHeat > 80 && roll > 0.55) type = "WHALE THIEF";
  else if (lossStreak >= 3 && roll > 0.48) type = "LIQUIDATION GHOUL";
  else if (profitHeat > 35 && roll > 0.58) type = "FLASH CRASH PHANTOM";
  else if (difficulty > 8 && roll > 0.76) type = "CIRCUIT BREAKER";

  const room = randomRoomForEnemy();
  const r = roomById(room);
  const angle = Math.random() * Math.PI * 2;
  const dist = 5 + Math.random() * 3;
  const position: [number, number, number] = [r.position[0] + Math.cos(angle) * dist, 0, r.position[2] + Math.sin(angle) * dist];

  const base = { id: `${type}_${Date.now()}_${Math.random().toString(16).slice(2)}`, type, room, position };

  if (type === "RUG PULL BOSS") return { ...base, hp: 260 + difficulty * 24, maxHp: 260 + difficulty * 24, speed: 0.018 + difficulty * 0.002, damage: 18, stealValue: 25, color: "#ff2255", radius: 1.35 };
  if (type === "WHALE THIEF") return { ...base, hp: 130 + difficulty * 12, maxHp: 130 + difficulty * 12, speed: 0.025 + difficulty * 0.003, damage: 11, stealValue: 20, color: "#00aaff", radius: 1.1 };
  if (type === "LIQUIDATION GHOUL") return { ...base, hp: 90 + difficulty * 9, maxHp: 90 + difficulty * 9, speed: 0.038 + difficulty * 0.0035, damage: 14, stealValue: 12, color: "#ffaa00", radius: 0.95 };
  if (type === "FLASH CRASH PHANTOM") return { ...base, hp: 75 + difficulty * 7, maxHp: 75 + difficulty * 7, speed: 0.052 + difficulty * 0.004, damage: 8, stealValue: 18, color: "#ff1188", radius: 0.85 };
  if (type === "CIRCUIT BREAKER") return { ...base, hp: 160 + difficulty * 14, maxHp: 160 + difficulty * 14, speed: 0.022 + difficulty * 0.002, damage: 16, stealValue: 15, color: "#ffff00", radius: 1.05 };
  return { ...base, hp: 58 + difficulty * 7, maxHp: 58 + difficulty * 7, speed: 0.032 + difficulty * 0.003, damage: 7, stealValue: 7, color: "#39ff14", radius: 0.85 };
}

function MobileStick({ label, side, onMove }: { label: string; side: "left" | "right"; onMove: (x: number, y: number) => void }) {
  const baseRef = useRef<HTMLDivElement | null>(null);
  const activeRef = useRef<number | null>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });

  const reset = () => {
    activeRef.current = null;
    setKnob({ x: 0, y: 0 });
    onMove(0, 0);
  };

  const update = (clientX: number, clientY: number) => {
    const rect = baseRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = clamp(clientX - cx, -46, 46);
    const dy = clamp(clientY - cy, -46, 46);
    setKnob({ x: dx, y: dy });
    onMove(dx / 46, dy / 46);
  };

  return (
    <div ref={baseRef} onPointerDown={(e) => { activeRef.current = e.pointerId; (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId); update(e.clientX, e.clientY); }} onPointerMove={(e) => { if (activeRef.current === e.pointerId) update(e.clientX, e.clientY); }} onPointerUp={reset} onPointerCancel={reset} style={{ position: "fixed", bottom: 68, [side]: 20, width: 112, height: 112, borderRadius: "50%", border: "2px solid rgba(0,255,80,0.7)", background: "rgba(0,40,15,0.34)", zIndex: 1305, touchAction: "none", boxShadow: "0 0 25px rgba(0,255,80,0.28)" }}>
      <div style={{ position: "absolute", left: 39 + knob.x, top: 39 + knob.y, width: 34, height: 34, borderRadius: "50%", border: "3px solid #00ff66", background: "rgba(0,255,80,0.25)", boxShadow: "0 0 20px #00ff66" }} />
      <div style={{ position: "absolute", width: "100%", bottom: -28, textAlign: "center", color: "#00ff66", fontSize: 11, letterSpacing: 4 }}>{label}</div>
    </div>
  );
}

function CameraRig({ posRef, rotRef, moveRef, lookRef, currentRoomRef }: { posRef: React.MutableRefObject<{ x: number; z: number }>; rotRef: React.MutableRefObject<{ yaw: number; pitch: number }>; moveRef: React.MutableRefObject<{ x: number; y: number }>; lookRef: React.MutableRefObject<{ x: number; y: number }>; currentRoomRef: React.MutableRefObject<RoomId>; }) {
  const { camera, gl } = useThree();

  useEffect(() => {
    const onMouse = (e: MouseEvent) => {
      if (document.pointerLockElement === gl.domElement) {
        rotRef.current.yaw -= e.movementX * 0.0018;
        rotRef.current.pitch -= e.movementY * 0.0015;
        rotRef.current.pitch = clamp(rotRef.current.pitch, -0.72, 0.72);
      }
    };
    window.addEventListener("mousemove", onMouse);
    return () => window.removeEventListener("mousemove", onMouse);
  }, [gl.domElement, rotRef]);

  useFrame((_, delta) => {
    const move = moveRef.current;
    const look = lookRef.current;

    rotRef.current.yaw -= look.x * delta * 1.25;
    rotRef.current.pitch -= look.y * delta * 0.75;
    rotRef.current.pitch = clamp(rotRef.current.pitch, -0.72, 0.72);

    const speed = 9.2 * delta;
    const forward = -move.y;
    const strafe = move.x;
    const sin = Math.sin(rotRef.current.yaw);
    const cos = Math.cos(rotRef.current.yaw);

    posRef.current.x += (strafe * cos - forward * sin) * speed;
    posRef.current.z += (strafe * sin + forward * cos) * speed;

    posRef.current.x = clamp(posRef.current.x, -24, 24);
    posRef.current.z = clamp(posRef.current.z, -142, 8);

    const room = nearestRoom(posRef.current.x, posRef.current.z);
    currentRoomRef.current = room.id;

    camera.position.set(posRef.current.x, 1.62, posRef.current.z);
    camera.rotation.order = "YXZ";
    camera.rotation.y = rotRef.current.yaw;
    camera.rotation.x = rotRef.current.pitch;
  });

  return null;
}

function RoomShell({ room }: { room: RoomDef }) {
  const [x, , z] = room.position;
  const isGreen = room.id === "botanical";
  const isMedical = room.id === "medical";
  const isArmory = room.id === "armory";
  const isReactor = room.id === "reactor";

  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, -0.52, 0]} receiveShadow><boxGeometry args={[14, 0.12, 14]} /><meshStandardMaterial color={isGreen ? "#083015" : "#0a1620"} roughness={0.75} /></mesh>
      <mesh position={[0, 3.2, -7]} receiveShadow><boxGeometry args={[14, 6, 0.25]} /><meshStandardMaterial color="#06111a" emissive={room.color} emissiveIntensity={0.04} /></mesh>
      <mesh position={[0, 3.2, 7]} receiveShadow><boxGeometry args={[14, 6, 0.25]} /><meshStandardMaterial color="#06111a" emissive={room.color} emissiveIntensity={0.04} /></mesh>
      <mesh position={[-7, 3.2, 0]} receiveShadow><boxGeometry args={[0.25, 6, 14]} /><meshStandardMaterial color="#06111a" emissive={room.color} emissiveIntensity={0.04} /></mesh>
      <mesh position={[7, 3.2, 0]} receiveShadow><boxGeometry args={[0.25, 6, 14]} /><meshStandardMaterial color="#06111a" emissive={room.color} emissiveIntensity={0.04} /></mesh>
      <mesh position={[0, 6.1, 0]} receiveShadow><boxGeometry args={[14, 0.18, 14]} /><meshStandardMaterial color="#071017" /></mesh>
      <pointLight position={[0, 5.2, 0]} intensity={2.8} distance={20} color={room.color} />
      <pointLight position={[0, 3.8, 0]} intensity={1.6} distance={17} color="#ffffff" />
      <mesh position={[0, 5.9, 0]}><boxGeometry args={[6, 0.12, 2.1]} /><meshBasicMaterial color="#dff7ff" transparent opacity={0.9} /></mesh>
      <mesh position={[0, 0.02, -6.3]}><boxGeometry args={[10, 0.05, 0.18]} /><meshBasicMaterial color="#ffcc00" /></mesh>
      <mesh position={[0, 0.02, 6.3]}><boxGeometry args={[10, 0.05, 0.18]} /><meshBasicMaterial color="#ffcc00" /></mesh>
      <mesh position={[0, 2.4, -6.86]}><boxGeometry args={[7.5, 1.4, 0.08]} /><meshBasicMaterial color="#000807" transparent opacity={0.86} /></mesh>
      {isMedical && [-3, 0, 3].map((px) => (<group key={px} position={[px, 0.4, 2.5]}><mesh position={[0, 0.55, 0]}><boxGeometry args={[1.2, 1.1, 2.6]} /><meshStandardMaterial color="#11202b" emissive="#00ffff" emissiveIntensity={0.12} /></mesh><mesh position={[0, 1.25, -1.33]}><boxGeometry args={[1.1, 0.06, 0.12]} /><meshBasicMaterial color="#00ffff" /></mesh></group>))}
      {isGreen && [-4, -1.4, 1.4, 4].map((px) => (<group key={px} position={[px, 0, 2.8]}><mesh position={[0, 0.12, 0]}><boxGeometry args={[1.7, 0.24, 4]} /><meshStandardMaterial color="#143a12" emissive="#00ff44" emissiveIntensity={0.12} /></mesh><mesh position={[0, 0.7, 0]}><coneGeometry args={[0.45, 1.1, 8]} /><meshStandardMaterial color="#22dd44" emissive="#00ff44" emissiveIntensity={0.4} /></mesh></group>))}
      {isArmory && [-3.8, -1.2, 1.2, 3.8].map((px, i) => (<group key={px} position={[px, 1.5, 2.8]}><mesh><boxGeometry args={[1.8, 2.5, 0.35]} /><meshStandardMaterial color="#151515" emissive="#ffaa00" emissiveIntensity={0.08} /></mesh><mesh position={[0, 0.45, -0.25]}><boxGeometry args={[1.1, 0.15, 0.15]} /><meshBasicMaterial color={i === 0 ? "#ffaa00" : "#00ff66"} /></mesh></group>))}
      {isReactor && (<group position={[0, 1.8, 0]}><mesh><cylinderGeometry args={[1.7, 1.7, 4.2, 32]} /><meshStandardMaterial color="#081b20" emissive="#ffaa00" emissiveIntensity={0.45} /></mesh><mesh><torusGeometry args={[2.1, 0.08, 8, 48]} /><meshBasicMaterial color="#ffcc00" /></mesh><pointLight position={[0, 1.4, 0]} intensity={4} distance={18} color="#ffaa00" /></group>)}
    </group>
  );
}

function Corridor({ a, b }: { a: RoomDef; b: RoomDef }) {
  const ax = a.position[0]; const az = a.position[2]; const bx = b.position[0]; const bz = b.position[2];
  const mx = (ax + bx) / 2; const mz = (az + bz) / 2; const length = Math.hypot(bx - ax, bz - az); const angle = Math.atan2(bx - ax, bz - az);
  return (<group position={[mx, 0, mz]} rotation={[0, angle, 0]}><mesh position={[0, -0.54, 0]} receiveShadow><boxGeometry args={[5.6, 0.12, length]} /><meshStandardMaterial color="#08131c" /></mesh><mesh position={[-2.9, 2.3, 0]}><boxGeometry args={[0.22, 4.8, length]} /><meshStandardMaterial color="#06111a" /></mesh><mesh position={[2.9, 2.3, 0]}><boxGeometry args={[0.22, 4.8, length]} /><meshStandardMaterial color="#06111a" /></mesh><mesh position={[0, 4.9, 0]}><boxGeometry args={[5.8, 0.16, length]} /><meshStandardMaterial color="#050c12" /></mesh><mesh position={[0, 0.02, 0]}><boxGeometry args={[0.18, 0.05, length]} /><meshBasicMaterial color="#00ff44" transparent opacity={0.7} /></mesh>{Array.from({ length: Math.max(1, Math.floor(length / 7)) }).map((_, i) => (<pointLight key={i} position={[0, 4.2, -length / 2 + i * 7 + 3]} intensity={1.4} distance={10} color="#aee8ff" />))}</group>);
}

function DoorLabel({ room }: { room: RoomDef }) {
  const [x, , z] = room.position;
  return (<group position={[x, 2.15, z + 6.95]}><mesh><boxGeometry args={[5.4, 0.8, 0.08]} /><meshBasicMaterial color="#00180b" transparent opacity={0.92} /></mesh><mesh position={[0, -0.52, 0]}><boxGeometry args={[5.2, 0.08, 0.1]} /><meshBasicMaterial color={room.color} /></mesh></group>);
}

function EnemyModel({ enemy }: { enemy: Enemy }) {
  const ref = useRef<THREE.Group | null>(null);
  useFrame((state) => { if (ref.current) { ref.current.rotation.y += 0.018; ref.current.position.y = Math.sin(state.clock.elapsedTime * 4 + enemy.position[0]) * 0.08; } });
  return (<group ref={ref} position={enemy.position}><mesh castShadow><sphereGeometry args={[enemy.radius, 18, 18]} /><meshStandardMaterial color={enemy.color} emissive={enemy.color} emissiveIntensity={0.55} roughness={0.3} /></mesh><mesh position={[0, 1.45, 0]}><boxGeometry args={[1.7, 0.12, 0.08]} /><meshBasicMaterial color="#220000" /></mesh><mesh position={[-0.85 + (enemy.hp / enemy.maxHp) * 0.85, 1.45, 0.06]}><boxGeometry args={[1.7 * (enemy.hp / enemy.maxHp), 0.12, 0.08]} /><meshBasicMaterial color={enemy.color} /></mesh><pointLight intensity={1.2} distance={5} color={enemy.color} /></group>);
}

function VaultWorld({ enemies }: { enemies: Enemy[] }) {
  return (<><color attach="background" args={["#020604"]} /><fog attach="fog" args={["#020604", 22, 92]} /><ambientLight intensity={1.65} color="#99eaff" /><directionalLight position={[0, 12, 8]} intensity={2.2} color="#ffffff" />{ROOMS.map((room) => (<RoomShell key={room.id} room={room} />))}<Corridor a={roomById("cryo")} b={roomById("medical")} /><Corridor a={roomById("medical")} b={roomById("botanical")} /><Corridor a={roomById("medical")} b={roomById("living")} /><Corridor a={roomById("botanical")} b={roomById("armory")} /><Corridor a={roomById("living")} b={roomById("shower")} /><Corridor a={roomById("armory")} b={roomById("reactor")} /><Corridor a={roomById("shower")} b={roomById("reactor")} /><Corridor a={roomById("reactor")} b={roomById("security")} /><Corridor a={roomById("reactor")} b={roomById("overseer")} /><Corridor a={roomById("reactor")} b={roomById("elevator")} />{ROOMS.map((room) => (<DoorLabel key={`label-${room.id}`} room={room} />))}{enemies.map((e) => (<EnemyModel key={e.id} enemy={e} />))}</>);
}

function GunSprite({ weapon, firing }: { weapon: WeaponId; firing: boolean }) {
  const label = WEAPONS[weapon].name;
  return (<div style={{ position: "fixed", left: "50%", bottom: firing ? 48 : 38, transform: `translateX(-50%) scale(${firing ? 1.04 : 1})`, zIndex: 1300, width: 230, height: 190, pointerEvents: "none", transition: "bottom 80ms, transform 80ms" }}><div style={{ position: "absolute", left: 65, bottom: 0, width: 100, height: 128, background: "linear-gradient(90deg,#080808,#333,#080808)", clipPath: "polygon(34% 0, 66% 0, 82% 100%, 18% 100%)", border: "2px solid rgba(255,255,255,0.22)", boxShadow: firing ? "0 -25px 50px rgba(255,170,0,0.9)" : "0 0 25px rgba(0,0,0,0.7)" }} /><div style={{ position: "absolute", left: 89, bottom: 119, width: 52, height: weapon === "shotgun" ? 70 : 58, background: weapon === "plasma" ? "#004d36" : weapon === "laser" ? "#2b0000" : "#111", border: "2px solid #777", borderRadius: "10px 10px 4px 4px", boxShadow: weapon === "plasma" ? "0 0 22px #00ffaa" : weapon === "laser" ? "0 0 22px #ff4444" : "0 0 12px #aaa" }} />{firing && (<div style={{ position: "absolute", left: 82, bottom: 174, width: 66, height: 66, borderRadius: "50%", background: "radial-gradient(circle,#fff,#ffcc00,#ff3300,transparent 70%)", filter: "blur(1px)" }} />)}<div style={{ position: "absolute", left: 0, right: 0, bottom: 4, color: "#ffcc44", fontSize: 11, textAlign: "center", letterSpacing: 2, textShadow: "0 0 8px #000" }}>{label}</div></div>);
}

function Minimap({ currentRoom }: { currentRoom: RoomId }) {
  const scale = 1.4; const minX = -28; const minZ = 8;
  return (<div style={{ position: "fixed", top: 78, left: 12, zIndex: 1300, width: 135, height: 170, background: "rgba(0,12,4,0.58)", border: "1px solid rgba(0,255,80,0.45)", borderRadius: 10, boxShadow: "0 0 16px rgba(0,255,80,0.18)" }}>{ROOMS.map((r) => { const x = (r.position[0] - minX) * scale + 8; const y = (minZ - r.position[2]) * scale + 5; return (<div key={r.id} title={r.label} style={{ position: "absolute", left: x, top: y, width: currentRoom === r.id ? 14 : 10, height: currentRoom === r.id ? 14 : 10, borderRadius: 3, border: `1px solid ${r.color}`, background: currentRoom === r.id ? r.color : "rgba(0,0,0,0.3)", boxShadow: currentRoom === r.id ? `0 0 12px ${r.color}` : "none" }} />); })}<div style={{ position: "absolute", left: 8, bottom: 7, color: "#00ff66", fontSize: 9, letterSpacing: 1 }}>MAP · {roomById(currentRoom).short}</div></div>);
}

function TraderPanel({ tradingData, room, vaultGirlHp }: { tradingData: TradingData; room: RoomId; vaultGirlHp: number }) {
  const connected = tradingData.connected;
  const bpm = connected ? clamp(68 + Math.round(Math.abs(tradingData.todayPnl || 0) / 3), 62, 112) : 52;
  return (<div style={{ position: "fixed", right: 10, bottom: 182, zIndex: 1300, width: 154, padding: 8, border: "1px solid rgba(0,255,80,0.7)", borderRadius: 12, background: "rgba(0,18,8,0.62)", color: "#00ff66", fontSize: 10, letterSpacing: 1, boxShadow: "0 0 20px rgba(0,255,80,0.24)", pointerEvents: "none" }}><div style={{ display: "flex", gap: 6, alignItems: "center" }}><img src="/vaultgirl/vaultgirl_cryo.png" style={{ width: 46, height: 64, objectFit: "contain", filter: "drop-shadow(0 0 8px #00ff66)" }} /><div><div style={{ color: connected ? "#00ff66" : "#ff6666" }}>AI {connected ? "ONLINE" : "SYNC"}</div><div>♥ {bpm} BPM</div><div>HP {Math.round(vaultGirlHp)}%</div><div>{roomById(room).short}</div></div></div><div style={{ marginTop: 6, borderTop: "1px solid rgba(0,255,80,0.22)", paddingTop: 5 }}><div>EQ {money(tradingData.equity || 0)}</div><div style={{ color: (tradingData.todayPnl || 0) >= 0 ? "#00ff66" : "#ff6666" }}>PNL {money(tradingData.todayPnl || 0)}</div><div>TRADES {tradingData.trades || 0}</div></div></div>);
}

function BottomHud({ health, armor, ammo, kills, shield, weapon, room, stolen }: { health: number; armor: number; ammo: number; kills: number; shield: number; weapon: WeaponId; room: RoomId; stolen: number; }) {
  return (<div style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 1295, background: "rgba(0,10,4,0.9)", borderTop: "3px solid #00ff66", color: "#00ff66", fontFamily: "Courier New, monospace", padding: "7px 8px 10px", display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 5, textAlign: "center", letterSpacing: 1, fontSize: 11 }}><div>HEALTH<br /><b style={{ color: health < 30 ? "#ff5555" : "#00ff66", fontSize: 16 }}>{Math.round(health)}</b></div><div>ARMOR<br /><b style={{ fontSize: 16 }}>{Math.round(armor)}</b></div><div>AMMO<br /><b style={{ color: ammo < 12 ? "#ffaa00" : "#00ff66", fontSize: 16 }}>{ammo}</b></div><div>KILLS<br /><b style={{ fontSize: 16 }}>{kills}</b></div><div>SHIELD<br /><b style={{ fontSize: 16 }}>{Math.round(shield)}</b></div><div>ROOM<br /><b style={{ fontSize: 12 }}>{roomById(room).short}</b></div><div>LOST<br /><b style={{ color: stolen > 0 ? "#ff7777" : "#00ff66", fontSize: 13 }}>{money(stolen)}</b></div><div style={{ gridColumn: "1 / span 7", color: "#ffcc44", fontSize: 10, paddingTop: 3 }}>{WEAPONS[weapon].name} · API {API_BASE.replace("https://", "")}</div></div>);
}

export function VaultDoomFPS({ open, onClose, tradingData }: Props) {
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [health, setHealth] = useState(100);
  const [armor, setArmor] = useState(50);
  const [ammo, setAmmo] = useState(120);
  const [kills, setKills] = useState(0);
  const [shield, setShield] = useState(100);
  const [stolen, setStolen] = useState(0);
  const [weapon, setWeapon] = useState<WeaponId>("pistol");
  const [currentRoom, setCurrentRoom] = useState<RoomId>("cryo");
  const [message, setMessage] = useState("VAULT 63 FPS MODE · SECURE THE FACILITY");
  const [firing, setFiring] = useState(false);
  const [vaultGirlHp, setVaultGirlHp] = useState(100);
  const [unlocked, setUnlocked] = useState<Record<WeaponId, boolean>>({ pistol: true, shotgun: false, laser: false, plasma: false });

  const posRef = useRef({ x: 0, z: 0 });
  const rotRef = useRef({ yaw: 0, pitch: 0 });
  const moveRef = useRef({ x: 0, y: 0 });
  const lookRef = useRef({ x: 0, y: 0 });
  const currentRoomRef = useRef<RoomId>("cryo");
  const lastFireRef = useRef(0);

  const pnl = Number(tradingData.todayPnl || 0);
  const lossStreak = Number(tradingData.lossStreak || 0);

  const difficulty = useMemo(() => {
    const profitHeat = pnl > 0 ? Math.min(9, pnl / 14) : 0;
    const lossHeat = lossStreak * 1.35;
    const positionHeat = Number(tradingData.positions || 0) * 0.7;
    return clamp(1 + profitHeat + lossHeat + positionHeat, 1, 16);
  }, [pnl, lossStreak, tradingData.positions]);

  useEffect(() => { if (!open) return; const t = window.setInterval(() => setCurrentRoom(currentRoomRef.current), 250); return () => window.clearInterval(t); }, [open]);

  useEffect(() => {
    if (!open) return;
    const rate = pnl > 0 ? Math.max(1100, 3800 - difficulty * 190) : Math.max(2200, 5200 - difficulty * 120);
    const spawn = window.setInterval(() => {
      setEnemies((current) => {
        const max = pnl > 0 ? clamp(4 + Math.floor(difficulty), 5, 18) : clamp(2 + Math.floor(difficulty / 2), 2, 8);
        if (current.length >= max) return current;
        return [...current, makeEnemy(difficulty, tradingData)];
      });
    }, rate);
    return () => window.clearInterval(spawn);
  }, [open, pnl, difficulty, tradingData]);

  useEffect(() => {
    if (!open) return;
    const keys: Record<string, boolean> = {};
    const down = (e: KeyboardEvent) => { keys[e.code] = true; if (e.code === "Escape") onClose(); if (e.code === "Digit1") setWeapon("pistol"); if (e.code === "Digit2" && unlocked.shotgun) setWeapon("shotgun"); if (e.code === "Digit3" && unlocked.laser) setWeapon("laser"); if (e.code === "Digit4" && unlocked.plasma) setWeapon("plasma"); if (e.code === "Space") fire(); if (e.code === "KeyE") interact(); };
    const up = (e: KeyboardEvent) => { keys[e.code] = false; };
    const loop = window.setInterval(() => { const x = (keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0); const y = (keys.KeyS ? 1 : 0) - (keys.KeyW ? 1 : 0); if (Math.abs(moveRef.current.x) < 0.05 && Math.abs(moveRef.current.y) < 0.05) moveRef.current = { x, y }; }, 16);
    window.addEventListener("keydown", down); window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); window.clearInterval(loop); };
  }, [open, onClose, unlocked, weapon, ammo, enemies]);

  useEffect(() => {
    if (!open) return;
    const tick = window.setInterval(() => {
      setEnemies((current) => {
        let damage = 0; let stolenNow = 0;
        const next = current.map((enemy) => {
          const dx = posRef.current.x - enemy.position[0]; const dz = posRef.current.z - enemy.position[2]; const d = Math.max(0.1, Math.hypot(dx, dz));
          return { ...enemy, position: [enemy.position[0] + (dx / d) * enemy.speed, enemy.position[1], enemy.position[2] + (dz / d) * enemy.speed] as [number, number, number] };
        }).filter((enemy) => {
          const d = Math.hypot(posRef.current.x - enemy.position[0], posRef.current.z - enemy.position[2]);
          if (d < 1.4) { damage += enemy.damage; stolenNow += Math.min(Math.max(0, pnl), enemy.stealValue); return false; }
          return true;
        });
        if (damage > 0) {
          setArmor((a) => { const armorHit = Math.min(a, damage * 0.55); const hpHit = damage - armorHit; setHealth((h) => clamp(h - hpHit, 0, 100)); return clamp(a - armorHit, 0, 100); });
          setVaultGirlHp((v) => clamp(v - damage * 0.25, 0, 100));
          setMessage("VAULT BREACH · INVADER REACHED YOU");
        }
        if (stolenNow > 0) { setStolen((s) => s + stolenNow); setShield((s) => clamp(s - stolenNow * 0.7, 0, 100)); }
        return next;
      });
    }, 70);
    return () => window.clearInterval(tick);
  }, [open, pnl]);

  function interact() {
    const room = currentRoomRef.current;
    if (room === "medical") { setHealth(100); setArmor((a) => clamp(a + 10, 0, 100)); setMessage("MEDICAL BAY · HEALTH RESTORED"); }
    else if (room === "shower") { setVaultGirlHp((h) => clamp(h + 14, 0, 100)); setMessage("SHOWER BLOCK · DECONTAMINATION COMPLETE"); }
    else if (room === "botanical") { setShield((s) => clamp(s + 12, 0, 100)); setMessage("BOTANICAL LAB · FOOD SUPPLY IMPROVED"); }
    else if (room === "armory") { setUnlocked({ pistol: true, shotgun: true, laser: true, plasma: kills >= 10 || pnl > 50 }); setAmmo((a) => clamp(a + 55, 0, 220)); setWeapon(kills >= 10 || pnl > 50 ? "plasma" : "shotgun"); setMessage("ARMORY · WEAPONS UPDATED"); }
    else if (room === "reactor") { setShield(100); setMessage("REACTOR · VAULT SHIELD FULL POWER"); }
    else if (room === "security") { setEnemies((e) => e.slice(0, Math.max(0, e.length - 2))); setMessage("SECURITY · TWO HOSTILES PURGED"); }
    else if (room === "overseer") setMessage("OVERSEER OFFICE · MISSION: PROTECT PROFITS AND REACH SURFACE");
    else if (room === "elevator") setMessage("SURFACE ELEVATOR · LEVEL COMPLETE");
    else setMessage(`${roomById(room).label.toUpperCase()} · NO ACTION HERE`);
  }

  function fire() {
    const now = Date.now(); const w = WEAPONS[weapon];
    if (now - lastFireRef.current < w.fireDelay) return; lastFireRef.current = now;
    if (ammo < w.ammoUse) { setMessage("NO AMMO · FIND ARMORY"); return; }
    setAmmo((a) => Math.max(0, a - w.ammoUse)); setFiring(true); window.setTimeout(() => setFiring(false), 90);
    const yaw = rotRef.current.yaw; const forward = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw)); const origin = new THREE.Vector3(posRef.current.x, 0, posRef.current.z);
    let best: { enemy: Enemy; score: number; dist: number } | null = null;
    for (const enemy of enemies) {
      const target = new THREE.Vector3(enemy.position[0], 0, enemy.position[2]); const to = target.clone().sub(origin); const dist = to.length(); const dir = to.normalize(); const aim = forward.dot(dir); const angleWindow = weapon === "shotgun" ? 0.78 : 0.92;
      if (dist <= w.range && aim > angleWindow) { const score = aim * 100 - dist; if (!best || score > best.score) best = { enemy, score, dist }; }
    }
    if (!best) { setMessage("SHOT MISSED"); return; }
    const falloff = clamp(1 - best.dist / (w.range * 1.35), 0.42, 1); const damage = Math.round(w.damage * falloff);
    setEnemies((current) => current.flatMap((enemy) => {
      if (enemy.id !== best!.enemy.id) return [enemy];
      const hp = enemy.hp - damage;
      if (hp <= 0) { setKills((k) => k + 1); setShield((s) => clamp(s + 3, 0, 100)); if (Math.random() > 0.54) setAmmo((a) => clamp(a + 7, 0, 220)); setMessage(`${enemy.type} DESTROYED · PROFIT SECURED`); return []; }
      setMessage(`${enemy.type} HIT · ${hp} HP`); return [{ ...enemy, hp }];
    }));
  }

  if (!open) return null;
  const room = currentRoom;

  return (<div style={{ position: "fixed", inset: 0, zIndex: 1200, background: "#000", overflow: "hidden", fontFamily: "'Share Tech Mono', 'Courier New', monospace", touchAction: "none" }}><Canvas camera={{ fov: 76, near: 0.1, far: 180, position: [0, 1.6, 4] }} gl={{ antialias: true, powerPreference: "high-performance" }} shadows onPointerDown={(e) => { if ((e.target as HTMLElement).tagName !== "BUTTON") (e.currentTarget as HTMLCanvasElement).requestPointerLock?.(); }}><CameraRig posRef={posRef} rotRef={rotRef} moveRef={moveRef} lookRef={lookRef} currentRoomRef={currentRoomRef} /><VaultWorld enemies={enemies} /></Canvas><div style={{ position: "fixed", top: 8, left: 12, right: 12, zIndex: 1302, pointerEvents: "none", color: "#00ff66", display: "flex", justifyContent: "space-between", gap: 10, fontSize: 12, letterSpacing: 2, textShadow: "0 0 8px #00ff66" }}><div><div style={{ fontSize: 23, color: "#00ff66" }}>VAULT 63 FPS</div><div style={{ color: "#ffcc44" }}>{roomById(room).label.toUpperCase()} · DIFFICULTY {difficulty.toFixed(1)}</div></div><div style={{ textAlign: "right", color: tradingData.connected ? "#00ff66" : "#ff6666" }}><div>TRADER {tradingData.connected ? "ONLINE" : "SYNCING"}</div><div style={{ color: (pnl || 0) >= 0 ? "#ffcc44" : "#ff7777" }}>PNL {money(pnl)}</div></div></div><Minimap currentRoom={room} /><TraderPanel tradingData={tradingData} room={room} vaultGirlHp={vaultGirlHp} /><GunSprite weapon={weapon} firing={firing} /><BottomHud health={health} armor={armor} ammo={ammo} kills={kills} shield={shield} weapon={weapon} room={room} stolen={stolen} /><div style={{ position: "fixed", left: "50%", top: "50%", transform: "translate(-50%,-50%)", width: 18, height: 18, zIndex: 1304, pointerEvents: "none" }}><div style={{ position: "absolute", left: 8, top: 0, width: 2, height: 18, background: "#00ff66", boxShadow: "0 0 8px #00ff66" }} /><div style={{ position: "absolute", left: 0, top: 8, width: 18, height: 2, background: "#00ff66", boxShadow: "0 0 8px #00ff66" }} /></div><div style={{ position: "fixed", left: "50%", bottom: 170, transform: "translateX(-50%)", zIndex: 1304, color: "#ffcc44", background: "rgba(0,8,3,0.62)", border: "1px solid rgba(255,204,68,0.4)", borderRadius: 8, padding: "7px 10px", fontSize: 11, letterSpacing: 2, textAlign: "center", maxWidth: "88vw", pointerEvents: "none" }}>{message}<br /><span style={{ color: "#00ff66" }}>E = USE ROOM · FIRE = SHOOT · ARMORY UNLOCKS WEAPONS</span></div><MobileStick label="MOVE" side="left" onMove={(x, y) => (moveRef.current = { x, y })} /><MobileStick label="LOOK" side="right" onMove={(x, y) => (lookRef.current = { x, y })} /><button onClick={fire} style={{ position: "fixed", right: 26, bottom: 70, zIndex: 1310, width: 84, height: 84, borderRadius: "50%", border: "3px solid #ffcc44", background: "rgba(80,20,0,0.72)", color: "#ffcc44", fontSize: 14, letterSpacing: 2, fontWeight: 900, boxShadow: "0 0 30px rgba(255,170,0,0.5)", touchAction: "manipulation" }}>FIRE</button><button onClick={interact} style={{ position: "fixed", left: "50%", bottom: 112, transform: "translateX(-50%)", zIndex: 1310, minWidth: 138, border: "2px solid #00ff66", borderRadius: 10, background: "rgba(0,30,10,0.74)", color: "#00ff66", padding: "12px 18px", fontSize: 13, letterSpacing: 3, fontWeight: 800, touchAction: "manipulation" }}>USE ROOM</button><div style={{ position: "fixed", top: 72, right: 12, zIndex: 1311, display: "grid", gap: 6 }}>{(["pistol", "shotgun", "laser", "plasma"] as WeaponId[]).map((w, i) => (<button key={w} disabled={!unlocked[w]} onClick={() => unlocked[w] && setWeapon(w)} style={{ border: `1px solid ${weapon === w ? "#ffcc44" : "rgba(0,255,80,0.45)"}`, background: weapon === w ? "rgba(255,170,0,0.22)" : "rgba(0,20,8,0.62)", color: unlocked[w] ? (weapon === w ? "#ffcc44" : "#00ff66") : "#336644", borderRadius: 7, padding: "6px 8px", fontSize: 10, letterSpacing: 1, touchAction: "manipulation" }}>{i + 1} {WEAPONS[w].name.split(" ")[0]}</button>))}</div><button onClick={onClose} style={{ position: "fixed", top: 10, right: 10, zIndex: 1320, background: "rgba(40,0,0,0.82)", border: "2px solid #ff5555", color: "#ff8888", padding: "10px 16px", borderRadius: 10, fontSize: 13, letterSpacing: 3, fontWeight: 800, touchAction: "manipulation" }}>EXIT</button></div>);
}

export default VaultDoomFPS;
