import { useEffect, useMemo, useRef, useState } from 'react';
import { TradingData } from './useTradingData';

type InvaderType = 'FUD RAIDER' | 'WHALE THIEF' | 'LIQUIDATION GHOUL' | 'RUG PULL BOSS';

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
];

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function money(n: number) {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function makeInvader(difficulty: number, profit: number, lossStreak: number): Invader {
  const roll = Math.random();
  let type: InvaderType = 'FUD RAIDER';
  if (lossStreak >= 4 && roll > 0.7) type = 'RUG PULL BOSS';
  else if (profit > 10 && roll > 0.55) type = 'WHALE THIEF';
  else if (lossStreak >= 2 && roll > 0.45) type = 'LIQUIDATION GHOUL';

  const fromLeft = Math.random() > 0.5;
  const base = {
    id: `${type}_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    x: fromLeft ? -8 : 108,
    y: 22 + Math.random() * 54,
  };

  if (type === 'RUG PULL BOSS') return { ...base, type, hp: 180 + difficulty * 18, maxHp: 180 + difficulty * 18, speed: .10 + difficulty * .01, steal: 18 + difficulty, size: 54, color: '#ff2255' };
  if (type === 'WHALE THIEF') return { ...base, type, hp: 90 + difficulty * 10, maxHp: 90 + difficulty * 10, speed: .13 + difficulty * .015, steal: 9 + difficulty, size: 42, color: '#00aaff' };
  if (type === 'LIQUIDATION GHOUL') return { ...base, type, hp: 58 + difficulty * 8, maxHp: 58 + difficulty * 8, speed: .24 + difficulty * .025, steal: 6 + difficulty, size: 34, color: '#ffaa00' };
  return { ...base, type, hp: 42 + difficulty * 5, maxHp: 42 + difficulty * 5, speed: .18 + difficulty * .02, steal: 3 + difficulty * .5, size: 28, color: '#39ff14' };
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
  const arenaRef = useRef<HTMLDivElement | null>(null);

  const pnl = tradingData.pnlToday;
  const equity = tradingData.equity;
  const lossStreak = tradingData.lossStreak;

  const difficulty = useMemo(() => {
    const profitHeat = pnl > 0 ? Math.min(6, pnl / 15) : 0;
    const lossHeat = lossStreak * 1.35;
    const positionHeat = tradingData.openPositions * 0.75;
    return clamp(1 + profitHeat + lossHeat + positionHeat, 1, 12);
  }, [pnl, lossStreak, tradingData.openPositions]);

  const levelIndex = clamp(Math.floor((difficulty - 1) / 3), 0, LEVELS.length - 1);
  const levelName = LEVELS[levelIndex];

  const vaultGirlDamage = useMemo(() => {
    const winBonus = tradingData.memory.win_rate > 0 ? tradingData.memory.win_rate * 20 : 0;
    const moodBonus = tradingData.mood === 'thriving' || tradingData.mood === 'happy' ? 12 : tradingData.mood === 'sick' ? -8 : 0;
    return clamp(30 + winBonus + moodBonus, 16, 62);
  }, [tradingData.memory.win_rate, tradingData.mood]);

  useEffect(() => {
    if (!open) return;
    const spawn = window.setInterval(() => {
      setInvaders(current => {
        const max = clamp(Math.floor(3 + difficulty), 4, 12);
        if (current.length >= max) return current;
        return [...current, makeInvader(difficulty, pnl, lossStreak)];
      });
    }, Math.max(800, 3000 - difficulty * 170));
    return () => window.clearInterval(spawn);
  }, [open, difficulty, pnl, lossStreak]);

  useEffect(() => {
    if (!open) return;
    const tick = window.setInterval(() => {
      setInvaders(current => {
        let damage = 0;
        let stolenNow = 0;
        const next = current.map(enemy => {
          const dir = enemy.x < 50 ? 1 : -1;
          const nx = enemy.x + dir * enemy.speed * (1 + difficulty / 10);
          if (Math.abs(nx - 50) < 3) {
            damage += enemy.steal;
            stolenNow += enemy.steal;
            return { ...enemy, x: enemy.x < 50 ? -10 : 110, y: 22 + Math.random() * 54 };
          }
          return { ...enemy, x: nx };
        });
        if (damage > 0) {
          setShield(s => clamp(s - damage * .7, 0, 100));
          setArmor(a => clamp(a - damage * .25, 0, 100));
          setHealth(h => clamp(h - Math.max(0, damage - armor * .05), 0, 100));
          setStolen(v => v + stolenNow);
          setMessage(`INVADERS TOUCHED VAULT CORE · ${money(stolenNow)} STOLEN`);
        }
        return next;
      });
    }, 80);
    return () => window.clearInterval(tick);
  }, [open, difficulty, armor]);

  const fireAt = (clientX?: number, clientY?: number) => {
    if (ammo <= 0) {
      setMessage('NO AMMO · PROFIT BLASTER EMPTY');
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
        setMessage('SHOT FIRED · NO TARGET');
        return current;
      }
      let best = -1;
      let dist = Infinity;
      current.forEach((e, i) => {
        const d = Math.hypot(e.x - tx, e.y - ty);
        if (d < dist) { dist = d; best = i; }
      });
      if (best < 0 || dist > 23) {
        setMessage('MISSED · RAIDERS STILL MOVING');
        return current;
      }
      const copy = [...current];
      const enemy = copy[best];
      const hp = enemy.hp - vaultGirlDamage;
      if (hp <= 0) {
        copy.splice(best, 1);
        setKills(k => k + 1);
        setShield(s => clamp(s + 3, 0, 100));
        setMessage(`${enemy.type} DESTROYED · PROFIT SECURED`);
        if (Math.random() > .55) setAmmo(a => clamp(a + 5, 0, 160));
      } else {
        copy[best] = { ...enemy, hp };
        setMessage(`${enemy.type} HIT · ${Math.ceil(hp)} HP LEFT`);
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

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1200, background: 'rgba(0,0,0,.94)', color: '#00ff66', fontFamily: 'Courier New, monospace', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #00ff44', background: '#001000' }}>
        <div>
          <div style={{ fontSize: 18, letterSpacing: 4, fontWeight: 'bold' }}>VAULT 63 DOOM DEFENCE</div>
          <div style={{ fontSize: 10, color: '#00aa44', letterSpacing: 2 }}>{levelName} · DIFFICULTY {difficulty.toFixed(1)}</div>
        </div>
        <button onClick={onClose} style={{ background: '#220000', border: '1px solid #ff5555', color: '#ff7777', borderRadius: 6, padding: '10px 14px', fontFamily: 'inherit', letterSpacing: 2 }}>EXIT</button>
      </div>

      <div
        ref={arenaRef}
        onClick={(e) => fireAt(e.clientX, e.clientY)}
        onTouchStart={(e) => { const t = e.touches[0]; if (t) fireAt(t.clientX, t.clientY); }}
        style={{ flex: 1, position: 'relative', overflow: 'hidden', cursor: 'crosshair', background: 'radial-gradient(circle at center, #082008 0%, #020802 55%, #000 100%)', touchAction: 'manipulation' }}
      >
        <div style={{ position: 'absolute', left: '43%', top: '31%', width: '14%', height: '38%', border: '3px solid #00ff44', borderRadius: 10, boxShadow: '0 0 35px #00ff4466, inset 0 0 30px #00ff4422' }} />
        <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', color: '#00ff88', fontSize: 11, letterSpacing: 2, textAlign: 'center' }}>VAULT<br/>CORE</div>

        {invaders.map(enemy => (
          <div key={enemy.id} style={{ position: 'absolute', left: `${enemy.x}%`, top: `${enemy.y}%`, transform: 'translate(-50%,-50%)', width: enemy.size, height: enemy.size, borderRadius: enemy.type.includes('BOSS') ? 4 : '50%', border: `2px solid ${enemy.color}`, color: enemy.color, background: '#050505', boxShadow: `0 0 20px ${enemy.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: enemy.type.includes('BOSS') ? 18 : 14, fontWeight: 'bold' }}>
            {enemy.type === 'WHALE THIEF' ? '🐋' : enemy.type === 'LIQUIDATION GHOUL' ? '☠' : enemy.type === 'RUG PULL BOSS' ? 'BOSS' : 'FUD'}
            <div style={{ position: 'absolute', top: -8, left: 0, height: 3, width: '100%', background: '#220000' }}>
              <div style={{ height: '100%', width: `${clamp((enemy.hp / enemy.maxHp) * 100, 0, 100)}%`, background: enemy.color }} />
            </div>
          </div>
        ))}

        {flash && <div style={{ position: 'absolute', left: '50%', bottom: '8%', transform: 'translateX(-50%)', width: 90, height: 90, borderRadius: '50%', background: 'radial-gradient(circle, #fff 0%, #00ff88 25%, transparent 70%)', opacity: .8, pointerEvents: 'none' }} />}

        <div style={{ position: 'absolute', left: 10, top: 10, color: '#ffaa00', fontSize: 12, letterSpacing: 2 }}>PROFIT HEAT: {money(Math.max(0, pnl))}</div>
        <div style={{ position: 'absolute', right: 10, top: 10, color: '#ff7777', fontSize: 12, letterSpacing: 2 }}>STOLEN: {money(stolen)}</div>
        <div style={{ position: 'absolute', left: 10, bottom: 10, right: 10, color: '#00ff88', fontSize: 12, letterSpacing: 2, textAlign: 'center' }}>{message}</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 4, padding: 8, background: '#050805', borderTop: '2px solid #00ff44', fontSize: 12, textAlign: 'center' }}>
        <div>HEALTH<br/><b style={{ color: health < 30 ? '#ff5555' : '#00ff66' }}>{Math.round(health)}</b></div>
        <div>ARMOR<br/><b>{Math.round(armor)}</b></div>
        <div>AMMO<br/><b>{ammo}</b></div>
        <div>KILLS<br/><b>{kills}</b></div>
        <div>SHIELD<br/><b>{Math.round(shield)}</b></div>
        <div>EQUITY<br/><b>{money(equity)}</b></div>
      </div>
    </div>
  );
}
