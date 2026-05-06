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

// Animation class per mood (mirrors VaultCompanion pulse logic)
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
  cryo:     'rgba(0,150,255,0.4)',
  idle:     'rgba(0,255,136,0.4)',
  happy:    'rgba(0,255,136,0.8)',
  sick:     'rgba(255,170,0,0.5)',
  thriving: 'rgba(0,255,136,0.9)',
  weak:     'rgba(255,100,0,0.4)',
  zombie:   'rgba(255,50,50,0.7)',
};

export function VaultGirl({ direction: _direction, walking: _walking, introStep, mood = 'idle', vaultState, vaultLine }: Props) {
  const opacity = introStep < 2 ? 0 : introStep < 3 ? 0.6 : 1;
  const pulseClass = MOOD_PULSE[mood];
  const glow = MOOD_GLOW[mood];
  const imgSrc = MOOD_IMG[mood];

  return (
    <div style={{ opacity, transition: 'opacity 0.8s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <img
        src={imgSrc}
        alt={`Vault Girl ${mood}`}
        className={`vg-img ${pulseClass}`}
        style={{
          width: 52,
          height: 'auto',
          filter: `drop-shadow(0 0 10px ${glow})`,
          transition: 'filter 0.6s, opacity 0.4s',
        }}
      />

      {(vaultState || vaultLine) && (
        <div style={{
          fontSize: 7,
          color: mood === 'zombie' ? '#ff4444' : mood === 'sick' ? '#ffaa00' : mood === 'happy' || mood === 'thriving' ? '#00ff88' : '#00cc66',
          fontFamily: "'Courier New', monospace",
          letterSpacing: 0.5,
          textAlign: 'center',
          maxWidth: 70,
          lineHeight: 1.3,
          opacity: 0.85,
        }}>
          {vaultState}
        </div>
      )}

      <style>{`
        .vg-img { display: block; }

        .vg-scan {
          animation: vgScan 2.8s infinite ease-in-out;
        }
        .vg-lock {
          animation: vgLock 1s infinite ease-in-out;
        }
        .vg-happy {
          animation: vgHappy 1.8s infinite ease-in-out;
        }
        .vg-warn {
          animation: vgWarn 1.4s infinite ease-in-out;
        }
        .vg-danger {
          animation: vgDanger 0.75s infinite ease-in-out;
        }
        .vg-sleep {
          opacity: 0.55;
        }

        @keyframes vgScan {
          0%, 100% { transform: scale(1); opacity: 0.92; }
          50% { transform: scale(1.02); opacity: 1; }
        }
        @keyframes vgLock {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.04); }
        }
        @keyframes vgHappy {
          0%, 100% { transform: scale(1) translateY(0); }
          50% { transform: scale(1.03) translateY(-2px); }
        }
        @keyframes vgWarn {
          0%, 100% { opacity: 0.78; transform: translateX(0); }
          50% { opacity: 1; transform: translateX(1px); }
        }
        @keyframes vgDanger {
          0%, 100% { opacity: 0.55; transform: scale(0.99); }
          50% { opacity: 1; transform: scale(1.03); }
        }
      `}</style>
    </div>
  );
}
