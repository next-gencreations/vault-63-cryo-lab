import { useEffect, useState } from 'react';
import { TERMINAL_CONTENT, TERMINALS } from './constants';
import { TradingData } from './useTradingData';

interface Props {
  terminalId: string | null;
  onClose: () => void;
  tradingData?: TradingData;
}

function fmtUsd(n: number) {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function sign(n: number) { return n >= 0 ? '+' : ''; }

function buildMainframeLines(td: TradingData): string[] {
  const statusIcon = td.status === 'ACTIVE' ? '● ACTIVE'
    : td.status === 'WEAK SIGNAL' ? '◐ WEAK SIGNAL'
    : '○ OFFLINE';

  const lines: string[] = [
    '> NEXT-GEN AI TRADING SYSTEM v3.1.0',
    '  Classification: EYES ONLY',
    '',
    `> BOT STATUS: ${statusIcon}`,
    `  Mode:       ${td.botMode}`,
    `  Room:       ${td.vaultRoom}`,
    `  Heartbeat:  ${td.connected ? td.secondsAgo + 's ago' : 'NO SIGNAL'}`,
    '',
    `> COMPANION STATE: ${td.vaultState}`,
    `  ${td.vaultLine}`,
    '',
    '> PORTFOLIO OVERVIEW:',
    `  Equity:      ${fmtUsd(td.equity)}`,
    `  Today P&L:   ${sign(td.pnlToday)}${fmtUsd(td.pnlToday)}`,
    `  Positions:   ${td.openPositions} OPEN`,
    `  Loss Streak: ${td.lossStreak}x`,
    '',
    '> MEMORY CORE:',
    `  Trades:    ${td.memory.total}  (W:${td.memory.wins} / L:${td.memory.losses})`,
    `  Win Rate:  ${(td.memory.win_rate * 100).toFixed(1)}%`,
    `  Avg P&L:   ${sign(td.memory.avg_pnl)}${fmtUsd(td.memory.avg_pnl)}`,
    '',
    '> BOT BRAIN:',
    `  Mode:        ${td.brain.mode || '—'}`,
    `  Avoid Mode:  ${td.brain.avoid_active ? '*** ACTIVE ***' : 'OFF'}`,
  ];

  if (td.markets.length > 0) {
    lines.push('');
    lines.push('> WATCHLIST:');
    lines.push('  ' + td.markets.join('  ·  '));
  }

  if (!td.connected) {
    lines.push('');
    lines.push('> *** CONNECTION ERROR ***');
    lines.push('  Set dashboard URL in Pip-Boy');
    lines.push('  TRADE screen to connect live data.');
  }

  lines.push('');
  lines.push('> SECURITY NOTICE:');
  lines.push('  Unauthorized access is prohibited.');
  lines.push('  Vault-Tec assumes no liability for');
  lines.push('  losses incurred post-nuclear event.');

  return lines;
}

export function TerminalModal({ terminalId, onClose, tradingData }: Props) {
  const [visibleLines, setVisibleLines] = useState(0);
  const [blink, setBlink] = useState(true);

  const terminal = TERMINALS.find(t => t.id === terminalId);
  const isMainframe = terminalId === 'mainframe';

  const content = isMainframe && tradingData
    ? { title: 'VAULT-TEC MAINFRAME — AI TRADING CORE', lines: buildMainframeLines(tradingData) }
    : terminalId ? TERMINAL_CONTENT[terminalId] : null;

  useEffect(() => {
    if (!content) return;
    setVisibleLines(0);
    const interval = setInterval(() => {
      setVisibleLines(v => {
        if (v >= content.lines.length) { clearInterval(interval); return v; }
        return v + 1;
      });
    }, 50);
    return () => clearInterval(interval);
  }, [terminalId, tradingData?.lastUpdated]);

  useEffect(() => {
    const t = setInterval(() => setBlink(b => !b), 500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === 'Escape' || e.code === 'KeyE') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!terminalId || !content || !terminal) return null;

  const pnlPositive = isMainframe && tradingData && tradingData.pnlToday > 0;
  const pnlNegative = isMainframe && tradingData && tradingData.pnlToday < 0;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 900,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.75)',
      touchAction: 'manipulation',
    }}>
      <div style={{
        width: 680,
        background: '#000a00',
        border: `2px solid ${terminal.color}`,
        borderRadius: 4,
        boxShadow: `0 0 40px ${terminal.color}44, 0 0 80px ${terminal.color}22`,
        fontFamily: "'Courier New', monospace",
        overflow: 'hidden',
        maxWidth: '96vw',
        maxHeight: '92vh',
        position: 'relative',
      }}>
        <button
          onClick={onClose}
          onTouchStart={(e) => { e.stopPropagation(); onClose(); }}
          aria-label="Close terminal"
          style={{
            position: 'absolute', top: 8, right: 8, zIndex: 5,
            background: '#110000', border: '1px solid #ff5555', color: '#ff7777',
            borderRadius: 6, padding: '8px 12px', fontFamily: 'inherit',
            fontSize: 12, letterSpacing: 2, cursor: 'pointer', touchAction: 'manipulation',
          }}
        >CLOSE</button>

        {/* Header */}
        <div style={{
          background: terminal.color + '22', borderBottom: `1px solid ${terminal.color}44`,
          padding: '6px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div style={{ color: terminal.color, fontSize: 11, letterSpacing: 2 }}>VAULT-TEC UNIFIED OPERATING SYSTEM</div>
          <div style={{ color: terminal.color, fontSize: 10, opacity: 0.7 }}>v7.1.0.8</div>
        </div>

        {/* Content */}
        <div style={{ padding: '16px 20px', minHeight: 360, maxHeight: '70vh', overflow: 'auto', position: 'relative' }}>
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.08) 3px, rgba(0,0,0,0.08) 4px)',
          }} />

          <div style={{ color: terminal.color, fontSize: 13, fontWeight: 'bold', letterSpacing: 2, marginBottom: 12, borderBottom: `1px solid ${terminal.color}33`, paddingBottom: 6 }}>
            {content.title}
          </div>

          <div style={{ fontSize: 11, lineHeight: 1.75, color: terminal.color + 'cc' }}>
            {content.lines.slice(0, visibleLines).map((line, i) => {
              const isPositive = isMainframe && (line.includes('+$') && !line.includes('-'));
              const isNegative = isMainframe && line.includes('-$');
              const isAlert    = line.includes('*** ') || line.includes('CRITICAL') || line.includes('ERROR') || line.includes('OFFLINE') || line.includes('DANGER');
              return (
                <div key={i} style={{
                  opacity: line === '' ? 0.3 : 1,
                  color: isAlert ? '#ff6644'
                    : isPositive ? '#00ff88'
                    : isNegative ? '#ff5555'
                    : line.startsWith('>') ? terminal.color
                    : terminal.color + 'aa',
                  fontWeight: line.startsWith('>') ? 'bold' : 'normal',
                }}>
                  {line || '\u00A0'}
                </div>
              );
            })}

            {visibleLines < content.lines.length ? (
              <span style={{ color: terminal.color, opacity: blink ? 1 : 0 }}>█</span>
            ) : (
              <div style={{ marginTop: 12, color: terminal.color + '88', fontSize: 10 }}>
                <span style={{ opacity: blink ? 1 : 0 }}>█ </span>
                END OF FILE — PRESS [ESC] OR [E] TO EXIT
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          background: terminal.color + '11', borderTop: `1px solid ${terminal.color}33`,
          padding: '5px 12px', display: 'flex', justifyContent: 'space-between',
          color: terminal.color + '88', fontSize: 9, letterSpacing: 1,
        }}>
          <span>
            <button onClick={onClose} style={{
              marginRight: 10, background: terminal.color + '22', border: '1px solid ' + terminal.color,
              color: terminal.color, borderRadius: 4, padding: '4px 8px', fontFamily: 'inherit',
              fontSize: 9, letterSpacing: 1, cursor: 'pointer'
            }}>EXIT</button>
            {terminal.label}
            {isMainframe && tradingData && (
              <span style={{ marginLeft: 12, color: pnlPositive ? '#00ff88' : pnlNegative ? '#ff5555' : terminal.color + '88' }}>
                {pnlPositive ? '▲ PROFITABLE' : pnlNegative ? '▼ IN DRAWDOWN' : '— NEUTRAL'}
              </span>
            )}
          </span>
          <span>[ESC] CLOSE TERMINAL</span>
        </div>
      </div>
    </div>
  );
}
