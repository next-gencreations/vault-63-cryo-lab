import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { TradingData } from "./useTradingData";

type RoomId = "cryo" | "medical" | "botanical" | "living" | "shower" | "armory" | "reactor" | "security" | "elevator";
type WeaponId = "pistol" | "shotgun" | "laser" | "plasma";
type EnemyType = "FUD RAIDER" | "WHALE THIEF" | "LIQUIDATION GHOUL" | "RUG PULL BOSS";

type RoomDef = {
  id: RoomId;
  label: string;
  short: string;
  pos: [number, number, number];
  color: string;
};

type Enemy = {
  id: string;
  type: EnemyType;
  position: [number, number, number];
  hp: number;
  maxHp: number;
  speed: number;
  color: string;
  steal: number;
};

type Props = {
  open: boolean;
  onClose: () => void;
  tradingData: TradingData;
};

const API_BASE = import.meta.env.VITE_API_BASE || "https://coinbase-trader-bot-r39n.onrender.com";

const ROOMS: RoomDef[] = [
  { id: "cryo", label: "Cryo Bay", short: "CRYO", pos: [0, 0, 0], color: "#00aaff" },
  { id: "medical", label: "Medical Bay", short: "MED", pos: [0, 0, -22], color: "#00ff88" },
  { id: "botanical", label: "Botanical Lab", short: "BOT", pos: [-18, 0, -44], color: "#33ff44" },
  { id: "living", label: "Living Quarters", short: "LIVE", pos: [18, 0, -44], color: "#ffaa33" },
  { id: "shower", label: "Shower Block", short: "SHOWER", pos: [18, 0, -66], color: "#66ccff" },
  { id: "armory", label: "Armory", short: "ARM", pos: [-18, 0, -66], color: "#ffcc22" },
  { id: "reactor", label: "Reactor", short: "REACTOR", pos: [0, 0, -88], color: "#ffaa00" },
  { id: "security", label: "Security", short: "SEC", pos: [-18, 0, -110], color: "#ff5555" },
  { id: "elevator", label: "Surface Elevator", short: "EXIT", pos: [0, 0, -132], color: "#ffffff" },
];

const WEAPONS: Record<WeaponId, { name: string; damage: number; ammoUse: number; range: number; delay: number }> = {
  pistol: { name: "10MM", damage: 36, ammoUse: 1, range: 22, delay: 220 },
  shotgun: { name: "SHOTGUN", damage: 88, ammoUse: 3, range: 16, delay: 520 },
  laser: { name: "LASER", damage: 54, ammoUse: 2, range: 30, delay: 300 },
  plasma: { name: "PLASMA", damage: 78, ammoUse: 4, range: 26, delay: 390 },
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function num(v: unknown) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function money(v: unknown) {
  const n = num(v);
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function getPnl(t: TradingData) {
  const anyT = t as any;
  return num(anyT.todayPnl ?? anyT.pnlToday ?? anyT.today_pnl ?? 0);
}

function getRoom(x: number, z: number) {
  return ROOMS.reduce((best, room) => {
    const bd = Math.hypot(best.pos[0] - x, best.pos[2] - z);
    const rd = Math.hypot(room.pos[0] - x, room.pos[2] - z);
    return rd < bd ? room : best;
  }, ROOMS[0]);
}

function makeEnemy(difficulty: number, tradingData: TradingData): Enemy {
  const pnl = getPnl(tradingData);
  const lossStreak = num((tradingData as any).lossStreak);
  const roll = Math.random();
  let type: EnemyType = "FUD RAIDER";
  if (lossStreak >= 4 && roll > 0.72) type = "RUG PULL BOSS";
  else if (pnl > 50 && roll > 0.58) type = "WHALE THIEF";
  else if (lossStreak >= 2 && roll > 0.55) type = "LIQUIDATION GHOUL";

  const room = ROOMS[Math.floor(Math.random() * (ROOMS.length - 2)) + 1];
  const px = room.pos[0] + (Math.random() - 0.5) * 8;
  const pz = room.pos[2] + (Math.random() - 0.5) * 8;

  if (type === "RUG PULL BOSS") return { id: crypto.randomUUID(), type, position: [px, 0, pz], hp: 260 + difficulty * 22, maxHp: 260 + difficulty * 22, speed: 1.0, color: "#ff2255", steal: 24 };
  if (type === "WHALE THIEF") return { id: crypto.randomUUID(), type, position: [px, 0, pz], hp: 135 + difficulty * 10, maxHp: 135 + difficulty * 10, speed: 1.45, color: "#00aaff", steal: 18 };
  if (type === "LIQUIDATION GHOUL") return { id: crypto.randomUUID(), type, position: [px, 0, pz], hp: 95 + difficulty * 8, maxHp: 95 + difficulty * 8, speed: 1.75, color: "#ffaa00", steal: 12 };
  return { id: crypto.randomUUID(), type, position: [px, 0, pz], hp: 62 + difficulty * 7, maxHp: 62 + difficulty * 7, speed: 1.55, color: "#39ff14", steal: 7 };
}

function RoomShell({ room }: { room: RoomDef }) {
  const [x, , z] = room.pos;
  const isBotanical = room.id === "botanical";
  const isReactor = room.id === "reactor";
  const isArmory = room.id === "armory";

  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, -0.52, 0]} receiveShadow>
        <boxGeometry args={[14, 0.12, 14]} />
        <meshStandardMaterial color={isBotanical ? "#0b3218" : "#112332"} roughness={0.75} />
      </mesh>

      <mesh position={[0, 3.05, -7]} receiveShadow><boxGeometry args={[14, 5.8, 0.25]} /><meshStandardMaterial color="#0b1c2a" emissive={room.color} emissiveIntensity={0.08} /></mesh>
      <mesh position={[0, 3.05, 7]} receiveShadow><boxGeometry args={[14, 5.8, 0.25]} /><meshStandardMaterial color="#0b1c2a" emissive={room.color} emissiveIntensity={0.08} /></mesh>
      <mesh position={[-7, 3.05, 0]} receiveShadow><boxGeometry args={[0.25, 5.8, 14]} /><meshStandardMaterial color="#0b1c2a" emissive={room.color} emissiveIntensity={0.06} /></mesh>
      <mesh position={[7, 3.05, 0]} receiveShadow><boxGeometry args={[0.25, 5.8, 14]} /><meshStandardMaterial color="#0b1c2a" emissive={room.color} emissiveIntensity={0.06} /></mesh>
      <mesh position={[0, 6, 0]} receiveShadow><boxGeometry args={[14, 0.18, 14]} /><meshStandardMaterial color="#0b1720" /></mesh>

      <pointLight position={[0, 5.15, 0]} intensity={5.2} distance={22} color="#ffffff" />
      <pointLight position={[0, 3.6, 0]} intensity={2.4} distance={20} color={room.color} />
      <mesh position={[0, 5.88, 0]}><boxGeometry args={[6.5, 0.12, 2.4]} /><meshBasicMaterial color="#efffff" /></mesh>
      <mesh position={[0, 0.03, -6.2]}><boxGeometry args={[10.5, 0.06, 0.18]} /><meshBasicMaterial color="#ffcc00" /></mesh>
      <mesh position={[0, 0.03, 6.2]}><boxGeometry args={[10.5, 0.06, 0.18]} /><meshBasicMaterial color="#ffcc00" /></mesh>

      <mesh position={[0, 2.5, -6.86]}>
        <boxGeometry args={[7.8, 1.3, 0.08]} />
        <meshBasicMaterial color="#00110a" transparent opacity={0.9} />
      </mesh>
      <mesh position={[0, 2.72, -6.91]}>
        <planeGeometry args={[7.3, 1]} />
        <meshBasicMaterial color={room.color} transparent opacity={0.18} />
      </mesh>

      {isBotanical && [-4, -1.4, 1.4, 4].map((px) => (
        <group key={px} position={[px, 0, 2.4]}>
          <mesh position={[0, 0.12, 0]}><boxGeometry args={[1.6, 0.24, 3.8]} /><meshStandardMaterial color="#143a12" emissive="#00ff44" emissiveIntensity={0.18} /></mesh>
          <mesh position={[0, 0.75, 0]}><coneGeometry args={[0.5, 1.15, 8]} /><meshStandardMaterial color="#22dd44" emissive="#00ff44" emissiveIntensity={0.55} /></mesh>
        </group>
      ))}

      {isArmory && [-3.2, -1.05, 1.05, 3.2].map((px, i) => (
        <group key={px} position={[px, 1.6, 2.7]}>
          <mesh><boxGeometry args={[1.6, 2.4, 0.35]} /><meshStandardMaterial color="#151515" emissive="#ffaa00" emissiveIntensity={0.12} /></mesh>
          <mesh position={[0, 0.42, -0.25]}><boxGeometry args={[1.05, 0.14, 0.14]} /><meshBasicMaterial color={i === 0 ? "#ffaa00" : "#00ff66"} /></mesh>
        </group>
      ))}

      {isReactor && (
        <group position={[0, 1.8, 0]}>
          <mesh><cylinderGeometry args={[1.8, 1.8, 4.2, 32]} /><meshStandardMaterial color="#081b20" emissive="#ffaa00" emissiveIntensity={0.6} /></mesh>
          <mesh><torusGeometry args={[2.25, 0.08, 8, 48]} /><meshBasicMaterial color="#ffcc00" /></mesh>
          <pointLight position={[0, 1.6, 0]} intensity={6} distance={20} color="#ffaa00" />
        </group>
      )}
    </group>
  );
}

function Corridor({ a, b }: { a: RoomDef; b: RoomDef }) {
  const ax = a.pos[0]; const az = a.pos[2]; const bx = b.pos[0]; const bz = b.pos[2];
  const mx = (ax + bx) / 2; const mz = (az + bz) / 2;
  const dx = bx - ax; const dz = bz - az;
  const len = Math.hypot(dx, dz);
  const angle = Math.atan2(dx, dz);
  return (
    <group position={[mx, 0, mz]} rotation={[0, angle, 0]}>
      <mesh position={[0, -0.5, 0]} receiveShadow><boxGeometry args={[4.2, 0.12, len]} /><meshStandardMaterial color="#132532" /></mesh>
      <mesh position={[-2.1, 2.3, 0]}><boxGeometry args={[0.16, 4.5, len]} /><meshStandardMaterial color="#091a26" emissive="#0088ff" emissiveIntensity={0.05} /></mesh>
      <mesh position={[2.1, 2.3, 0]}><boxGeometry args={[0.16, 4.5, len]} /><meshStandardMaterial color="#091a26" emissive="#0088ff" emissiveIntensity={0.05} /></mesh>
      <mesh position={[0, 4.7, 0]}><boxGeometry args={[4.2, 0.14, len]} /><meshStandardMaterial color="#09121b" /></mesh>
      <pointLight position={[0, 3.8, 0]} intensity={1.8} distance={Math.max(12, len)} color="#dff7ff" />
      <mesh position={[0, 0.02, 0]}><boxGeometry args={[0.18, 0.05, len]} /><meshBasicMaterial color="#00ff55" transparent opacity={0.72} /></mesh>
    </group>
  );
}

function EnemyMesh({ enemy }: { enemy: Enemy }) {
  return (
    <group position={enemy.position}>
      <mesh position={[0, 0.75, 0]} castShadow>
        <boxGeometry args={[1.1, 1.5, 0.42]} />
        <meshStandardMaterial color="#161616" emissive={enemy.color} emissiveIntensity={0.45} />
      </mesh>
      <mesh position={[0, 1.75, 0]} castShadow>
        <sphereGeometry args={[0.42, 14, 14]} />
        <meshStandardMaterial color={enemy.color} emissive={enemy.color} emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[0, 2.35, 0]}>
        <planeGeometry args={[1.4, 0.16]} />
        <meshBasicMaterial color="#220000" transparent opacity={0.8} />
      </mesh>
      <mesh position={[(-1 + enemy.hp / enemy.maxHp) * 0.35, 2.36, 0.03]}>
        <planeGeometry args={[clamp(enemy.hp / enemy.maxHp, 0, 1) * 1.35, 0.14]} />
        <meshBasicMaterial color={enemy.color} />
      </mesh>
    </group>
  );
}

function CameraRig({ posRef, rotRef, moveRef, lookRef, currentRoomRef }: {
  posRef: React.MutableRefObject<{ x: number; z: number }>;
  rotRef: React.MutableRefObject<{ yaw: number; pitch: number }>;
  moveRef: React.MutableRefObject<{ x: number; y: number }>;
  lookRef: React.MutableRefObject<{ x: number; y: number }>;
  currentRoomRef: React.MutableRefObject<RoomId>;
}) {
  const { camera, gl } = useThree();

  useEffect(() => {
    const onMouse = (e: MouseEvent) => {
      if (document.pointerLockElement === gl.domElement) {
        rotRef.current.yaw -= e.movementX * 0.0016;
        rotRef.current.pitch -= e.movementY * 0.0012;
        rotRef.current.pitch = clamp(rotRef.current.pitch, -0.68, 0.68);
      }
    };
    window.addEventListener("mousemove", onMouse);
    return () => window.removeEventListener("mousemove", onMouse);
  }, [gl.domElement, rotRef]);

  useFrame((_, delta) => {
    rotRef.current.yaw -= lookRef.current.x * delta * 0.95;
    rotRef.current.pitch -= lookRef.current.y * delta * 0.55;
    rotRef.current.pitch = clamp(rotRef.current.pitch, -0.68, 0.68);

    const speed = 7.1 * delta;
    const forward = -moveRef.current.y;
    const strafe = moveRef.current.x;
    const sin = Math.sin(rotRef.current.yaw);
    const cos = Math.cos(rotRef.current.yaw);

    posRef.current.x += (strafe * cos - forward * sin) * speed;
    posRef.current.z += (strafe * sin + forward * cos) * speed;
    posRef.current.x = clamp(posRef.current.x, -25, 25);
    posRef.current.z = clamp(posRef.current.z, -140, 8);

    currentRoomRef.current = getRoom(posRef.current.x, posRef.current.z).id;

    camera.position.set(posRef.current.x, 1.62, posRef.current.z);
    camera.rotation.order = "YXZ";
    camera.rotation.y = rotRef.current.yaw;
    camera.rotation.x = rotRef.current.pitch;
  });

  return null;
}

function World({ enemies, posRef, rotRef, moveRef, lookRef, currentRoomRef }: {
  enemies: Enemy[];
  posRef: React.MutableRefObject<{ x: number; z: number }>;
  rotRef: React.MutableRefObject<{ yaw: number; pitch: number }>;
  moveRef: React.MutableRefObject<{ x: number; y: number }>;
  lookRef: React.MutableRefObject<{ x: number; y: number }>;
  currentRoomRef: React.MutableRefObject<RoomId>;
}) {
  return (
    <>
      <color attach="background" args={["#07121b"]} />
      <ambientLight intensity={1.3} color="#bfefff" />
      <hemisphereLight intensity={1.1} color="#bfefff" groundColor="#081010" />
      <directionalLight position={[12, 18, 8]} intensity={1.8} color="#ffffff" castShadow />
      <CameraRig posRef={posRef} rotRef={rotRef} moveRef={moveRef} lookRef={lookRef} currentRoomRef={currentRoomRef} />
      {ROOMS.map((room) => <RoomShell key={room.id} room={room} />)}
      <Corridor a={ROOMS[0]} b={ROOMS[1]} />
      <Corridor a={ROOMS[1]} b={ROOMS[2]} />
      <Corridor a={ROOMS[1]} b={ROOMS[3]} />
      <Corridor a={ROOMS[2]} b={ROOMS[5]} />
      <Corridor a={ROOMS[3]} b={ROOMS[4]} />
      <Corridor a={ROOMS[5]} b={ROOMS[6]} />
      <Corridor a={ROOMS[4]} b={ROOMS[6]} />
      <Corridor a={ROOMS[6]} b={ROOMS[7]} />
      <Corridor a={ROOMS[6]} b={ROOMS[8]} />
      {enemies.map((enemy) => <EnemyMesh key={enemy.id} enemy={enemy} />)}
    </>
  );
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
    const dx = clamp(clientX - cx, -38, 38);
    const dy = clamp(clientY - cy, -38, 38);
    setKnob({ x: dx, y: dy });
    onMove(dx / 38, dy / 38);
  };

  return (
    <div ref={baseRef} onPointerDown={(e) => { activeRef.current = e.pointerId; (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId); update(e.clientX, e.clientY); }} onPointerMove={(e) => { if (activeRef.current === e.pointerId) update(e.clientX, e.clientY); }} onPointerUp={reset} onPointerCancel={reset} style={{ position: "fixed", bottom: 74, [side]: 20, width: 96, height: 96, borderRadius: "50%", border: "2px solid rgba(0,255,90,0.8)", background: "rgba(0,35,20,0.32)", zIndex: 1305, touchAction: "none", boxShadow: "0 0 18px rgba(0,255,90,0.25)" }}>
      <div style={{ position: "absolute", left: 31 + knob.x, top: 31 + knob.y, width: 34, height: 34, borderRadius: "50%", border: "3px solid #00ff66", background: "rgba(0,255,90,0.24)", boxShadow: "0 0 16px #00ff66" }} />
      <div style={{ position: "absolute", width: "100%", bottom: -24, textAlign: "center", color: "#00ff66", fontSize: 10, letterSpacing: 3 }}>{label}</div>
    </div>
  );
}

function WeaponSprite({ weapon, flash }: { weapon: WeaponId; flash: boolean }) {
  const label = WEAPONS[weapon].name;
  return (
    <div style={{ position: "fixed", left: "50%", bottom: 36, transform: "translateX(-50%)", width: 160, height: 150, zIndex: 1290, pointerEvents: "none" }}>
      <div style={{ position: "absolute", left: 55, bottom: 0, width: 50, height: 112, borderRadius: "16px 16px 8px 8px", background: "linear-gradient(90deg,#171717,#555,#171717)", border: "2px solid #c8c8c8", boxShadow: "0 0 16px rgba(255,255,255,0.22)", transform: flash ? "translateY(-8px)" : "none", transition: "transform 80ms" }} />
      <div style={{ position: "absolute", left: 42, bottom: 96, width: 76, height: 22, borderRadius: 6, background: "linear-gradient(#222,#070707)", border: "2px solid #bbb", transform: flash ? "translateY(-8px)" : "none", transition: "transform 80ms" }} />
      {flash && <div style={{ position: "absolute", left: 62, bottom: 120, color: "#ffdd66", fontSize: 44, textShadow: "0 0 18px #ff5500" }}>✦</div>}
      <div style={{ position: "absolute", bottom: -18, left: 0, right: 0, textAlign: "center", color: "#ffcc66", fontSize: 10, letterSpacing: 2 }}>{label}</div>
    </div>
  );
}

export function VaultDoomFPS({ open, onClose, tradingData }: Props) {
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [health, setHealth] = useState(100);
  const [armor, setArmor] = useState(50);
  const [ammo, setAmmo] = useState(120);
  const [kills, setKills] = useState(0);
  const [lost, setLost] = useState(0);
  const [weapon, setWeapon] = useState<WeaponId>("pistol");
  const [message, setMessage] = useState("VAULT 63 FPS ONLINE");
  const [flash, setFlash] = useState(false);
  const [roomName, setRoomName] = useState("Cryo Bay");

  const posRef = useRef({ x: 0, z: 4 });
  const rotRef = useRef({ yaw: Math.PI, pitch: 0 });
  const moveRef = useRef({ x: 0, y: 0 });
  const lookRef = useRef({ x: 0, y: 0 });
  const currentRoomRef = useRef<RoomId>("cryo");
  const lastShotRef = useRef(0);

  const pnl = getPnl(tradingData);
  const equity = num((tradingData as any).equity);
  const difficulty = useMemo(() => clamp(1 + Math.max(0, pnl) / 50 + num((tradingData as any).lossStreak) * 0.8 + num((tradingData as any).positions) * 0.4, 1, 10), [pnl, tradingData]);

  useEffect(() => {
    if (!open) return;
    const t = window.setInterval(() => {
      setRoomName(getRoom(posRef.current.x, posRef.current.z).label);
    }, 250);
    return () => window.clearInterval(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const t = window.setInterval(() => {
      setEnemies((old) => old.length >= 7 ? old : [...old, makeEnemy(difficulty, tradingData)]);
    }, Math.max(1700, 4400 - difficulty * 240));
    return () => window.clearInterval(t);
  }, [open, difficulty, tradingData]);

  useEffect(() => {
    if (!open) return;
    const t = window.setInterval(() => {
      setEnemies((old) => {
        let damage = 0;
        let stolen = 0;
        const next = old.map((enemy) => {
          const dx = posRef.current.x - enemy.position[0];
          const dz = posRef.current.z - enemy.position[2];
          const dist = Math.max(0.1, Math.hypot(dx, dz));
          if (dist < 1.35) {
            damage += 6;
            stolen += enemy.steal;
            return null;
          }
          const step = enemy.speed * 0.08;
          return { ...enemy, position: [enemy.position[0] + (dx / dist) * step, 0, enemy.position[2] + (dz / dist) * step] as [number, number, number] };
        }).filter(Boolean) as Enemy[];
        if (damage) {
          setHealth((h) => clamp(h - Math.max(1, damage - armor * 0.05), 0, 100));
          setLost((v) => v + stolen);
          setMessage("BREACH BLOCKED · VAULT GIRL SEALED THE DOOR");
        }
        return next;
      });
    }, 80);
    return () => window.clearInterval(t);
  }, [open, armor]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === "escape") onClose();
      if (key === "w" || e.key === "ArrowUp") moveRef.current.y = -1;
      if (key === "s" || e.key === "ArrowDown") moveRef.current.y = 1;
      if (key === "a" || e.key === "ArrowLeft") moveRef.current.x = -1;
      if (key === "d" || e.key === "ArrowRight") moveRef.current.x = 1;
      if (key === " " || key === "f") fire();
      if (key === "1") setWeapon("pistol");
      if (key === "2") setWeapon("shotgun");
      if (key === "3") setWeapon("laser");
      if (key === "4") setWeapon("plasma");
    };
    const onKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if ((key === "w" || e.key === "ArrowUp") && moveRef.current.y < 0) moveRef.current.y = 0;
      if ((key === "s" || e.key === "ArrowDown") && moveRef.current.y > 0) moveRef.current.y = 0;
      if ((key === "a" || e.key === "ArrowLeft") && moveRef.current.x < 0) moveRef.current.x = 0;
      if ((key === "d" || e.key === "ArrowRight") && moveRef.current.x > 0) moveRef.current.x = 0;
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => { window.removeEventListener("keydown", onKeyDown); window.removeEventListener("keyup", onKeyUp); };
  }, [open, onClose, weapon, ammo, enemies]);

  function fire() {
    const now = Date.now();
    const w = WEAPONS[weapon];
    if (now - lastShotRef.current < w.delay) return;
    lastShotRef.current = now;
    if (ammo < w.ammoUse) {
      setMessage("NO AMMO · FIND ARMORY");
      return;
    }
    setAmmo((a) => Math.max(0, a - w.ammoUse));
    setFlash(true);
    window.setTimeout(() => setFlash(false), 90);

    setEnemies((old) => {
      if (!old.length) {
        setMessage("SHOT FIRED · CORRIDOR CLEAR");
        return old;
      }
      const forward = new THREE.Vector3(-Math.sin(rotRef.current.yaw), 0, -Math.cos(rotRef.current.yaw)).normalize();
      let best: Enemy | null = null;
      let bestScore = -999;
      for (const enemy of old) {
        const to = new THREE.Vector3(enemy.position[0] - posRef.current.x, 0, enemy.position[2] - posRef.current.z);
        const dist = to.length();
        if (dist > w.range) continue;
        const score = forward.dot(to.normalize()) - dist * 0.015;
        if (score > bestScore) { best = enemy; bestScore = score; }
      }
      if (!best || bestScore < 0.55) {
        setMessage("MISS · LINE UP THE CROSSHAIR");
        return old;
      }
      const hp = best.hp - w.damage;
      if (hp <= 0) {
        setKills((k) => k + 1);
        setMessage(`${best.type} DESTROYED · PROFIT SECURED`);
        if (Math.random() > 0.45) setAmmo((a) => clamp(a + 6, 0, 180));
        return old.filter((e) => e.id !== best!.id);
      }
      setMessage(`${best.type} HIT · ${Math.max(0, Math.round(hp))} HP`);
      return old.map((e) => e.id === best!.id ? { ...e, hp } : e);
    });
  }

  function useCurrentRoom() {
    const room = currentRoomRef.current;
    if (room === "medical") { setHealth(100); setMessage("MEDICAL BAY · HEALTH RESTORED"); }
    if (room === "armory") { setAmmo(160); setWeapon("shotgun"); setMessage("ARMORY UNLOCKED · SHOTGUN READY"); }
    if (room === "reactor") { setArmor(100); setMessage("REACTOR SHIELD BOOSTED"); }
    if (room === "botanical") { setHealth((h) => clamp(h + 25, 0, 100)); setMessage("BOTANICAL LAB · RECOVERY BOOST"); }
  }

  if (!open) return null;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1200, background: "#07121b", fontFamily: "Courier New, monospace", color: "#00ff66", overflow: "hidden" }}>
      <Canvas shadows camera={{ fov: 76, near: 0.1, far: 220 }} gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.45 }} onClick={(e) => (e.target as HTMLCanvasElement).requestPointerLock?.()} style={{ position: "absolute", inset: 0 }}>
        <World enemies={enemies} posRef={posRef} rotRef={rotRef} moveRef={moveRef} lookRef={lookRef} currentRoomRef={currentRoomRef} />
      </Canvas>

      <div style={{ position: "fixed", top: 12, left: 14, zIndex: 1300, textShadow: "0 0 12px #00ff66" }}>
        <div style={{ fontSize: 24, letterSpacing: 4, fontWeight: 700 }}>VAULT 63 FPS</div>
        <div style={{ color: "#ffcc66", fontSize: 12, letterSpacing: 3 }}>{roomName.toUpperCase()} · DIFFICULTY {difficulty.toFixed(1)}</div>
      </div>

      <button onClick={onClose} style={{ position: "fixed", top: 14, right: 14, zIndex: 1320, background: "rgba(80,0,0,0.86)", border: "2px solid #ff6677", color: "#ff99a0", borderRadius: 10, padding: "12px 24px", fontSize: 16, fontWeight: 700, letterSpacing: 3, fontFamily: "inherit" }}>EXIT</button>

      <div style={{ position: "fixed", top: 82, left: 16, zIndex: 1300, width: 128, padding: 10, border: "1px solid #00cc66", borderRadius: 10, background: "rgba(0,20,10,0.62)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          {ROOMS.slice(0, 9).map((room) => <div key={room.id} title={room.label} style={{ width: 14, height: 14, border: `2px solid ${room.color}`, borderRadius: 4, background: currentRoomRef.current === room.id ? room.color : "transparent" }} />)}
        </div>
        <div style={{ color: "#00ff66", fontSize: 10, letterSpacing: 2, marginTop: 8 }}>MAP</div>
      </div>

      <div style={{ position: "fixed", top: 92, right: 18, zIndex: 1300, display: "grid", gap: 8 }}>
        {(["pistol", "shotgun", "laser", "plasma"] as WeaponId[]).map((id, index) => (
          <button key={id} onClick={() => setWeapon(id)} style={{ width: 112, padding: "8px 8px", borderRadius: 8, border: `1px solid ${weapon === id ? "#ffcc66" : "#00aa44"}`, background: weapon === id ? "rgba(100,60,0,0.70)" : "rgba(0,28,12,0.52)", color: weapon === id ? "#ffcc66" : "#00cc66", fontFamily: "inherit", letterSpacing: 2 }}>{index + 1} {WEAPONS[id].name}</button>
        ))}
      </div>

      <div style={{ position: "fixed", left: "50%", top: "50%", transform: "translate(-50%,-50%)", zIndex: 1300, color: "#00ff66", fontSize: 48, pointerEvents: "none", textShadow: "0 0 14px #00ff66" }}>+</div>

      <div style={{ position: "fixed", left: "50%", bottom: 174, transform: "translateX(-50%)", zIndex: 1300, maxWidth: "72vw", padding: "8px 14px", border: "1px solid #ffcc66", borderRadius: 8, background: "rgba(20,8,0,0.72)", color: "#ffcc66", fontSize: 13, letterSpacing: 2, textAlign: "center" }}>{message}</div>

      <button onClick={useCurrentRoom} style={{ position: "fixed", left: "50%", bottom: 124, transform: "translateX(-50%)", zIndex: 1310, minWidth: 220, padding: "12px 18px", borderRadius: 12, border: "2px solid #00ff66", background: "rgba(0,45,20,0.82)", color: "#00ff66", fontFamily: "inherit", fontSize: 16, fontWeight: 700, letterSpacing: 3 }}>USE ROOM</button>

      <MobileStick label="MOVE" side="left" onMove={(x, y) => { moveRef.current = { x, y }; }} />
      <MobileStick label="LOOK" side="right" onMove={(x, y) => { lookRef.current = { x, y }; }} />
      <button onPointerDown={fire} style={{ position: "fixed", right: 28, bottom: 78, width: 98, height: 98, borderRadius: "50%", zIndex: 1320, border: "3px solid #ffcc66", background: "rgba(120,40,0,0.78)", color: "#ffdd88", fontFamily: "inherit", fontSize: 20, fontWeight: 900, letterSpacing: 2, boxShadow: "0 0 22px rgba(255,190,60,0.45)" }}>FIRE</button>

      <WeaponSprite weapon={weapon} flash={flash} />

      <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 1280, minHeight: 78, borderTop: "3px solid #00ff66", background: "rgba(0,12,8,0.90)", display: "grid", gridTemplateColumns: "repeat(6, 1fr)", alignItems: "center", textAlign: "center", color: "#00ff66", letterSpacing: 2 }}>
        <div>HEALTH<br/><b style={{ fontSize: 22, color: health < 30 ? "#ff5577" : "#00ff66" }}>{Math.round(health)}</b></div>
        <div>ARMOR<br/><b style={{ fontSize: 22 }}>{Math.round(armor)}</b></div>
        <div>AMMO<br/><b style={{ fontSize: 22 }}>{ammo}</b></div>
        <div>KILLS<br/><b style={{ fontSize: 22 }}>{kills}</b></div>
        <div>LOST<br/><b style={{ fontSize: 22, color: "#ff8888" }}>{money(lost)}</b></div>
        <div>EQ<br/><b style={{ fontSize: 16, color: "#ffcc66" }}>{money(equity)}</b></div>
      </div>

      <div style={{ position: "fixed", right: 148, bottom: 98, zIndex: 1295, width: 130, border: "1px solid #00aa66", borderRadius: 12, padding: 8, background: "rgba(0,18,10,0.66)", fontSize: 11, color: "#aaffcc", letterSpacing: 2 }}>
        <div style={{ color: "#00ff66" }}>VAULT GIRL</div>
        <div>♥ {health < 40 ? 98 : 72} BPM</div>
        <div>AI {((tradingData as any).connected ? "ONLINE" : "SYNC")}</div>
        <div>PNL {money(pnl)}</div>
      </div>

      <div style={{ position: "fixed", left: 18, bottom: 86, zIndex: 1290, color: "#ffcc66", fontSize: 11, letterSpacing: 2 }}>API {API_BASE.replace("https://", "")}</div>
    </div>
  );
}
