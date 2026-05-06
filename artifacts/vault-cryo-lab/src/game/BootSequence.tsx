import { useEffect, useState } from 'react';

interface Props {
  onComplete: () => void;
}

const BOOT_LINES = [
  { text: 'VAULT-TEC UNIFIED OPERATING SYSTEM v7.1.0.8', delay: 0,    color: '#ffd040', bold: true },
  { text: 'COPYRIGHT 2075 VAULT-TEC CORPORATION. ALL RIGHTS RESERVED.', delay: 120, color: '#c8a000' },
  { text: '', delay: 200 },
  { text: 'CRYOGENIC LABORATORY — SECTOR 63 — VAULT 63', delay: 320,  color: '#88aacc' },
  { text: 'EMERGENCY POWER RESTORED — INITIALIZING SUBSYSTEMS', delay: 500, color: '#ffaa00' },
  { text: '', delay: 620 },
  { text: 'BIOS v2.3.1 ................... OK', delay: 750,  color: '#00ff44' },
  { text: 'MEMORY CORE .................. OK', delay: 920,  color: '#00ff44' },
  { text: 'REACTOR STATUS ............... ONLINE', delay: 1100, color: '#00ff44' },
  { text: 'ATMO SYSTEMS ................. OPTIMAL', delay: 1280, color: '#00ff44' },
  { text: 'CRYO ARRAY ................... FAULT [1/12 PODS]', delay: 1460, color: '#ff5555' },
  { text: 'RADIATION SHIELDING .......... NOMINAL', delay: 1640, color: '#00ff44' },
  { text: 'AI TRADE ENGINE .............. CONNECTING...', delay: 1820, color: '#ffaa00' },
  { text: '', delay: 2000 },
  { text: '> CRYO STATUS REPORT:', delay: 2100, color: '#00aaff', bold: true },
  { text: '  ACTIVE PODS:   01 / 12', delay: 2250, color: '#00aaff' },
  { text: '  SUBJECT:       THAWED — EMERGENCY OVERRIDE', delay: 2400, color: '#00aaff' },
  { text: '  ELAPSED TIME:  210 YEARS, 0 DAYS', delay: 2550, color: '#00aaff' },
  { text: '', delay: 2680 },
  { text: '> MARKET FEEDS:', delay: 2780, color: '#ffaa00', bold: true },
  { text: '  BTC-USD ▲  ETH-USD ▲  SOL-USD ◆  ONLINE', delay: 2930, color: '#00ff88' },
  { text: '  AI TRADING BOT ............. STANDBY', delay: 3080, color: '#00ff88' },
  { text: '', delay: 3200 },
  { text: '> VAULT GIRL STATUS: LOADING', delay: 3300, color: '#ff88cc' },
  { text: '', delay: 3440 },
  { text: '████████████████████████████ 100%', delay: 3560, color: '#00ff44' },
  { text: '', delay: 3700 },
  { text: 'WELCOME TO VAULT 63 — INITIATING EMERGENCY THAW SEQUENCE', delay: 3820, color: '#ffd040', bold: true },
];

const TOTAL_DURATION = 4800;

export function BootSequence({ onComplete }: Props) {
  const [visibleCount, setVisibleCount] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);
  const [blink, setBlink] = useState(true);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    BOOT_LINES.forEach((line, i) => {
      timers.push(setTimeout(() => setVisibleCount(i + 1), line.delay));
    });

    timers.push(setTimeout(() => setFadeOut(true), TOTAL_DURATION - 400));
    timers.push(setTimeout(onComplete, TOTAL_DURATION));

    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  useEffect(() => {
    const t = setInterval(() => setBlink(b => !b), 530);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 999,
      background: '#000300',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      padding: '10vh 12vw',
      fontFamily: "'Courier New', Courier, monospace",
      opacity: fadeOut ? 0 : 1,
      transition: fadeOut ? 'opacity 0.4s ease-in' : 'none',
      overflow: 'hidden',
    }}>
      {/* Top border */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: 'linear-gradient(90deg, transparent, #c8a000, #ffd040, #c8a000, transparent)',
      }} />

      {/* Scanline overlay */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,255,0,0.025) 3px, rgba(0,255,0,0.025) 4px)',
      }} />

      {/* Vault-Tec logo top-left */}
      <div style={{
        position: 'absolute', top: 20, left: 24,
        color: '#c8a000', fontSize: 11, letterSpacing: 5, opacity: 0.7,
      }}>
        VAULT-TEC
      </div>

      {/* Lines */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1.5, maxHeight: '75vh', overflow: 'hidden' }}>
        {BOOT_LINES.slice(0, visibleCount).map((line, i) => (
          <div
            key={i}
            style={{
              color: line.color ?? '#00cc44',
              fontSize: 'clamp(9px, 1.1vw, 13px)',
              fontWeight: line.bold ? 'bold' : 'normal',
              letterSpacing: line.bold ? 2 : 0.5,
              lineHeight: 1.55,
              opacity: line.text === '' ? 0.3 : 1,
            }}
          >
            {line.text || '\u00A0'}
          </div>
        ))}

        {/* Blinking cursor */}
        {visibleCount > 0 && visibleCount < BOOT_LINES.length && (
          <span style={{ color: '#00ff44', fontSize: 13, opacity: blink ? 1 : 0 }}>█</span>
        )}
      </div>

      {/* Bottom border */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 3,
        background: 'linear-gradient(90deg, transparent, #c8a000, #ffd040, #c8a000, transparent)',
      }} />

      {/* Corner screws */}
      {[[16, 14], ['calc(100% - 26px)', 14], [16, 'calc(100% - 24px)'], ['calc(100% - 26px)', 'calc(100% - 24px)']].map(([l, t], i) => (
        <div key={i} style={{
          position: 'absolute', left: l as string | number, top: t as string | number,
          width: 10, height: 10, borderRadius: '50%',
          border: '1px solid #3a2a00', background: '#1a1200',
        }} />
      ))}
    </div>
  );
}
