import { useEffect, useMemo, useRef, useState } from 'react';
import { TradingData } from './useTradingData';

type InvaderType = 'FUD RAIDER' | 'WHALE THIEF' | 'LIQUIDATION GHOUL' | 'RUG PULL BOSS' | 'CIRCUIT BREAKER' | 'FLASH CRASH PHANTOM';

type Invader = {
  id: string;
  type: InvaderType;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  speed: number;
  steal: number;
  size: number;
  color: string;
  threat: 'infiltrate' | 'raid';
};

interface Props {
  open: boolean;
  onClose: () => void;
  tradingData: TradingData;
}

const LEVELS = [
  'LEVEL 1 · CRYO BAY',
  'LEVEL 2 · BOTANICAL LAB',
  'LEVEL 3 · SHOWER / BEDROOM BLOCK',
  'LEVEL 4 · MAIN VAULT TREASURY',
  'LEVEL 5 · REACTOR CORE',
];

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function money(n: number) {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function makeInvader(difficulty: number, profit: number, lossStreak: number, profitDropping: boolean): Invader {
  const roll = Math.random();
  let type: InvaderType = 'FUD RAIDER';
  
  if (lossStreak >= 5 && roll > 0.6) type = 'RUG PULL BOSS';
  else if (profitDropping && roll > 0.5) type = 'FLASH CRASH PHANTOM';
  else if (profit > 20 && roll > 0.55) type = 'WHALE THIEF';
  else if (lossStreak >= 3 && roll > 0.45) type = 'LIQUIDATION GHOUL';
  else if (difficulty > 8 && roll > 0.7) type = 'CIRCUIT BREAKER';

  const fromLeft = Math.random() > 0.5;
  const threat = profitDropping ? 'raid' : 'infiltrate';
  
  const base = {
    id: `${type}_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    x: fromLeft ? -8 : 108,
    y: 22 + Math.random() * 54,
    threat,
  };

  if (type === 'RUG PULL BOSS') return { ...base, type, hp: 200 + difficulty * 22, maxHp: 200 + difficulty * 22, speed: profitDropping ? 0.22 : 0.10 + difficulty * 0.01, steal: 25 + difficulty, size: 54, color: '#ff2255' };
  if (type === 'FLASH CRASH PHANTOM') return { ...base, type, hp: 110 + difficulty * 12, maxHp: 110 + difficulty * 12, speed: 0.32 + difficulty * 0.03, steal: 22 + difficulty * 1.5, size: 48, color: '#ff1188' };
  if (type === 'CIRCUIT BREAKER') return { ...base, type, hp: 140 + difficulty * 15, maxHp: 140 + difficulty * 15, speed: 0.19 + difficulty * 0.018, steal: 16 + difficulty, size: 46, color: '#ffaa00' };
  if (type === 'WHALE THIEF') return { ...base, type, hp: 90 + difficulty * 10, maxHp: 90 + difficulty * 10, speed: profitDropping ? 0.20 : 0.13 + difficulty * 0.015, steal: 12 + difficulty, size: 42, color: '#00aaff' };
  if (type === 'LIQUIDATION GHOUL') return { ...base, type, hp: 65 + difficulty * 9, maxHp: 65 + difficulty * 9, speed: profitDropping ? 0.28 : 0.24 + difficulty * 0.025, steal: 8 + difficulty, size: 36, color: '#ffaa00' };
  return { ...base, type, hp: 48 + difficulty * 6, maxHp: 48 + difficulty * 6, speed: profitDropping ? 0.25 : 0.18 + difficulty * 0.02, steal: 4 + difficulty * 0.5, size: 28, color: '#39ff14' };
}

export function VaultDoomInvaders({ open, onClose, tradingData }: Props) {
  const [invaders, setInvaders] = useState<Invader[]>([]);
  const [health, setHealth] = useState(100);
  const [armor, setArmor] = useState(50);
  const [ammo, setAmmo] = useState(90);
  const [kills, setKills] = useState(0);
  const [stolen, setStolen] = useState(0);
  const [shield, setShield] = useState(100);
  const [message, setMessage] = useState('VAULT DEFENCE ONLINE · PROFITS ATTRACT RAIDERS');
  const [flash, setFlash] = useState(false);
  const [wavesDefeated, setWavesDefeated] = useState(0);
  const [gameStatus, setGameStatus] = useState<'active' | 'critical' | 'victory'>('active');
  const arenaRef = useRef<HTMLDivElement | null>(null);
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

  const levelIndex = clamp(Math.floor((difficulty - 1) / 2.8), 0, LEVELS.length - 1);
  const levelName = LEVELS[levelIndex];

  const vaultGirlDamage = useMemo(() => {
    const winBonus = tradingData.winRate > 0 ? (tradingData.winRate / 100) * 25 : 0;
    const moodBonus = tradingData.heartbeat === 'ONLINE' ? 15 : 0;
    const profitBonus = pnl > 50 ? (pnl / 100) * 10 : 0;
    return clamp(35 + winBonus + moodBonus + profitBonus, 18, 75);
  }, [tradingData.winRate, tradingData.heartbeat, pnl]);

  const spawnRate = useMemo(() => {
    const baseRate = Math.max(600, 3200 - difficulty * 200);
    return profitDropping ? baseRate * 0.55 : baseRate;
  }, [difficulty, profitDropping]);

  const maxEnemies = useMemo(() => {
    const base = clamp(Math.floor(3 + difficulty), 4, 14);
    return profitDropping ? Math.floor(base * 1.3) : base;
  }, [difficulty, profitDropping]);

  useEffect(() => {
    if (!open) return;
    const spawn = window.setInterval(() => {
      setInvaders(current => {
        if (current.length >= maxEnemies) return current;
        return [...current, makeInvader(difficulty, pnl, lossStreak, profitDropping)];
      });
    }, spawnRate);
    return () => window.clearInterval(spawn);
  }, [open, difficulty, pnl, lossStreak, profitDropping, spawnRate, maxEnemies]);

  useEffect(() => {
    if (!open) return;
    const tick = window.setInterval(() => {
      setInvaders(current => {
        let breachDamage = 0;
        let stolenNow = 0;
        let newWaves = 0;

        const next = current.map(enemy => {
          const dir = enemy.x < 50 ? 1 : -1;
          const speedMult = profitDropping ? 1.15 : 1 + difficulty / 10;
          const nx = enemy.x + dir * enemy.speed * speedMult;
          
          if (Math.abs(nx - 50) < 3) {
            if (enemy.threat === 'infiltrate') {
              stolenNow += enemy.steal;
            } else {
              breachDamage += enemy.steal * 2.5;
            }
            newWaves += 1;
            return { ...enemy, x: enemy.x < 50 ? -10 : 110, y: 22 + Math.random() * 54 };
          }
          return { ...enemy, x: nx };
        });

        if (breachDamage > 0 || stolenNow > 0) {
          const totalDamage = breachDamage + stolenNow * 0.7;
          setShield(s => clamp(s - totalDamage * 0.8, 0, 100));
          setArmor(a => clamp(a - totalDamage * 0.3, 0, 100));
          setHealth(h => clamp(h - Math.max(0, totalDamage - armor * 0.08), 0, 100));
          setStolen(v => v + stolenNow);
          
          if (breachDamage > 0) {
            setMessage(`🚨 VAULT BREACH! RAIDERS ATTACKING! · ${money(breachDamage)} STRUCTURAL DAMAGE`);
          } else {
            setMessage(`INFILTRATORS ESCAPED · ${money(stolenNow)} STOLEN`);
          }
        }
        
        if (newWaves > 0) setWavesDefeated(w => w + newWaves);
        return next;
      });
    }, 80);
    return () => window.clearInterval(tick);
  }, [open, difficulty, armor, profitDropping]);

  useEffect(() => {
    if (health <= 0) {
      setGameStatus('critical');
      setMessage('🔴 VAULT COMPROMISED · SYSTEM FAILURE');
    } else if (shield <= 0 && armor <= 10) {
      setGameStatus('critical');
      setMessage('⚠️ CRITICAL DAMAGE · BACKUP SYSTEMS FAILING');
    } else if (pnl > 0 && !profitDropping && invaders.length === 0 && kills > 8) {
      setGameStatus('victory');
      setMessage('✅ PROFITS SECURED · RAIDERS DEFEATED · VAULT SAFE');
    }
  }, [health, shield, armor, pnl, profitDropping, invaders.length, kills]);

  const fireAt = (clientX?: number, clientY?: number) => {
    if (ammo <= 0) {
      setMessage('NO AMMO · PROFIT BLASTER EMPTY · RESUPPLY NEEDED');
      return;
    }
    setAmmo(a => Math.max(0, a - 1));
    setFlash(true);
    window.setTimeout(() => setFlash(false), 90);

    const rect = arenaRef.current?.getBoundingClientRect();
    const tx = rect && clientX != null ? ((clientX - rect.left) / rect.width) * 100 : 50;
    const ty = rect && clientY != null ? ((clientY - rect.top) / rect.height) * 100 : 50;

    setInvaders(current => {
      if (!current.length) {
        setMessage('SHOT FIRED · NO TARGET · STANDBY');
        return current;
      }
      let best = -1;
      let dist = Infinity;
      current.forEach((e, i) => {
        const d = Math.hypot(e.x - tx, e.y - ty);
        if (d < dist) { dist = d; best = i; }
      });
      if (best < 0 || dist > 23) {
        setMessage('MISSED · INVADERS ADVANCING');
        return current;
      }
      const copy = [...current];
      const enemy = copy[best];
      const hp = enemy.hp - vaultGirlDamage;
      if (hp <= 0) {
        copy.splice(best, 1);
        setKills(k => k + 1);
        setShield(s => clamp(s + 4, 0, 100));
        if (enemy.threat === 'raid') {
          setMessage(`🎯 ${enemy.type} DESTROYED · BREACH AVERTED!`);
        } else {
          setMessage(`${enemy.type} DESTROYED · PROFIT SECURED`);
        }
        if (Math.random() > 0.52) setAmmo(a => clamp(a + 6, 0, 180));
      } else {
        copy[best] = { ...enemy, hp };
        const threatLabel = enemy.threat === 'raid' ? '⚠️' : '';
        setMessage(`${threatLabel} ${enemy.type} HIT · ${Math.ceil(hp)} HP`);
      }
      return copy;
    });
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') { e.preventDefault(); fireAt(); }
      if (e.code === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (!open) return null;

  const isInRaidMode = profitDropping && difficulty > 5;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1200, background: 'rgba(0,0,0,.95)', color: '#00ff66', fontFamily: 'Courier New, monospace', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: isInRaidMode ? '3px solid #ff3333' : '2px solid #00ff44', background: isInRaidMode ? '#330000' : '#001000' }}>
        <div>
          <div style={{ fontSize: 18, letterSpacing: 4, fontWeight: 'bold', color: isInRaidMode ? '#ff5555' : '#00ff66' }}>VAULT 63 DOOM DEFENCE {isInRaidMode ? '🚨 RAID MODE 🚨' : ''}</div>
          <div style={{ fontSize: 10, color: isInRaidMode ? '#ff7777' : '#00aa44', letterSpacing: 2 }}>{levelName} · DIFFICULTY {difficulty.toFixed(1)} {profitDropping ? '↓ PROFIT DROPPING' : '↑ SECURE'}</div>
        </div>
        <button onClick={onClose} style={{ background: '#220000', border: '1px solid #ff5555', color: '#ff7777', borderRadius: 6, padding: '10px 14px', fontFamily: 'inherit', letterSpacing: 2 }}>EXIT</button>
      </div>

      <div
        ref={arenaRef}
        onClick={(e) => fireAt(e.clientX, e.clientY)}
        onTouchStart={(e) => { const t = e.touches[0]; if (t) fireAt(t.clientX, t.clientY); }}
        style={{ flex: 1, position: 'relative', overflow: 'hidden', cursor: 'crosshair', background: isInRaidMode ? 'radial-gradient(circle at center, #330000 0%, #110000 55%, #000 100%)' : 'radial-gradient(circle at center, #082008 0%, #020802 55%, #000 100%)', touchAction: 'manipulation' }}
      >
        <div style={{ position: 'absolute', left: '43%', top: '31%', width: '14%', height: '38%', border: `3px solid ${isInRaidMode ? '#ff3333' : '#00ff44'}`, borderRadius: 10, boxShadow: `0 0 35px ${isInRaidMode ? '#ff333366' : '#00ff4466'}, inset 0 0 30px ${isInRaidMode ? '#ff333422' : '#00ff4422'}` }} />
        <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', color: isInRaidMode ? '#ff5555' : '#00ff88', fontSize: 11, letterSpacing: 2, textAlign: 'center', fontWeight: 'bold' }}>VAULT<br/>CORE</div>

        {invaders.map(enemy => (
          <div key={enemy.id} style={{ position: 'absolute', left: `${enemy.x}%`, top: `${enemy.y}%`, transform: 'translate(-50%,-50%)', width: enemy.size, height: enemy.size, borderRadius: enemy.type.includes('BOSS') ? 4 : '50%', border: `2px solid ${enemy.color}`, color: enemy.color, background: '#050505', boxShadow: `0 0 20px ${enemy.color}${enemy.threat === 'raid' ? 'cc' : '88'}, ${enemy.threat === 'raid' ? 'inset 0 0 15px #ff3333' : ''}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: enemy.type.includes('BOSS') ? 16 : 12, fontWeight: 'bold', opacity: enemy.threat === 'raid' ? 1 : 0.85 }}>
            {enemy.type === 'WHALE THIEF' ? '🐋' : enemy.type === 'LIQUIDATION GHOUL' ? '☠' : enemy.type === 'RUG PULL BOSS' ? 'BOSS' : enemy.type === 'FLASH CRASH PHANTOM' ? '⚡' : enemy.type === 'CIRCUIT BREAKER' ? '💥' : 'FUD'}
            <div style={{ position: 'absolute', top: -8, left: 0, height: 3, width: '100%', background: '#220000' }}>
              <div style={{ height: '100%', width: `${clamp((enemy.hp / enemy.maxHp) * 100, 0, 100)}%`, background: enemy.color }} />
            </div>
            {enemy.threat === 'raid' && <div style={{ position: 'absolute', fontSize: 8, top: -12, right: -8, color: '#ff3333', fontWeight: 'bold' }}>RAID</div>}
          </div>
        ))}

        {flash && <div style={{ position: 'absolute', left: '50%', bottom: '8%', transform: 'translateX(-50%)', width: 90, height: 90, borderRadius: '50%', background: 'radial-gradient(circle, #fff 0%, #00ff88 25%, transparent 70%)', opacity: .8, pointerEvents: 'none' }} />}

        <div style={{ position: 'absolute', left: 10, top: 10, color: '#ffaa00', fontSize: 12, letterSpacing: 2 }}>PROFIT HEAT: {money(Math.max(0, pnl))}</div>
        <div style={{ position: 'absolute', right: 10, top: 10, color: isInRaidMode ? '#ff5555' : '#ff7777', fontSize: 12, letterSpacing: 2 }}>STOLEN: {money(stolen)}</div>
        <div style={{ position: 'absolute', left: 10, bottom: 10, right: 200, color: '#00ff88', fontSize: 12, letterSpacing: 2 }}>{message}</div>
        <div style={{ position: 'absolute', right: 10, bottom: 10, color: '#00aaff', fontSize: 11, letterSpacing: 1, textAlign: 'right' }}>WAVES CLEARED: {wavesDefeated}<br/>STATUS: {gameStatus.toUpperCase()}</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, padding: 8, background: '#050805', borderTop: isInRaidMode ? '2px solid #ff3333' : '2px solid #00ff44', fontSize: 11, textAlign: 'center' }}>
        <div>HEALTH<br/><b style={{ color: health < 30 ? '#ff5555' : health < 60 ? '#ffaa00' : '#00ff66' }}>{Math.round(health)}</b></div>
        <div>ARMOR<br/><b style={{ color: armor < 20 ? '#ff5555' : '#00ff66' }}>{Math.round(armor)}</b></div>
        <div>SHIELD<br/><b style={{ color: shield < 25 ? '#ff5555' : '#00ff66' }}>{Math.round(shield)}</b></div>
        <div>AMMO<br/><b>{ammo}</b></div>
        <div>KILLS<br/><b style={{ color: '#00aaff' }}>{kills}</b></div>
        <div>MODE<br/><b style={{ color: isInRaidMode ? '#ff5555' : '#00ff66' }}>{profitDropping ? 'RAID' : 'GUARD'}</b></div>
        <div>EQUITY<br/><b>{money(equity)}</b></div>
      </div>
    </div>
  );
}
