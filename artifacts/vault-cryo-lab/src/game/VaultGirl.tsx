import { VaultGirlMood } from './useTradingData';
import { Direction } from './types';

interface Props {
  direction: Direction;
  walking: boolean;
  introStep: number;
  mood?: VaultGirlMood;
  vaultState?: string;
  vaultLine?: string;
}

const MOOD_IMG: Record<VaultGirlMood, string> = {
  cryo:     '/vaultgirl/vaultgirl_cryo.png',
  idle:     '/vaultgirl/vaultgirl_idle.png',
  happy:    '/vaultgirl/vaultgirl_happy.png',
  sick:     '/vaultgirl/vaultgirl_sick.png',
  thriving: '/vaultgirl/vaultgirl_thriving.png',
  weak:     '/vaultgirl/vaultgirl_weak.png',
  zombie:   '/vaultgirl/vaultgirl_zombie.png',
};

const MOOD_PULSE: Record<VaultGirlMood, string> = {
  cryo:     'vg-sleep',
  idle:     'vg-scan',
  happy:    'vg-happy',
  sick:     'vg-warn',
  thriving: 'vg-lock',
  weak:     'vg-warn',
  zombie:   'vg-danger',
};

const MOOD_GLOW: Record<VaultGirlMood, string> = {
  cryo:     '#0096ff',
  idle:     '#00ff88',
  happy:    '#00ff88',
  sick:     '#ffaa00',
  thriving: '#00ff88',
  weak:     '#ff6400',
  zombie:   '#ff3232',
};

const MOOD_LABEL: Record<VaultGirlMood, string> = {
  cryo:     'CRYO STASIS',
  idle:     'SCANNING',
  happy:    'PROFITING',
  sick:     'RECOVERING',
  thriving: 'HUNTING',
  weak:     'DRAWDOWN',
  zombie:   'CRITICAL',
};

const MOOD_TEMP: Record<VaultGirlMood, string> = {
  cryo:     '-196°C',
  idle:     '-80°C',
  happy:    '-60°C',
  sick:     '-40°C',
  thriving: '-55°C',
  weak:     '-50°C',
  zombie:   '+4°C',
};

export function VaultGirl({ direction: _direction, walking: _walking, introStep, mood = 'idle', vaultState }: Props) {
  const opacity    = introStep < 2 ? 0 : introStep < 3 ? 0.7 : 1;
  const pulseClass = MOOD_PULSE[mood];
  const glow       = MOOD_GLOW[mood];
  const imgSrc     = MOOD_IMG[mood];
  const label      = MOOD_LABEL[mood];
  const temp       = MOOD_TEMP[mood];
  const isCryo     = mood === 'cryo';
  const isAlert    = mood === 'zombie' || mood === 'sick';
  const isGood     = mood === 'happy' || mood === 'thriving';

  const statusColor = isAlert ? '#ff4444' : isGood ? '#00ff88' : isCryo ? '#44aaff' : '#00cc66';

  return (
    <div style={{ opacity, transition: 'opacity 1s', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

      {/* ── Pod header ── */}
      <div style={{
        width: 132,
        background: 'linear-gradient(90deg, #001a2a, #002a3a, #001a2a)',
        border: '1px solid #0066aa',
        borderBottom: 'none',
        borderRadius: '6px 6px 0 0',
        padding: '3px 6px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span style={{ color: '#4499cc', fontSize: 7, letterSpacing: 2, fontFamily: 'monospace' }}>CRYO POD 01</span>
        <span style={{
          width: 6, height: 6, borderRadius: '50%',
          background: statusColor,
          boxShadow: `0 0 6px ${statusColor}`,
          display: 'inline-block',
        }} />
      </div>

      {/* ── Glass tube body ── */}
      <div style={{
        width: 132,
        background: 'linear-gradient(180deg, #001830cc 0%, #00101eee 40%, #001830cc 100%)',
        border: `1px solid ${glow}44`,
        borderTop: `1px solid ${glow}88`,
        boxShadow: `inset 0 0 20px ${glow}22, 0 0 12px ${glow}33`,
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '6px 4px 4px',
      }}>
        {/* Scan line effect */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,150,255,0.04) 3px, rgba(0,150,255,0.04) 4px)',
          zIndex: 2,
        }} />

        {/* Frost / condensation overlay */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 24,
          background: 'linear-gradient(180deg, rgba(100,200,255,0.15) 0%, transparent 100%)',
          pointerEvents: 'none', zIndex: 3,
        }} />

        {/* Side light rails */}
        <div style={{
          position: 'absolute', top: 0, bottom: 0, left: 3, width: 2,
          background: `linear-gradient(180deg, ${glow}00, ${glow}66, ${glow}00)`,
          borderRadius: 1,
        }} />
        <div style={{
          position: 'absolute', top: 0, bottom: 0, right: 3, width: 2,
          background: `linear-gradient(180deg, ${glow}00, ${glow}66, ${glow}00)`,
          borderRadius: 1,
        }} />

        {/* Vault girl image */}
        <img
          src={imgSrc}
          alt={`Vault Girl — ${mood}`}
          className={`vg-img ${pulseClass}`}
          style={{
            width: 72,
            height: 'auto',
            filter: `drop-shadow(0 0 12px ${glow}bb) drop-shadow(0 0 3px ${glow})`,
            position: 'relative',
            zIndex: 1,
            transition: 'filter 0.6s',
          }}
        />
      </div>

      {/* ── Status strip ── */}
      <div style={{
        width: 132,
        background: '#001020',
        border: `1px solid ${glow}44`,
        borderTop: `1px solid ${glow}22`,
        padding: '3px 6px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontFamily: 'monospace',
      }}>
        <span style={{ color: statusColor, fontSize: 7, letterSpacing: 1, fontWeight: 'bold' }}>{label}</span>
        <span style={{ color: '#4499cc', fontSize: 7 }}>{temp}</span>
      </div>

      {/* ── Readings bar ── */}
      <div style={{
        width: 132,
        background: '#000d1a',
        border: `1px solid #0044aa44`,
        borderTop: 'none',
        borderRadius: '0 0 6px 6px',
        padding: '3px 6px 4px',
        fontFamily: 'monospace',
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#2266aa', fontSize: 6, letterSpacing: 1 }}>VAULT GIRL</span>
          <span style={{ color: '#2266aa', fontSize: 6 }}>V-63</span>
        </div>
        {vaultState && (
          <div style={{
            color: statusColor + 'cc',
            fontSize: 6,
            letterSpacing: 0.5,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {vaultState}
          </div>
        )}
        <div style={{ color: '#223344', fontSize: 6 }}>TAB → PIP-BOY</div>
      </div>

      <style>{`
        .vg-img { display: block; }

        .vg-scan    { animation: vgScan   2.8s infinite ease-in-out; }
        .vg-lock    { animation: vgLock   1.0s infinite ease-in-out; }
        .vg-happy   { animation: vgHappy  1.8s infinite ease-in-out; }
        .vg-warn    { animation: vgWarn   1.4s infinite ease-in-out; }
        .vg-danger  { animation: vgDanger 0.75s infinite ease-in-out; }
        .vg-sleep   { opacity: 0.55; animation: vgSleep 4s infinite ease-in-out; }

        @keyframes vgScan   { 0%,100%{transform:scale(1);opacity:.92} 50%{transform:scale(1.02);opacity:1} }
        @keyframes vgLock   { 0%,100%{transform:scale(1)} 50%{transform:scale(1.04)} }
        @keyframes vgHappy  { 0%,100%{transform:scale(1) translateY(0)} 50%{transform:scale(1.03) translateY(-2px)} }
        @keyframes vgWarn   { 0%,100%{opacity:.78;transform:translateX(0)} 50%{opacity:1;transform:translateX(1px)} }
        @keyframes vgDanger { 0%,100%{opacity:.55;transform:scale(.99)} 50%{opacity:1;transform:scale(1.03)} }
        @keyframes vgSleep  { 0%,100%{opacity:.4} 50%{opacity:.65} }
      `}</style>
    </div>
  );
}
