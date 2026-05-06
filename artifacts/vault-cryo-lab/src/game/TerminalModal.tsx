import { useEffect, useState } from 'react';
import { TERMINAL_CONTENT, TERMINAL_MARKET, TERMINALS } from './constants';
import { TradingData } from './useTradingData';
import { CryptoChart } from './CryptoChart';

interface Props {
  terminalId: string | null;
  onClose: () => void;
  tradingData?: TradingData;
}

function fmtUsd(n: number) {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function sign(n: number) { return n >= 0 ? '+' : ''; }

function getApiUrl(): string {
  try { return localStorage.getItem('trading_api_url') ?? ''; } catch { return ''; }
}

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
    lines.push('  TRADE screen → ⚙ CONFIG');
  }

  lines.push('');
  lines.push('> SECURITY NOTICE:');
  lines.push('  Unauthorized access is prohibited.');

  return lines;
}

export function TerminalModal({ terminalId, onClose, tradingData }: Props) {
  const [visibleLines, setVisibleLines] = useState(0);
  const [blink, setBlink]               = useState(true);
  const [apiUrl]                         = useState(getApiUrl);

  const terminal    = TERMINALS.find(t => t.id === terminalId);
  const isMainframe = terminalId === 'mainframe';
  const market      = terminalId ? (TERMINAL_MARKET[terminalId] ?? 'BTC-USD') : 'BTC-USD';
  const clr         = terminal?.color ?? '#00ff44';

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
    }, 45);
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

  // Second market to show on mainframe
  const secondMarket = tradingData?.markets?.find(m => m !== market) ?? 'ETH-USD';

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 900,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.80)',
    }}>
      <div style={{
        width: 'min(780px, 97vw)',
        background: '#000a00',
        border: `2px solid ${clr}`,
        borderRadius: 4,
        boxShadow: `0 0 40px ${clr}44, 0 0 80px ${clr}22`,
        fontFamily: "'Courier New', monospace",
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '92vh',
      }}>
        {/* Header */}
        <div style={{
          background: clr + '22', borderBottom: `1px solid ${clr}44`,
          padding: '6px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexShrink: 0,
        }}>
          <div style={{ color: clr, fontSize: 11, letterSpacing: 2 }}>VAULT-TEC UNIFIED OPERATING SYSTEM v7.1.0.8</div>
          <div style={{ color: clr + '88', fontSize: 10 }}>{terminal.label}</div>
        </div>

        {/* Body */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>

          {/* Left: scrolling text */}
          <div style={{
            flex: 1, padding: '14px 16px',
            overflow: 'auto', position: 'relative',
            borderRight: `1px solid ${clr}22`,
          }}>
            {/* Scanline overlay */}
            <div style={{
              position: 'absolute', inset: 0, pointerEvents: 'none',
              background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.08) 3px, rgba(0,0,0,0.08) 4px)',
            }} />
            <div style={{ color: clr, fontSize: 12, fontWeight: 'bold', letterSpacing: 2, marginBottom: 10, borderBottom: `1px solid ${clr}33`, paddingBottom: 5 }}>
              {content.title}
            </div>
            <div style={{ fontSize: 10, lineHeight: 1.8, color: clr + 'cc' }}>
              {content.lines.slice(0, visibleLines).map((line, i) => {
                const isPositive = line.includes('+$') && !line.includes('-$');
                const isNegative = line.includes('-$') || line.includes('FAILURE');
                const isAlert    = line.includes('*** ') || line.includes('OFFLINE') || line.includes('ERROR');
                return (
                  <div key={i} style={{
                    opacity: line === '' ? 0.3 : 1,
                    color: isAlert    ? '#ff6644'
                      : isPositive    ? '#00ff88'
                      : isNegative    ? '#ff5555'
                      : line.startsWith('>') ? clr
                      : clr + 'aa',
                    fontWeight: line.startsWith('>') ? 'bold' : 'normal',
                  }}>
                    {line || '\u00A0'}
                  </div>
                );
              })}
              {visibleLines < content.lines.length ? (
                <span style={{ color: clr, opacity: blink ? 1 : 0 }}>█</span>
              ) : (
                <div style={{ marginTop: 10, color: clr + '66', fontSize: 9 }}>
                  <span style={{ opacity: blink ? 1 : 0 }}>█ </span>
                  END OF FILE — [ESC] TO CLOSE
                </div>
              )}
            </div>
          </div>

          {/* Right: chart panel */}
          <div style={{
            width: 290, flexShrink: 0,
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            overflow: 'auto',
          }}>
            <div style={{ color: clr + '88', fontSize: 9, letterSpacing: 2 }}>LIVE MARKET DATA</div>

            <CryptoChart market={market} apiUrl={apiUrl} width={266} height={136} color={clr} />

            {/* Mainframe shows a second chart + quick stats */}
            {isMainframe && (
              <>
                <div style={{ borderTop: `1px solid ${clr}22`, paddingTop: 8 }}>
                  <CryptoChart market={secondMarket} apiUrl={apiUrl} width={266} height={110} color="#00ccff" />
                </div>

                {tradingData && (
                  <div style={{
                    borderTop: `1px solid ${clr}22`, paddingTop: 8,
                    display: 'flex', flexDirection: 'column', gap: 4, fontSize: 10,
                  }}>
                    {([
                      { label: 'EQUITY',     value: fmtUsd(tradingData.equity) },
                      { label: "P&L TODAY",  value: `${sign(tradingData.pnlToday)}${fmtUsd(tradingData.pnlToday)}`, color: tradingData.pnlToday > 0 ? '#00ff88' : tradingData.pnlToday < 0 ? '#ff5555' : clr },
                      { label: 'POSITIONS',  value: String(tradingData.openPositions) },
                      { label: 'WIN RATE',   value: `${(tradingData.memory.win_rate * 100).toFixed(1)}%`, color: tradingData.memory.win_rate >= 0.5 ? '#00ff88' : '#ff5555' },
                    ] as { label: string; value: string; color?: string }[]).map(r => (
                      <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: clr + '88' }}>{r.label}</span>
                        <span style={{ color: r.color ?? clr, fontWeight: 'bold' }}>{r.value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {!apiUrl && (
              <div style={{ color: clr + '55', fontSize: 9, lineHeight: 1.7, borderTop: `1px solid ${clr}22`, paddingTop: 8 }}>
                SET DASHBOARD URL VIA<br />
                PIP-BOY → ₿ BOT → ⚙ CONFIG<br />
                TO SEE LIVE CHART DATA
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          background: clr + '11', borderTop: `1px solid ${clr}33`,
          padding: '5px 14px', display: 'flex', justifyContent: 'space-between',
          color: clr + '77', fontSize: 9, letterSpacing: 1, flexShrink: 0,
        }}>
          <span>
            MARKET: {market}
            {isMainframe && tradingData && (
              <span style={{ marginLeft: 14, color: pnlPositive ? '#00ff88' : pnlNegative ? '#ff5555' : clr + '77' }}>
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
