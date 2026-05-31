import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type AnyTradingData = Record<string, any> | null | undefined;

type LevelId = 1 | 2 | 3 | 4;
type InvaderType = 'FUD_RAIDER' | 'WHALE_THIEF' | 'LIQUIDATION_GHOUL' | 'RUG_PULL_BOSS';

type Invader = {
  id: string;
  type: InvaderType;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  speed: number;
  stealPower: number;
  size: number;
  glow: string;
};

interface Props {
  tradingData?: AnyTradingData;
  room?: string;
  open: boolean;
  onClose: () => void;
}

const LEVELS: Record<LevelId, { name: string; room: string; note: string; minKills: number }> = {
  1: { name: 'LEVEL 1', room: 'CRYO BAY', note: 'FUD raiders breach the frozen pods.', minKills: 0 },
  2: { name: 'LEVEL 2', room: 'GENERATOR ROOM', note: 'Whale thieves cut power to steal profits.', minKills: 8 },
  3: { name: 'LEVEL 3', room: 'MEMORY CORE', note: 'Liquidation ghouls corrupt the trading brain.', minKills: 18 },
  4: { name: 'BOSS LEVEL', room: 'VAULT DOOR', note: 'Rug Pull Boss tries to empty the vault.', minKills: 32 },
};

function n(value: unknown, fallback = 0): number {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function readTodayPnl(data: AnyTradingData): number {
  return n(data?.pnlToday ?? data?.todayPnl ?? data?.dailyPnl ?? data?.pnl_today ?? 0);
}

function readLossStreak(data: AnyTradingData): number {
  return n(data?.lossStreak ?? data?.loss_streak ?? data?.memory?.loss_streak ?? 0);
}

function readPositions(data: AnyTradingData): number {
  return n(data?.openPositions ?? data?.positions ?? data?.activePositions ?? data?.open_positions ?? 0);
}

function readWinRate(data: AnyTradingData): number {
  const raw = data?.memory?.win_rate ?? data?.winRate ?? data?.win_rate ?? 0;
  const val = n(raw);
  return val <= 1 ? val * 100 : val;
}

function readEquity(data: AnyTradingData): number {
  return n(data?.equity ?? data?.balance ?? data?.portfolio_value ?? 0);
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function label(type: InvaderType): string {
  if (type === 'WHALE_THIEF') return 'WHALE THIEF';
  if (type === 'LIQUIDATION_GHOUL') return 'LIQUIDATION GHOUL';
  if (type === 'RUG_PULL_BOSS') return 'RUG PULL BOSS';
  return 'FUD RAIDER';
}

function makeInvader(type: InvaderType, difficulty: number, level: LevelId): Invader {
  const fromLeft = Math.random() > 0.5;
  const id = `${type}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const levelBoost = level * 0.25;

  if (type === 'RUG_PULL_BOSS') {
    const hp = 260 + difficulty * 30;
    return { id, type, x: fromLeft ? -10 : 110, y: 42, hp, maxHp: hp, speed: 0.08 + levelBoost, stealPower: 18 + difficulty * 2, size: 58, glow: '#ff1744' };
  }

  if (type === 'WHALE_THIEF') {
    const hp = 100 + difficulty * 14;
    return { id, type, x: fromLeft ? -8 : 108, y: 28 + Math.random() * 45, hp, maxHp: hp, speed: 0.14 + levelBoost, stealPower: 8 + difficulty, size: 42, glow: '#00b7ff' };
  }

  if (type === 'LIQUIDATION_GHOUL') {
    const hp = 70 + difficulty * 10;
    return { id, type, x: fromLeft ? -8 : 108, y: 30 + Math.random() * 42, hp, maxHp: hp, speed: 0.22 + levelBoost, stealPower: 6 + difficulty, size: 34, glow: '#ffaa00' };
  }

  const hp = 45 + difficulty * 7;
  return { id, type, x: fromLeft ? -8 : 108, y: 30 + Math.random() * 42, hp, maxHp: hp, speed: 0.18 + levelBoost, stealPower: 3 + difficulty * 0.6, size: 28, glow: '#39ff14' };
}

export default function VaultDoomInvaders({ tradingData, room = 'LAB FLOOR', open, onClose }: Props) {
  const [level, setLevel] = useState<LevelId>(1);
  const [invaders, setInvaders] = useState<Invader[]>([]);
  const [health, setHealth] = useState(100);
  const [armor, setArmor] = useState(60);
  const [ammo, setAmmo] = useState(90);
  const [kills, setKills] = useState(0);
  const [vaultShield, setVaultShield] = useState(100);
  const [stolen, setStolen] = useState(0);
  const [message, setMessage] = useState('VAULT GIRL DEFENCE SYSTEM ONLINE');
  const [flash, setFlash] = useState(false);
  const arenaRef = useRef<HTMLDivElement | null>(null);

  const todayPnl = readTodayPnl(tradingData);
  const lossStreak = readLossStreak(tradingData);
  const positions = readPositions(tradingData);
  const winRate = readWinRate(tradingData);
  const equity = readEquity(tradingData);

  const difficulty = useMemo(() => {
    const goodTradeHeat = todayPnl > 0 ? Math.min(6, todayPnl / 20) : 0;
    const badTradeHeat = Math.min(8, lossStreak * 1.8);
    const exposureHeat = Math.min(4, positions * 0.8);
    return clamp(1 + goodTradeHeat + badTradeHeat + exposureHeat + level * 0.7, 1, 15);
  }, [todayPnl, lossStreak, positions, level]);

  const girlState = useMemo(() => {
    if (lossStreak >= 4) return 'ZOMBIE PROTECTION';
    if (todayPnl < -30) return 'SICK';
    if (todayPnl < 0) return 'WEAK';
    if (todayPnl > 10) return 'THRIVING';
    return 'PATIENT';
  }, [todayPnl, lossStreak]);

  const girlDamage = useMemo(() => {
    const stateBonus = girlState === 'THRIVING' ? 18 : girlState === 'SICK' ? -8 : girlState === 'ZOMBIE PROTECTION' ? 8 : 0;
    return clamp(30 + winRate * 0.25 + stateBonus, 16, 70);
  }, [girlState, winRate]);

  useEffect(() => {
    if (!open) return;
    const nextLevel = kills >= LEVELS[4].minKills ? 4 : kills >= LEVELS[3].minKills ? 3 : kills >= LEVELS[2].minKills ? 2 : 1;
    setLevel(nextLevel as LevelId);
  }, [kills, open]);

  useEffect(() => {
    if (!open) return;

    const timer = window.setInterval(() => {
      setInvaders((current) => {
        const maxInvaders = clamp(Math.floor(3 + difficulty * 0.8), 4, 14);
        if (current.length >= maxInvaders) return current;

        let type: InvaderType = 'FUD_RAIDER';
        const roll = Math.random();

        if (level >= 4 && roll > 0.62) type = 'RUG_PULL_BOSS';
        else if (level >= 3 && (lossStreak >= 2 || roll > 0.55)) type = 'LIQUIDATION_GHOUL';
        else if (level >= 2 && (todayPnl > 5 || roll > 0.62)) type = 'WHALE_THIEF';
        else if (todayPnl > 20 && roll > 0.7) type = 'WHALE_THIEF';

        return [...current, makeInvader(type, difficulty, level)];
      });
    }, Math.max(650, 2500 - difficulty * 120));

    return () => window.clearInterval(timer);
  }, [open, difficulty, level, todayPnl, lossStreak]);

  useEffect(() => {
    if (!open) return;

    const timer = window.setInterval(() => {
      setInvaders((current) => {
        let stolenNow = 0;
        let hitNow = 0;

        const moved = current
          .map((enemy) => {
            const dir = enemy.x < 50 ? 1 : -1;
            const nextX = enemy.x + dir * enemy.speed;

            if (Math.abs(nextX - 50) < 4) {
              stolenNow += enemy.stealPower;
              hitNow += enemy.type === 'RUG_PULL_BOSS' ? 12 : 4;
              return null;
            }

            return { ...enemy, x: nextX };
          })
          .filter(Boolean) as Invader[];

        if (stolenNow > 0) {
          setStolen((s) => s + stolenNow);
          setVaultShield((s) => clamp(s - stolenNow * 0.8, 0, 100));
          setHealth((h) => clamp(h - Math.max(0, hitNow - armor * 0.03), 0, 100));
          setArmor((a) => clamp(a - hitNow * 0.4, 0, 100));
          setMessage(`BREACH! INVADERS STOLE $${stolenNow.toFixed(2)} FROM THE VAULT`);
        }

        return moved;
      });
    }, 80);

    return () => window.clearInterval(timer);
  }, [open, armor]);

  useEffect(() => {
    if (!open) return;
    if (todayPnl > 0) {
      setVaultShield((s) => clamp(s + 0.25, 0, 100));
      setAmmo((a) => clamp(a + 0.05, 0, 160));
    }
    if (todayPnl < 0 || lossStreak > 0) {
      setVaultShield((s) => clamp(s - 0.08 * Math.max(1, lossStreak), 0, 100));
    }
  }, [todayPnl, lossStreak, open]);

  const fireAt = useCallback((clientX?: number, clientY?: number) => {
    if (!open) return;
    if (ammo <= 0) {
      setMessage('NO AMMO - PROFIT NEEDED TO RECHARGE');
      return;
    }

    setAmmo((a) => Math.max(0, a - 1));
    setFlash(true);
    window.setTimeout(() => setFlash(false), 90);

    const rect = arenaRef.current?.getBoundingClientRect();
    const targetX = rect && clientX !== undefined ? ((clientX - rect.left) / rect.width) * 100 : 50;
    const targetY = rect && clientY !== undefined ? ((clientY - rect.top) / rect.height) * 100 : 50;

    let killed = false;

    setInvaders((current) => {
      if (current.length === 0) {
        setMessage('SHOT FIRED - NO TARGET');
        return current;
      }

      let bestIndex = -1;
      let bestDistance = Infinity;

      current.forEach((enemy, index) => {
        const dx = enemy.x - targetX;
        const dy = enemy.y - targetY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestIndex = index;
        }
      });

      if (bestIndex < 0 || bestDistance > 22) {
        setMessage('MISSED - SWIPE AIM AND TAP ENEMY');
        return current;
      }

      const copy = [...current];
      const enemy = copy[bestIndex];
      const nextHp = enemy.hp - girlDamage;

      if (nextHp <= 0) {
        copy.splice(bestIndex, 1);
        killed = true;
        setKills((k) => k + 1);
        setVaultShield((s) => clamp(s + 3, 0, 100));
        setMessage(`${label(enemy.type)} DESTROYED - PROFIT SECURED`);
      } else {
        copy[bestIndex] = { ...enemy, hp: nextHp };
        setMessage(`${label(enemy.type)} HIT - ${Math.ceil(nextHp)} HP LEFT`);
      }

      return copy;
    });

    if (killed && Math.random() > 0.55) {
      setAmmo((a) => clamp(a + 4, 0, 160));
    }
  }, [ammo, girlDamage, open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.code === 'Escape') onClose();
      if (e.code === 'Space') {
        e.preventDefault();
        fireAt();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, fireAt, onClose]);

  if (!open) return null;

  const levelInfo = LEVELS[level];

  return (
    <div className="doom-modal" role="dialog" aria-label="Vault Doom Defence">
      <div className="doom-shell">
        <div className="doom-topbar">
          <div>
            <div className="doom-title">VAULT 63 DOOM DEFENCE</div>
            <div className="doom-subtitle">{levelInfo.name} • {levelInfo.room} • GIRL STATE: {girlState}</div>
          </div>
          <button className="doom-close" type="button" onClick={onClose}>CLOSE</button>
        </div>

        <div className="doom-story">
          <b>{levelInfo.note}</b><br />
          Good trades attract thieves. Bad trades weaken the shield. Vault Girl fights them off.
        </div>

        <div
          ref={arenaRef}
          className={`doom-arena level-${level}`}
          onClick={(e) => fireAt(e.clientX, e.clientY)}
          onTouchStart={(e) => {
            e.preventDefault();
            const t = e.touches[0];
            if (t) fireAt(t.clientX, t.clientY);
          }}
        >
          <div className="doom-core">
            <div className="doom-core-ring" />
            <div className="doom-core-text">VAULT<br />CORE</div>
          </div>

          {invaders.map((enemy) => (
            <div
              key={enemy.id}
              className="doom-invader"
              style={{
                left: `${enemy.x}%`,
                top: `${enemy.y}%`,
                width: enemy.size,
                height: enemy.size,
                boxShadow: `0 0 18px ${enemy.glow}`,
                borderColor: enemy.glow,
              }}
            >
              <div className="doom-enemy-face">
                {enemy.type === 'RUG_PULL_BOSS' ? '☠' : enemy.type === 'WHALE_THIEF' ? '₿' : enemy.type === 'LIQUIDATION_GHOUL' ? '!' : '$'}
              </div>
              <div className="doom-enemy-name">{label(enemy.type)}</div>
              <div className="doom-enemy-hp" style={{ width: `${(enemy.hp / enemy.maxHp) * 100}%` }} />
            </div>
          ))}

          {flash && <div className="doom-muzzle">✦</div>}
          <div className="doom-message">{message}</div>
        </div>

        <div className="doom-hud">
          <div><span>HEALTH</span><b>{Math.round(health)}</b></div>
          <div><span>ARMOR</span><b>{Math.round(armor)}</b></div>
          <div><span>AMMO</span><b>{Math.round(ammo)}</b></div>
          <div><span>KILLS</span><b>{kills}</b></div>
          <div><span>ENEMIES</span><b>{invaders.length}</b></div>
          <div><span>SHIELD</span><b>{Math.round(vaultShield)}</b></div>
        </div>

        <div className="doom-trade-feed">
          <div>EQUITY: ${equity.toFixed(2)}</div>
          <div>TODAY: ${todayPnl.toFixed(2)}</div>
          <div>POSITIONS: {positions}</div>
          <div>LOSS STREAK: {lossStreak}</div>
          <div>DIFFICULTY: {difficulty.toFixed(1)}</div>
          <div>STOLEN: ${stolen.toFixed(2)}</div>
        </div>

        {health <= 0 && (
          <div className="doom-gameover">
            VAULT OVERRUN<br />
            <button type="button" onClick={() => {
              setHealth(100); setArmor(60); setAmmo(90); setKills(0); setStolen(0); setVaultShield(100); setInvaders([]); setMessage('VAULT DEFENCE REBOOTED');
            }}>REBOOT DEFENCE</button>
          </div>
        )}
      </div>
    </div>
  );
}
