import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useKeyboardControls } from '@react-three/drei';
import * as THREE from 'three';
import { TradingData } from './useTradingData';

type InvaderType = 'FUD RAIDER' | 'WHALE THIEF' | 'LIQUIDATION GHOUL' | 'RUG PULL BOSS' | 'CIRCUIT BREAKER' | 'FLASH CRASH PHANTOM';

interface Enemy {
  id: string;
  type: InvaderType;
  position: [number, number, number];
  hp: number;
  maxHp: number;
  speed: number;
  threat: 'infiltrate' | 'raid';
  color: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  tradingData: TradingData;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function money(n: number) {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function makeEnemy(difficulty: number, profit: number, lossStreak: number, profitDropping: boolean): Enemy {
  const roll = Math.random();
  let type: InvaderType = 'FUD RAIDER';
  
  if (lossStreak >= 5 && roll > 0.6) type = 'RUG PULL BOSS';
  else if (profitDropping && roll > 0.5) type = 'FLASH CRASH PHANTOM';
  else if (profit > 20 && roll > 0.55) type = 'WHALE THIEF';
  else if (lossStreak >= 3 && roll > 0.45) type = 'LIQUIDATION GHOUL';
  else if (difficulty > 8 && roll > 0.7) type = 'CIRCUIT BREAKER';

  const threat = profitDropping ? 'raid' : 'infiltrate';
  const fromLeft = Math.random() > 0.5;
  const baseX = fromLeft ? -8 : 8;
  const baseZ = -30 - Math.random() * 20;

  const baseStats = {
    id: `${type}_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    position: [baseX, 0, baseZ] as [number, number, number],
    threat,
    color: '#39ff14',
  };

  if (type === 'RUG PULL BOSS') return { ...baseStats, type, hp: 200 + difficulty * 22, maxHp: 200 + difficulty * 22, speed: profitDropping ? 0.22 : 0.10 + difficulty * 0.01, color: '#ff2255' };
  if (type === 'FLASH CRASH PHANTOM') return { ...baseStats, type, hp: 110 + difficulty * 12, maxHp: 110 + difficulty * 12, speed: 0.32 + difficulty * 0.03, color: '#ff1188' };
  if (type === 'CIRCUIT BREAKER') return { ...baseStats, type, hp: 140 + difficulty * 15, maxHp: 140 + difficulty * 15, speed: 0.19 + difficulty * 0.018, color: '#ffaa00' };
  if (type === 'WHALE THIEF') return { ...baseStats, type, hp: 90 + difficulty * 10, maxHp: 90 + difficulty * 10, speed: profitDropping ? 0.20 : 0.13 + difficulty * 0.015, color: '#00aaff' };
  if (type === 'LIQUIDATION GHOUL') return { ...baseStats, type, hp: 65 + difficulty * 9, maxHp: 65 + difficulty * 9, speed: profitDropping ? 0.28 : 0.24 + difficulty * 0.025, color: '#ffaa00' };
  return { ...baseStats, type, hp: 48 + difficulty * 6, maxHp: 48 + difficulty * 6, speed: profitDropping ? 0.25 : 0.18 + difficulty * 0.02 };
}

function FPSCamera({ playerPosRef, cameraRotRef }: any) {
  const { camera } = useThree();
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement) {
        const sensitivity = 0.005;
        cameraRotRef.current.yaw -= e.movementX * sensitivity;
        cameraRotRef.current.pitch -= e.movementY * sensitivity;
        cameraRotRef.current.pitch = clamp(cameraRotRef.current.pitch, -Math.PI / 2, Math.PI / 2);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [cameraRotRef]);

  useFrame(() => {
    camera.position.set(playerPosRef.current.x, 1.6, playerPosRef.current.z);
    camera.rotation.order = 'YXZ';
    camera.rotation.y = cameraRotRef.current.yaw;
    camera.rotation.x = cameraRotRef.current.pitch;
  });

  return null;
}

function VaultCorridor() {
  return (
    <group>
      {/* Floor */}
      <mesh position={[0, -0.5, -50]} receiveShadow>
        <planeGeometry args={[20, 100]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>

      {/* Walls */}
      <mesh position={[-10, 2, -50]} receiveShadow>
        <boxGeometry args={[0.5, 5, 100]} />
        <meshStandardMaterial color="#0a3a0a" />
      </mesh>
      <mesh position={[10, 2, -50]} receiveShadow>
        <boxGeometry args={[0.5, 5, 100]} />
        <meshStandardMaterial color="#0a3a0a" />
      </mesh>

      {/* Ceiling */}
      <mesh position={[0, 4.5, -50]} receiveShadow>
        <planeGeometry args={[20, 100]} />
        <meshStandardMaterial color="#0a0a0a" />
      </mesh>

      {/* Vault door */}
      <mesh position={[0, 1, -5]} castShadow>
        <boxGeometry args={[6, 4, 0.5]} />
        <meshStandardMaterial color="#ffaa00" emissive="#ffaa00" emissiveIntensity={0.5} />
      </mesh>

      {/* Lighting */}
      <directionalLight position={[0, 4, 0]} intensity={0.8} castShadow />
      <ambientLight intensity={0.4} color="#00ff44" />
      <pointLight position={[0, 2, -20]} intensity={1} color="#00ff88" distance={30} />
    </group>
  );
}

function EnemyModel({ enemy, onHit }: any) {
  const meshRef = useRef(null);
  const [localPosition, setLocalPosition] = useState(enemy.position);

  useFrame(() => {
    if (meshRef.current && localPosition[2] < 5) {
      const newZ = localPosition[2] + enemy.speed * 0.016;
      setLocalPosition([localPosition[0], 0, newZ]);
      (meshRef.current as any).position.z = newZ;
    }
  });

  return (
    <mesh ref={meshRef} position={localPosition} castShadow onClick={() => onHit(enemy.id)}>
      <sphereGeometry args={[0.8, 16, 16]} />
      <meshStandardMaterial color={enemy.color} emissive={enemy.color} emissiveIntensity={0.3} />
      {/* Health bar */}
      <mesh position={[0, 1.2, 0]}>
        <planeGeometry args={[1.6, 0.2]} />
        <meshBasicMaterial color="#220000" />
      </mesh>
      <mesh position={[0, 1.2, 0.05]}>
        <planeGeometry args={[(enemy.hp / enemy.maxHp) * 1.6, 0.2]} />
        <meshBasicMaterial color={enemy.color} />
      </mesh>
    </mesh>
  );
}

export function VaultDoomFPS({ open, onClose, tradingData }: Props) {
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [health, setHealth] = useState(100);
  const [armor, setArmor] = useState(50);
  const [ammo, setAmmo] = useState(120);
  const [kills, setKills] = useState(0);
  const [stolen, setStolen] = useState(0);
  const [shield, setShield] = useState(100);
  const [message, setMessage] = useState('VAULT DEFENCE ONLINE · WELCOME TO CRYO LEVEL');
  const [flash, setFlash] = useState(false);
  const [wavesDefeated, setWavesDefeated] = useState(0);
  const [gameStatus, setGameStatus] = useState<'active' | 'critical' | 'victory'>('active');

  const canvasRef = useRef(null);
  const playerPosRef = useRef({ x: 0, z: 0 });
  const cameraRotRef = useRef({ yaw: 0, pitch: 0 });
  const moveInputRef = useRef({ x: 0, z: 0 });
  const prevProfitRef = useRef(tradingData.todayPnl);

  const pnl = tradingData.todayPnl;
  const equity = tradingData.equity;
  const lossStreak = tradingData.lossStreak;
  
  const profitDropping = pnl < prevProfitRef.current - 2;
  
  useEffect(() => {
    prevProfitRef.current = pnl;
  }, [pnl]);

  const difficulty = useMemo(() => {
    const profitHeat = pnl > 0 ? Math.min(7, pnl / 12) : 0;
    const profitDropHeat = profitDropping ? 3.5 : 0;
    const lossHeat = lossStreak * 1.5;
    const positionHeat = tradingData.positions * 0.8;
    return clamp(1 + profitHeat + profitDropHeat + lossHeat + positionHeat, 1, 14);
  }, [pnl, profitDropping, lossStreak, tradingData.positions]);

  const spawnRate = useMemo(() => {
    const baseRate = Math.max(800, 3200 - difficulty * 200);
    return profitDropping ? baseRate * 0.55 : baseRate;
  }, [difficulty, profitDropping]);

  const maxEnemies = useMemo(() => {
    const base = clamp(Math.floor(3 + difficulty), 4, 14);
    return profitDropping ? Math.floor(base * 1.3) : base;
  }, [difficulty, profitDropping]);

  // Keyboard controls
  useEffect(() => {
    const keys = { w: false, a: false, s: false, d: false };
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyW') keys.w = true;
      if (e.code === 'KeyA') keys.a = true;
      if (e.code === 'KeyS') keys.s = true;
      if (e.code === 'KeyD') keys.d = true;
      if (e.code === 'Space') fireAt();
      if (e.code === 'Escape') onClose();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'KeyW') keys.w = false;
      if (e.code === 'KeyA') keys.a = false;
      if (e.code === 'KeyS') keys.s = false;
      if (e.code === 'KeyD') keys.d = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    const moveLoop = setInterval(() => {
      const speed = 0.1;
      moveInputRef.current.x = 0;
      moveInputRef.current.z = 0;

      if (keys.w) moveInputRef.current.z -= speed;
      if (keys.s) moveInputRef.current.z += speed;
      if (keys.a) moveInputRef.current.x -= speed;
      if (keys.d) moveInputRef.current.x += speed;

      // Apply movement with camera rotation
      const cos = Math.cos(cameraRotRef.current.yaw);
      const sin = Math.sin(cameraRotRef.current.yaw);
      playerPosRef.current.x += moveInputRef.current.x * cos - moveInputRef.current.z * sin;
      playerPosRef.current.z += moveInputRef.current.x * sin + moveInputRef.current.z * cos;

      playerPosRef.current.x = clamp(playerPosRef.current.x, -8, 8);
      playerPosRef.current.z = clamp(playerPosRef.current.z, -60, 0);
    }, 16);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      clearInterval(moveLoop);
    };
  }, [onClose]);

  // Spawn enemies
  useEffect(() => {
    if (!open) return;
    const spawn = setInterval(() => {
      setEnemies(current => {
        if (current.length >= maxEnemies) return current;
        return [...current, makeEnemy(difficulty, pnl, lossStreak, profitDropping)];
      });
    }, spawnRate);
    return () => clearInterval(spawn);
  }, [open, difficulty, pnl, lossStreak, profitDropping, spawnRate, maxEnemies]);

  // Game loop
  useEffect(() => {
    if (!open) return;
    const tick = setInterval(() => {
      setEnemies(current => {
        let breachDamage = 0;
        let newWaves = 0;
        
        const next = current.filter(enemy => {
          const dist = Math.hypot(
            enemy.position[0] - playerPosRef.current.x,
            enemy.position[2] - playerPosRef.current.z
          );
          
          if (dist < 1) {
            breachDamage += enemy.threat === 'raid' ? enemy.speed * 2.5 : enemy.speed;
            newWaves += 1;
            return false;
          }
          return true;
        });

        if (breachDamage > 0) {
          setHealth(h => clamp(h - breachDamage, 0, 100));
          setMessage(`🚨 VAULT BREACH! · STRUCTURAL DAMAGE`);
        }
        if (newWaves > 0) setWavesDefeated(w => w + newWaves);
        return next;
      });
    }, 80);
    return () => clearInterval(tick);
  }, [open]);

  const fireAt = () => {
    if (ammo <= 0) {
      setMessage('NO AMMO');
      return;
    }
    
    setAmmo(a => Math.max(0, a - 1));
    setFlash(true);
    setTimeout(() => setFlash(false), 100);

    setEnemies(current => {
      if (!current.length) return current;
      
      const closest = current.reduce((prev, curr) => {
        const prevDist = Math.hypot(prev.position[0] - playerPosRef.current.x, prev.position[2] - playerPosRef.current.z);
        const currDist = Math.hypot(curr.position[0] - playerPosRef.current.x, curr.position[2] - playerPosRef.current.z);
        return currDist < prevDist ? curr : prev;
      });

      const dist = Math.hypot(closest.position[0] - playerPosRef.current.x, closest.position[2] - playerPosRef.current.z);
      
      if (dist > 15) {
        setMessage('OUT OF RANGE');
        return current;
      }

      const damage = 45;
      const hp = closest.hp - damage;
      
      if (hp <= 0) {
        setKills(k => k + 1);
        setShield(s => clamp(s + 4, 0, 100));
        setMessage(`${closest.type} DESTROYED`);
        if (Math.random() > 0.5) setAmmo(a => clamp(a + 8, 0, 160));
        return current.filter(e => e.id !== closest.id);
      } else {
        return current.map(e => e.id === closest.id ? { ...e, hp } : e);
      }
    });
  };

  useEffect(() => {
    if (health <= 0) {
      setGameStatus('critical');
      setMessage('🔴 VAULT COMPROMISED');
    } else if (pnl > 0 && !profitDropping && enemies.length === 0 && kills > 5) {
      setGameStatus('victory');
      setMessage('✅ VAULT SECURED');
    }
  }, [health, pnl, profitDropping, enemies.length, kills]);

  if (!open) return null;

  const isInRaidMode = profitDropping && difficulty > 5;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1200, background: '#000', fontFamily: 'Courier New, monospace' }}>
      <Canvas
        ref={canvasRef}
        camera={{ fov: 75, near: 0.1, far: 1000, position: [0, 1.6, 0] }}
        gl={{ antialias: true }}
        onClick={() => (canvasRef.current as any)?.requestPointerLock?.()}
      >
        <FPSCamera playerPosRef={playerPosRef} cameraRotRef={cameraRotRef} />
        <VaultCorridor />
        {enemies.map(enemy => (
          <EnemyModel key={enemy.id} enemy={enemy} onHit={() => fireAt()} />
        ))}
      </Canvas>

      {/* HUD */}
      <div style={{ position: 'fixed', top: 10, left: 10, color: '#00ff66', fontSize: 12, letterSpacing: 1 }}>
        <div>VAULT 63 DOOM DEFENCE {isInRaidMode ? '🚨 RAID MODE 🚨' : ''}</div>
        <div style={{ color: '#00aa44', fontSize: 10 }}>DIFFICULTY {difficulty.toFixed(1)}</div>
      </div>

      <div style={{ position: 'fixed', top: 10, right: 10, color: '#ffaa00', fontSize: 11, textAlign: 'right' }}>
        <div>PROFIT HEAT: {money(Math.max(0, pnl))}</div>
        <div>{message}</div>
      </div>

      <div style={{ position: 'fixed', bottom: 10, left: 10, color: '#00ff66', fontSize: 11, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        <div>HEALTH<br/><b style={{ color: health < 30 ? '#ff5555' : '#00ff66' }}>{Math.round(health)}</b></div>
        <div>ARMOR<br/><b>{Math.round(armor)}</b></div>
        <div>AMMO<br/><b>{ammo}</b></div>
        <div>KILLS<br/><b>{kills}</b></div>
      </div>

      <div style={{ position: 'fixed', bottom: 10, right: 10, color: '#00aaff', fontSize: 10, textAlign: 'right' }}>
        <div>WAVES: {wavesDefeated}</div>
        <div>STATUS: {gameStatus}</div>
      </div>

      {flash && <div style={{ position: 'fixed', inset: 0, background: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }} />}

      <div style={{ position: 'fixed', bottom: 10, left: '50%', transform: 'translateX(-50%)', color: '#ffaa00', fontSize: 14, fontWeight: 'bold' }}>
        + ✕
      </div>

      <button
        onClick={onClose}
        style={{ position: 'fixed', top: 10, right: 10, zIndex: 999, background: '#220000', border: '1px solid #ff5555', color: '#ff7777', padding: '8px 12px', borderRadius: 4, fontFamily: 'inherit', cursor: 'pointer' }}
      >
        EXIT
      </button>
    </div>
  );
}
