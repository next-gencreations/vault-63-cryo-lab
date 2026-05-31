

import React, { useEffect, useMemo, useRef, useState } from 'react';

type TradingData = {
  equity?: number;
  todayPnl?: number;
  pnlToday?: number;
  dailyPnl?: number;
  positions?: number;
  activePositions?: number;
  lossStreak?: number;
  winRate?: number;
  memoryTrades?: number;
  wins?: number;
  losses?: number;
  brainMode?: string;
  avoidMode?: boolean | string;
};

type InvaderType = 'FUD_RAIDER' | 'LIQUIDATION_GHOUL' | 'WHALE_THIEF' | 'RUG_PULL_BOSS';

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

type VaultDoomInvadersProps = {
  tradingData?: TradingData | null;
  room?: string;
  visible?: boolean;
};

function getTodayPnl(data?: TradingData | null): number {
  if (!data) return 0;
  return Number(data.todayPnl ?? data.pnlToday ?? data.dailyPnl ?? 0);
}

function getPositions(data?: TradingData | null): number {
  if (!data) return 0;
  return Number(data.positions ?? data.activePositions ?? 0);
}

function getLossStreak(data?: TradingData | null): number {
  if (!data) return 0;
  return Number(data.lossStreak ?? 0);
}

function getWinRate(data?: TradingData | null): number {
  if (!data) return 0;
  return Number(data.winRate ?? 0);
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function makeInvader(type: InvaderType, difficulty: number): Invader {
  const id = `${type}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  const fromLeft = Math.random() > 0.5;

  if (type === 'RUG_PULL_BOSS') {
    return {
      id,
      type,
      x: fromLeft ? -8 : 108,
      y: 38 + Math.random() * 22,
      hp: 160 + difficulty * 22,
      maxHp: 160 + difficulty * 22,
      speed: 0.08 + difficulty * 0.015,
      stealPower: 12 + difficulty * 2,
      size: 46,
      glow: '#ff0033',
    };
  }

  if (type === 'WHALE_THIEF') {
    return {
      id,
      type,
      x: fromLeft ? -8 : 108,
      y: 35 + Math.random() * 30,
      hp: 90 + difficulty * 12,
      maxHp: 90 + difficulty * 12,
      speed: 0.10 + difficulty * 0.018,
      stealPower: 8 + difficulty,
      size: 36,
      glow: '#00aaff',
    };
  }

  if (type === 'LIQUIDATION_GHOUL') {
    return {
      id,
      type,
      x: fromLeft ? -8 : 108,
      y: 30 + Math.random() * 38,
      hp: 48 + difficulty * 8,
      maxHp: 48 + difficulty * 8,
      speed: 0.22 + difficulty * 0.04,
      stealPower: 4 + difficulty,
      size: 28,
      glow: '#ffaa00',
    };
  }

  return {
    id,
    type,
    x: fromLeft ? -8 : 108,
    y: 30 + Math.random() * 40,
    hp: 35 + difficulty * 6,
    maxHp: 35 + difficulty * 6,
    speed: 0.16 + difficulty * 0.025,
    stealPower: 2 + difficulty * 0.5,
    size: 24,
    glow: '#39ff14',
  };
}

function invaderLabel(type: InvaderType) {
  switch (type) {
    case 'FUD_RAIDER': return 'FUD RAIDER';
    case 'LIQUIDATION_GHOUL': return 'LIQUIDATION GHOUL';
    case 'WHALE_THIEF': return 'WHALE THIEF';
    case 'RUG_PULL_BOSS': return 'RUG PULL BOSS';
    default: return 'INVADER';
  }
}

export default function VaultDoomInvaders({ tradingData, room = 'LAB FLOOR', visible = true }: VaultDoomInvadersProps) {
  const [invaders, setInvaders] = useState<Invader[]>([]);
  const [health, setHealth] = useState(100);
  const [armor, setArmor] = useState(50);
  const [ammo, setAmmo] = useState(80);
  const [kills, setKills] = useState(0);
  const [stolen, setStolen] = useState(0);
  const [vaultShield, setVaultShield] = useState(100);
  const [message, setMessage] = useState('VAULT DEFENCE ONLINE');
  const [muzzleFlash, setMuzzleFlash] = useState(false);
  const arenaRef = useRef<HTMLDivElement | null>(null);

  const todayPnl = getTodayPnl(tradingData);
  const lossStreak = getLossStreak(tradingData);
  const winRate = getWinRate(tradingData);
  const positions = getPositions(tradingData);
  const equity = Number(tradingData?.equity ?? 0);

  const difficulty = useMemo(() => {
    const profitHeat = todayPnl > 0 ? Math.min(5, todayPnl / 25) : 0;
    const lossHeat = lossStreak * 1.5;
    const activeHeat = positions * 0.75;
    return clamp(1 + profitHeat + lossHeat + activeHeat, 1, 12);
  }, [todayPnl, lossStreak, positions]);

  const vaultGirlState = useMemo(() => {
    if (lossStreak >= 4) return 'ZOMBIE PROTECTION';
    if (todayPnl < -25) return 'SICK';
    if (todayPnl < 0) return 'WEAK';
    if (todayPnl > 10) return 'THRIVING';
    return 'PATIENT';
  }, [todayPnl, lossStreak]);

  const vaultGirlDamage = useMemo(() => {
    const winBonus = winRate > 0 ? winRate / 10 : 0;
    const moodBonus = vaultGirlState === 'THRIVING' ? 15 : vaultGirlState === 'SICK' ? -8 : 0;
    return clamp(28 + winBonus + moodBonus, 12, 55);
  }, [winRate, vaultGirlState]);

  useEffect(() => {
    if (!visible) return;
    const spawnTimer = window.setInterval(() => {
      setInvaders((current) => {
        const maxInvaders = clamp(Math.floor(2 + difficulty), 3, 12);
        if (current.length >= maxInvaders) return current;

        let type: InvaderType = 'FUD_RAIDER';
        const roll = Math.random();

        if (lossStreak >= 4 && roll > 0.72) type = 'RUG_PULL_BOSS';
        else if (todayPnl > 20 && roll > 0.68) type = 'WHALE_THIEF';
        else if (lossStreak >= 2 && roll > 0.50) type = 'LIQUIDATION_GHOUL';
        else if (roll > 0.78) type = 'WHALE_THIEF';

        const next = makeInvader(type, difficulty);
        return [...current, next];
      });
    }, Math.max(900, 3200 - difficulty * 180));

#f76969;

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
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < bestDistance) {
          bestDistance = dist;
          bestIndex = index;
        }
      });

      if (bestIndex === -1 || bestDistance > 20) {
        setMessage('MISSED - INVADERS STILL MOVING');
        return current;
      }

      const copy = [...current];
      const enemy = copy[bestIndex];
      const nextHp = enemy.hp - vaultGirlDamage;

      if (nextHp <= 0) {
        killed = true;
        copy.splice(bestIndex, 1);
        setKills((k) => k + 1);
        setMessage(`${invaderLabel(enemy.type)} DESTROYED - PROFIT SECURED`);
        setVaultShield((s) => clamp(s + 2, 0, 100));
      } else {
        copy[bestIndex] = { ...enemy, hp: nextHp };
        setMessage(`${invaderLabel(enemy.type)} HIT - ${Math.ceil(nextHp)} HP LEFT`);
      }

      return copy;
    });

    if (killed && Math.random() > 0.65) {
      setAmmo((a) => clamp(a + 3, 0, 160));
    }
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.code === 'Space') {
        e.preventDefault();
        fireAt();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  if (!visible) return null;

  return (
    <div className="doom-shell">
      <div className="doom-title-row">
        <div>
          <div className="doom-title">VAULT 63 DOOM DEFENCE</div>
          <div className="doom-subtitle">ROOM: {room} • GIRL STATE: {vaultGirlState}</div>
        </div>
        <div className="doom-alert">DIFFICULTY {difficulty.toFixed(1)}</div>
      </div>

      <div
        ref={arenaRef}
        className="doom-arena"
        onClick={(e) => fireAt(e.clientX, e.clientY)}
        onTouchStart={(e) => {
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
            <div className="doom-enemy-face">{enemy.type === 'RUG_PULL_BOSS' ? '☠' : enemy.type === 'WHALE_THIEF' ? '₿' : enemy.type === 'LIQUIDATION_GHOUL' ? '!' : '$'}</div>
            <div className="doom-enemy-hp" style={{ width: `${(enemy.hp / enemy.maxHp) * 100}%` }} />
          </div>
        ))}

        {muzzleFlash && <div className="doom-muzzle">✦</div>}

        <div className="doom-message">{message}</div>
      </div>

      <div className="doom-hud">
        <div><span>HEALTH</span><b>{Math.round(health)}</b></div>
        <div><span>ARMOR</span><b>{Math.round(armor)}</b></div>
        <div><span>AMMO</span><b>{ammo}</b></div>
        <div><span>KILLS</span><b>{kills}</b></div>
        <div><span>ENEMIES</span><b>{invaders.length}</b></div>
        <div><span>SHIELD</span><b>{Math.round(vaultShield)}</b></div>
      </div>

      <div className="doom-trade-feed">
        <div>EQUITY: ${equity.toFixed(2)}</div>
        <div>TODAY: ${todayPnl.toFixed(2)}</div>
        <div>LOSS STREAK: {lossStreak}</div>
        <div>STOLEN: ${stolen.toFixed(2)}</div>
        <div>RULE: GOOD TRADES ATTRACT THIEVES • BAD TRADES WEAKEN DEFENCE</div>
      </div>
    </div>
  );
}

--------------------------------------------------
END OF CODE
--------------------------------------------------

CSS TO ADD
----------
Add this to the bottom of:

src/index.css

--------------------------------------------------
START OF CSS
--------------------------------------------------

.doom-shell {
  margin: 18px 0;
  padding: 18px;
  border: 1px solid #00ff66;
  border-radius: 18px;
  background: radial-gradient(circle at center, rgba(0, 255, 102, 0.08), rgba(0, 0, 0, 0.82));
  box-shadow: 0 0 24px rgba(0, 255, 102, 0.25), inset 0 0 24px rgba(0, 255, 102, 0.10);
  color: #79ff9d;
  pointer-events: auto !important;
  touch-action: manipulation !important;
}

.doom-title-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
  margin-bottom: 14px;
}

.doom-title {
  font-size: 26px;
  font-weight: 900;
  letter-spacing: 4px;
}

.doom-subtitle {
  font-size: 13px;
  opacity: 0.85;
  margin-top: 4px;
}

.doom-alert {
  border: 1px solid #00ff66;
  padding: 8px 10px;
  border-radius: 10px;
  font-size: 14px;
  white-space: nowrap;
  box-shadow: 0 0 12px rgba(0,255,102,0.22);
}

.doom-arena {
  position: relative;
  height: 340px;
  overflow: hidden;
  border: 2px solid #00ff66;
  border-radius: 14px;
  background:
    linear-gradient(rgba(0,255,102,0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0,255,102,0.05) 1px, transparent 1px),
    radial-gradient(circle at center, rgba(0,80,35,0.72), rgba(0,0,0,0.92));
  background-size: 20px 20px, 20px 20px, cover;
  cursor: crosshair;
  touch-action: manipulation;
}

.doom-core {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 92px;
  height: 92px;
  border: 2px solid #00ff66;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: #00ff66;
  font-weight: 900;
  letter-spacing: 2px;
  text-shadow: 0 0 12px #00ff66;
  box-shadow: 0 0 25px rgba(0,255,102,0.5), inset 0 0 25px rgba(0,255,102,0.15);
}

.doom-core-ring {
  position: absolute;
  inset: -10px;
  border: 1px dashed rgba(0,255,102,0.55);
  border-radius: 50%;
  animation: doomSpin 5s linear infinite;
}

.doom-core-text {
  position: relative;
  z-index: 2;
}

.doom-invader {
  position: absolute;
  transform: translate(-50%, -50%);
  border: 2px solid #39ff14;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-weight: 900;
  text-shadow: 0 0 10px currentColor;
}

.doom-enemy-face {
  font-size: 18px;
}

.doom-enemy-hp {
  position: absolute;
  left: 0;
  bottom: -6px;
  height: 3px;
  background: #00ff66;
  box-shadow: 0 0 8px #00ff66;
}

.doom-muzzle {
  position: absolute;
  left: 50%;
  bottom: 18px;
  transform: translateX(-50%);
  font-size: 70px;
  color: #ffffff;
  text-shadow: 0 0 20px #00ff66, 0 0 40px #ffffff;
  pointer-events: none;
}

.doom-message {
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: 12px;
  padding: 8px;
  border: 1px solid rgba(0,255,102,0.45);
  background: rgba(0,0,0,0.75);
  color: #8cffaa;
  font-size: 13px;
  text-align: center;
}

.doom-hud {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-top: 12px;
}

.doom-hud div {
  border: 1px solid rgba(0,255,102,0.55);
  border-radius: 10px;
  padding: 8px;
  background: rgba(0,20,8,0.75);
  text-align: center;
}

.doom-hud span {
  display: block;
  font-size: 11px;
  opacity: 0.82;
}

.doom-hud b {
  display: block;
  font-size: 22px;
  color: #ffffff;
  text-shadow: 0 0 12px #00ff66;
}

.doom-trade-feed {
  margin-top: 12px;
  border-top: 1px dashed rgba(0,255,102,0.45);
  padding-top: 10px;
  font-size: 14px;
  line-height: 1.45;
}

@keyframes doomSpin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@media (max-width: 600px) {
  .doom-title {
    font-size: 20px;
    letter-spacing: 2px;
  }

  .doom-arena {
    height: 300px;
  }

  .doom-hud {
    grid-template-columns: repeat(2, 1fr);
  }
}

--------------------------------------------------
END OF CSS
--------------------------------------------------

HOW TO ADD IT TO THE APP
------------------------
Find the screen where you show Vault Companion / Command Deck.
It may be in:

src/App.tsx
or
src/game/Game.tsx
or
src/game/VaultGirl.tsx

Add this import at the top:

import VaultDoomInvaders from './game/VaultDoomInvaders';

If the file you are editing is already inside src/game, use:

import VaultDoomInvaders from './VaultDoomInvaders';

Then add this component below the Vault Girl / System Status section:

<VaultDoomInvaders
  tradingData={tradingData}
  room={currentRoom}
  visible={true}
/>

If your variables have different names, use the closest ones:

<VaultDoomInvaders
  tradingData={data}
  room="LAB FLOOR"
  visible={true}
/>

BUTTONS NOT WORKING FIX
-----------------------
If mobile buttons stop working because a panel sits over them, add this to bottom of src/index.css:

button,
a,
[role='button'] {
  pointer-events: auto !important;
  touch-action: manipulation !important;
  position: relative;
  z-index: 50;
}

.vault-companion,
.vault-girl,
.companion-panel,
.memory-core {
  pointer-events: none !important;
}

.vault-companion button,
.vault-girl button,
.companion-panel button,
.memory-core button {
  pointer-events: auto !important;
}

NEXT UPGRADE IDEAS
------------------
1. Add rooms: Cryo Bay, Med Bay, Trade Floor, Vault Door, Memory Core.
2. Make each room have a different enemy type.
3. Add boss fight when loss streak hits 4.
4. Add treasure chest when trade closes green.
5. Add Vault Girl voice messages.
6. Add a shop where profit buys upgrades.
7. Add auto-defence turrets when win rate improves.
8. Add emergency lockdown when bot avoid mode turns on.

IMPORTANT
---------
This is the Doom-style invader concept as a React overlay system.
It does not replace your existing Vault Girl.
It sits underneath/near her and uses the same AI trader data.

