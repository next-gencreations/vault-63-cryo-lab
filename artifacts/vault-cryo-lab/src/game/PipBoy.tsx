import { useState } from 'react';
import { PipBoyScreen } from './types';
import { TradingData } from './useTradingData';
import { CryptoChart } from './CryptoChart';

interface Props {
  open: boolean;
  screen: PipBoyScreen;
  onChangeScreen: (s: PipBoyScreen) => void;
  onClose: () => void;
  tradingData: TradingData;
  apiUrl: string;
  setApiUrl: (u: string) => void;
}

const SCREENS: PipBoyScreen[] = ['STAT', 'INV', 'DATA', 'MAP', 'RADIO', 'TRADE'];

const STAT_BARS = [
  { label: 'STRENGTH',     abbr: 'S', val: 4 },
  { label: 'PERCEPTION',   abbr: 'P', val: 5 },
  { label: 'ENDURANCE',    abbr: 'E', val: 4 },
  { label: 'CHARISMA',     abbr: 'C', val: 7 },
  { label: 'INTELLIGENCE', abbr: 'I', val: 8 },
  { label: 'AGILITY',      abbr: 'A', val: 6 },
  { label: 'LUCK',         abbr: 'L', val: 5 },
];

const MAP_ART = [
  '  ┌─────────────────────────────────┐  ',
  '  │  [SEC]     [CRYO]     [RES]     │  ',
  '  │              ╔═╗                │  ',
  '  │              ║T║ ← Cryo Tube    │  ',
  '  │              ╚═╝                │  ',
  '  │            ★ YOU                │  ',
  '  │                                  │  ',
  '  │                                  │  ',
  '  │  [MED]               [MAIN]     │  ',
  '  └─────────────────────────────────┘  ',
  '',
  '  ★ = CURRENT POSITION',
];

function fmtUsd(n: number) {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function pnlColor(n: number) { return n > 0 ? '#00ff88' : n < 0 ? '#ff5555' : '#00aa44'; }
function pnlSign(n: number)  { return n >= 0 ? '+' : ''; }

const MOOD_IMG: Record<string, string> = {
  cryo:     '/vaultgirl/vaultgirl_cryo.png',
  idle:     '/vaultgirl/vaultgirl_idle.png',
  happy:    '/vaultgirl/vaultgirl_happy.png',
  sick:     '/vaultgirl/vaultgirl_sick.png',
  thriving: '/vaultgirl/vaultgirl_thriving.png',
  weak:     '/vaultgirl/vaultgirl_weak.png',
  zombie:   '/vaultgirl/vaultgirl_zombie.png',
};

export function PipBoy({ open, screen, onChangeScreen, onClose, tradingData, apiUrl, setApiUrl }: Props) {
  if (!open) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,8,0,0.85)', backdropFilter: 'blur(2px)',
    }}>
      <div style={{
        width: 660, maxHeight: '95vh',
        background: 'linear-gradient(135deg, #1a2a1a 0%, #0d1a0d 60%, #111a11 100%)',
        border: '3px solid #2a4a2a', borderRadius: 16,
        boxShadow: '0 0 40px #00ff4422, 0 0 80px #00ff4411, inset 0 0 20px rgba(0,0,0,0.8)',
        position: 'relative', padding: 16,
        fontFamily: "'Courier New', monospace",
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1a3a1a', paddingBottom: 6 }}>
          <div style={{ color: '#00ff44', fontSize: 10, letterSpacing: 3 }}>ROBCO INDUSTRIES (TM)</div>
          <div style={{ color: '#00dd33', fontSize: 18, fontWeight: 'bold', letterSpacing: 4 }}>PIP-BOY 3000</div>
          <div style={{ color: '#00ff44', fontSize: 10, letterSpacing: 2 }}>MARK IV</div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 3 }}>
          {SCREENS.map(s => (
            <button key={s} onClick={() => onChangeScreen(s)} style={{
              flex: 1, padding: '4px 0',
              background: screen === s ? (s === 'TRADE' ? '#001800' : '#00aa33') : '#0a1a0a',
              border: `1px solid ${screen === s ? '#00ff44' : '#1a3a1a'}`,
              borderRadius: 3,
              color: screen === s ? (s === 'TRADE' ? '#00ff44' : '#000') : '#00aa33',
              fontFamily: 'inherit', fontSize: 10, fontWeight: 'bold', letterSpacing: 1, cursor: 'pointer',
            }}>
              {s === 'TRADE' ? '₿ BOT' : s}
            </button>
          ))}
        </div>

        {/* Screen area */}
        <div style={{
          flex: 1, background: '#001800', border: '1px solid #1a3a1a', borderRadius: 6,
          padding: 14, color: '#00ff44', fontSize: 12,
          overflow: 'auto', position: 'relative', maxHeight: 480,
        }}>
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.12) 3px, rgba(0,0,0,0.12) 4px)',
          }} />

          {screen === 'STAT'  && <StatScreen />}
          {screen === 'INV'   && <InvScreen />}
          {screen === 'DATA'  && <DataScreen />}
          {screen === 'MAP'   && <MapScreen />}
          {screen === 'RADIO' && <RadioScreen />}
          {screen === 'TRADE' && <TradeScreen data={tradingData} apiUrl={apiUrl} setApiUrl={setApiUrl} />}
        </div>

        <div style={{ textAlign: 'center', color: '#00aa33', fontSize: 10, letterSpacing: 2 }}>
          [ TAB ] CLOSE PIP-BOY
        </div>

        {[[-8, -8], [668, -8], [-8, 'calc(100% - 8px)'], [668, 'calc(100% - 8px)']].map(([x, y], i) => (
          <div key={i} style={{ position: 'absolute', left: x as number, top: y as number, width: 12, height: 12, borderRadius: '50%', background: '#1a2a1a', border: '1px solid #2a4a2a' }} />
        ))}
        <div style={{ position: 'fixed', inset: 0, zIndex: -1 }} onClick={onClose} />
      </div>
    </div>
  );
}

function StatScreen() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ fontSize: 14, fontWeight: 'bold', letterSpacing: 3, marginBottom: 4, color: '#00ff66' }}>VAULT DWELLER — LVL 1</div>
      <div style={{ fontSize: 10, color: '#00aa44', marginBottom: 8 }}>XP: 0 / 200 &nbsp;&nbsp; HP: 85/85 &nbsp;&nbsp; RAD: 0</div>
      {STAT_BARS.map(({ label, abbr, val }) => (
        <div key={abbr} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
          <span style={{ width: 16, color: '#00ff44', fontWeight: 'bold' }}>{abbr}</span>
          <span style={{ width: 100, color: '#00cc33', letterSpacing: 1 }}>{label}</span>
          <div style={{ display: 'flex', gap: 2 }}>
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} style={{ width: 14, height: 10, background: i < val ? '#00ff44' : '#0a1a0a', border: '1px solid #1a3a1a', borderRadius: 1 }} />
            ))}
          </div>
          <span style={{ color: '#00ff66', fontWeight: 'bold', marginLeft: 4 }}>{val}</span>
        </div>
      ))}
      <div style={{ marginTop: 8, borderTop: '1px solid #1a3a1a', paddingTop: 8, fontSize: 10, color: '#008822' }}>
        SPECIAL POINTS REMAINING: 0 &nbsp;&nbsp; PERKS: NONE
      </div>
    </div>
  );
}

function InvScreen() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ fontSize: 13, fontWeight: 'bold', letterSpacing: 3, marginBottom: 6, color: '#00ff66' }}>INVENTORY</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#008822', marginBottom: 4 }}>
        <span>ITEM</span><span>WT &nbsp; VAL</span>
      </div>
      <div style={{ borderTop: '1px solid #1a3a1a', paddingTop: 6 }}>
        <div style={{ color: '#00aa33', fontSize: 10, marginBottom: 6 }}>— EQUIPPED —</div>
        {[
          { name: 'Vault 63 Jumpsuit', wt: 2.0, val: 15 },
          { name: 'Pip-Boy 3000 Mark IV', wt: 2.0, val: 0 },
        ].map(item => (
          <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
            <span style={{ color: '#00ff44' }}>▶ {item.name}</span>
            <span style={{ color: '#00aa33' }}>{item.wt} &nbsp; {item.val}</span>
          </div>
        ))}
      </div>
      <div style={{ borderTop: '1px solid #1a3a1a', paddingTop: 8, color: '#008822', fontSize: 10 }}>TOTAL WEIGHT: 4.0 / 210 lbs</div>
      <div style={{ marginTop: 8, color: '#006611', fontSize: 10, fontStyle: 'italic' }}>"You have nothing else. You just woke up."</div>
    </div>
  );
}

function DataScreen() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ fontSize: 13, fontWeight: 'bold', letterSpacing: 3, marginBottom: 4, color: '#00ff66' }}>DATA / QUESTS</div>
      <div style={{ color: '#00aa33', fontSize: 10, marginBottom: 4 }}>ACTIVE QUESTS:</div>
      <div style={{ borderLeft: '2px solid #00ff44', paddingLeft: 8, marginBottom: 8 }}>
        <div style={{ color: '#00ff44', fontSize: 12, fontWeight: 'bold' }}>▶ WAKE UP</div>
        <div style={{ color: '#00aa33', fontSize: 10, marginTop: 2 }}>You have emerged from Vault 63 after 210 years of cryogenic sleep. Orient yourself. Explore the cryo lab.</div>
      </div>
      <div style={{ borderLeft: '2px solid #00aa33', paddingLeft: 8, marginBottom: 8 }}>
        <div style={{ color: '#00aa33', fontSize: 12, fontWeight: 'bold' }}>▶ FIND THE OVERSEER</div>
        <div style={{ color: '#008822', fontSize: 10, marginTop: 2 }}>The Overseer appears to have left Vault 63 in 2079. Find out what happened and locate the exit.</div>
      </div>
      <div style={{ borderTop: '1px solid #1a3a1a', paddingTop: 6 }}>
        <div style={{ color: '#00aa33', fontSize: 10, marginBottom: 4 }}>NOTES:</div>
        <div style={{ color: '#008822', fontSize: 10, lineHeight: 1.5 }}>
          → Cryo system malfunction detected<br/>
          → 210 years elapsed since vault entry<br/>
          → All other pods: CRITICAL FAILURE<br/>
          → Mainframe reports 12% power remaining<br/>
          → Surface elevator located: LEVEL 0
        </div>
      </div>
    </div>
  );
}

function MapScreen() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ fontSize: 13, fontWeight: 'bold', letterSpacing: 3, marginBottom: 4, color: '#00ff66' }}>LOCAL MAP — VAULT 63</div>
      <div style={{ fontSize: 9, lineHeight: 1.6, color: '#00cc33', fontFamily: 'monospace' }}>
        {MAP_ART.map((line, i) => <div key={i}>{line}</div>)}
      </div>
      <div style={{ color: '#008822', fontSize: 9, marginTop: 4 }}>[SEC]=SECURITY [RES]=RESEARCH [MED]=MEDICAL [MAIN]=MAINFRAME</div>
    </div>
  );
}

function RadioScreen() {
  const bars = Array.from({ length: 20 }).map(() => Math.random() > 0.85 ? 1 : 0);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 13, fontWeight: 'bold', letterSpacing: 3, marginBottom: 4, color: '#00ff66' }}>RADIO</div>
      <div style={{ color: '#00aa33', fontSize: 12, letterSpacing: 2 }}>SCANNING FOR SIGNAL...</div>
      <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: 30, marginTop: 4 }}>
        {bars.map((b, i) => (
          <div key={i} style={{ width: 14, height: b ? 20 + Math.random() * 10 : 4, background: b ? '#00ff44' : '#0a2a0a', borderRadius: 1 }} />
        ))}
      </div>
      <div style={{ marginTop: 8, color: '#008822', fontSize: 10, lineHeight: 1.8 }}>
        FREQUENCY: --- MHz<br/>SIGNAL: NONE DETECTED<br/>STRENGTH: 0%
      </div>
      <div style={{ marginTop: 8, color: '#006611', fontSize: 10, borderTop: '1px solid #1a3a1a', paddingTop: 8 }}>
        "Nothing but static out there. The world has gone quiet."
      </div>
    </div>
  );
}

function TradeScreen({ data, apiUrl, setApiUrl }: { data: TradingData; apiUrl: string; setApiUrl: (u: string) => void }) {
  const [editingUrl, setEditingUrl] = useState(false);
  const [urlDraft, setUrlDraft]     = useState(apiUrl);

  const statusColor = data.status === 'ACTIVE' ? '#00ff88'
    : data.status === 'WEAK SIGNAL' ? '#ffaa00'
    : '#ff5555';

  const moodImg = MOOD_IMG[data.mood] || MOOD_IMG.idle;

  const Row = ({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3, fontSize: 11 }}>
      <span style={{ color: '#00aa44' }}>{label}</span>
      <span style={{ color: valueColor ?? '#00ff44', fontWeight: 'bold' }}>{value}</span>
    </div>
  );

  const Section = ({ title }: { title: string }) => (
    <div style={{ color: '#008833', fontSize: 9, letterSpacing: 2, marginTop: 10, marginBottom: 4, borderBottom: '1px solid #1a3a1a', paddingBottom: 2 }}>{title}</div>
  );

  // Choose primary market: from watchlist or fallback
  const primaryMarket = data.markets[0] ?? 'BTC-USD';

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Top: companion image + status */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
        <div style={{ flexShrink: 0 }}>
          <img
            src={moodImg}
            alt={data.mood}
            style={{
              width: 72, height: 'auto',
              filter: `drop-shadow(0 0 10px ${data.mood === 'zombie' ? 'rgba(255,50,50,0.7)' : data.mood === 'happy' || data.mood === 'thriving' ? 'rgba(0,255,136,0.8)' : 'rgba(0,200,100,0.4)'})`,
              display: 'block',
            }}
          />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 3 }}>
          <div style={{ color: '#00ff66', fontSize: 13, fontWeight: 'bold', letterSpacing: 2 }}>AI TRADING BOT</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor, boxShadow: `0 0 6px ${statusColor}` }} />
            <span style={{ color: statusColor, fontSize: 10, letterSpacing: 1 }}>{data.status}</span>
          </div>
          <div style={{ color: '#00aa66', fontSize: 10 }}>STATE: {data.vaultState}</div>
          <div style={{ color: '#007744', fontSize: 9, lineHeight: 1.4 }}>{data.vaultLine}</div>
          <div style={{ color: '#006633', fontSize: 9 }}>ROOM: {data.vaultRoom}</div>
        </div>
      </div>

      {/* URL config */}
      {!apiUrl && !editingUrl && (
        <div style={{ color: '#ffaa00', fontSize: 10, marginBottom: 8, lineHeight: 1.8, borderLeft: '2px solid #ffaa00', paddingLeft: 8 }}>
          NO API CONNECTED<br/>
          <span style={{ cursor: 'pointer', textDecoration: 'underline', color: '#00ff44' }} onClick={() => setEditingUrl(true)}>
            ▶ ENTER DASHBOARD URL
          </span>
        </div>
      )}
      {editingUrl && (
        <div style={{ marginBottom: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ color: '#00aa33', fontSize: 9, letterSpacing: 1 }}>DASHBOARD URL (e.g. https://app.next-gencreations.com):</div>
          <input
            autoFocus
            value={urlDraft}
            onChange={e => setUrlDraft(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') { setApiUrl(urlDraft); setEditingUrl(false); }
              if (e.key === 'Escape') setEditingUrl(false);
            }}
            style={{
              background: '#001200', border: '1px solid #00ff44', color: '#00ff44',
              fontFamily: 'inherit', fontSize: 10, padding: '4px 8px', borderRadius: 3, width: '100%',
            }}
            placeholder="https://app.next-gencreations.com"
          />
          <div style={{ color: '#008822', fontSize: 9 }}>ENTER to save · ESC to cancel</div>
        </div>
      )}

      {/* Live chart — mini candlestick for primary market */}
      {apiUrl && (
        <div style={{ marginBottom: 8, padding: '8px', background: '#000d00', border: '1px solid #1a3a1a', borderRadius: 3 }}>
          <CryptoChart market={primaryMarket} apiUrl={apiUrl} width={560} height={110} color="#00ff44" />
        </div>
      )}

      {/* Portfolio */}
      <Section title="PORTFOLIO" />
      <Row label="EQUITY"      value={fmtUsd(data.equity)} />
      <Row label="TODAY P&L"   value={`${pnlSign(data.pnlToday)}${fmtUsd(data.pnlToday)}`}    valueColor={pnlColor(data.pnlToday)} />
      <Row label="POSITIONS"   value={String(data.openPositions)} />
      <Row label="LOSS STREAK" value={`${data.lossStreak}x`} valueColor={data.lossStreak >= 3 ? '#ff5555' : '#00ff44'} />

      {/* Memory */}
      <Section title="MEMORY CORE" />
      <Row label="TRADES"   value={String(data.memory.total)} />
      <Row label="WINS"     value={String(data.memory.wins)} />
      <Row label="LOSSES"   value={String(data.memory.losses)} />
      <Row label="WIN RATE" value={`${(data.memory.win_rate * 100).toFixed(1)}%`} valueColor={data.memory.win_rate >= 0.5 ? '#00ff88' : '#ff5555'} />
      <Row label="AVG P&L"  value={fmtUsd(data.memory.avg_pnl)} valueColor={pnlColor(data.memory.avg_pnl)} />

      {/* Bot brain */}
      <Section title="BOT BRAIN" />
      <Row label="MODE"       value={data.brain.mode || data.botMode} />
      <Row label="AVOID MODE" value={data.brain.avoid_active ? 'ACTIVE' : 'OFF'} valueColor={data.brain.avoid_active ? '#ffaa00' : '#00ff44'} />

      {/* Markets */}
      {data.markets.length > 0 && (
        <>
          <Section title="WATCHLIST" />
          <div style={{ color: '#00ff44', fontSize: 10, lineHeight: 1.7 }}>{data.markets.join('  ·  ')}</div>
        </>
      )}

      {/* Footer */}
      <div style={{ marginTop: 10, borderTop: '1px solid #1a3a1a', paddingTop: 6, display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#446644' }}>
        <span>SYNC: {data.lastUpdated} · {data.connected ? `${data.secondsAgo}s ago` : 'OFFLINE'}</span>
        <span style={{ cursor: 'pointer', color: '#00aa33', textDecoration: 'underline' }} onClick={() => { setUrlDraft(apiUrl); setEditingUrl(true); }}>
          ⚙ CONFIG
        </span>
      </div>
    </div>
  );
}
