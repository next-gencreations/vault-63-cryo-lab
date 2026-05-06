import { useCallback, useEffect, useRef, useState } from 'react';

interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface Props {
  market: string;
  apiUrl: string;
  width?: number;
  height?: number;
  color?: string;
  tf?: string;
}

function parseCandles(raw: unknown): Candle[] {
  if (!raw) return [];
  const src = (raw as { candles?: unknown }).candles ?? raw;
  if (!Array.isArray(src)) return [];
  return (src as unknown[])
    .map((c) => {
      if (Array.isArray(c)) {
        const [time, low, high, open, close, volume] = c as number[];
        return { time, low, high, open, close, volume };
      }
      const o = c as Record<string, number>;
      return { time: o.time, open: o.open, high: o.high, low: o.low, close: o.close, volume: o.volume };
    })
    .filter((c) => c.time && c.open)
    .sort((a, b) => a.time - b.time);
}

function drawChart(canvas: HTMLCanvasElement, candles: Candle[], color: string) {
  const ctx = canvas.getContext('2d');
  if (!ctx || candles.length === 0) return;
  const W = canvas.width;
  const H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#000a00';
  ctx.fillRect(0, 0, W, H);

  const highs = candles.map((c) => c.high);
  const lows  = candles.map((c) => c.low);
  const minP  = Math.min(...lows);
  const maxP  = Math.max(...highs);
  const range = maxP - minP || 1;
  const pad   = { t: 18, b: 16, l: 44, r: 6 };
  const cH    = H - pad.t - pad.b;
  const cW    = W - pad.l - pad.r;
  const pY    = (p: number) => pad.t + cH - ((p - minP) / range) * cH;

  // Grid
  ctx.lineWidth = 0.5;
  for (let i = 0; i <= 4; i++) {
    const y     = pad.t + (cH / 4) * i;
    const price = maxP - (range / 4) * i;
    ctx.strokeStyle = color + '22';
    ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(W - pad.r, y); ctx.stroke();
    ctx.fillStyle = color + '77';
    ctx.font = '7px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(
      price >= 1000 ? price.toLocaleString('en-US', { maximumFractionDigits: 0 }) : price.toFixed(4),
      pad.l - 2, y + 3,
    );
  }

  // Volume bars (bottom 20%)
  const volH   = cH * 0.18;
  const maxVol = Math.max(...candles.map((c) => c.volume)) || 1;
  const candleW = Math.max(1, (cW / candles.length) - 1);

  candles.forEach((c, i) => {
    const x    = pad.l + (i / candles.length) * cW + candleW / 2;
    const isUp = c.close >= c.open;
    const clr  = isUp ? '#00cc66' : '#cc3333';

    // Volume
    const vH = (c.volume / maxVol) * volH;
    ctx.fillStyle = clr + '44';
    ctx.fillRect(x - candleW / 2, H - pad.b - vH, candleW, vH);

    // Wick
    ctx.strokeStyle = clr;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x, pY(c.high)); ctx.lineTo(x, pY(c.low)); ctx.stroke();

    // Body
    const bTop = pY(Math.max(c.open, c.close));
    const bBot = pY(Math.min(c.open, c.close));
    const bH   = Math.max(1, bBot - bTop);
    ctx.fillStyle = isUp ? '#00ff88cc' : '#ff4444cc';
    ctx.fillRect(x - candleW / 2, bTop, candleW, bH);
  });

  // Current price line
  const last = candles[candles.length - 1];
  if (last) {
    const y = pY(last.close);
    ctx.strokeStyle = color + '99';
    ctx.lineWidth = 0.5;
    ctx.setLineDash([3, 5]);
    ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(W - pad.r, y); ctx.stroke();
    ctx.setLineDash([]);
  }
}

export function CryptoChart({ market, apiUrl, width = 400, height = 140, color = '#00ff44', tf = '5m' }: Props) {
  const canvasRef               = useRef<HTMLCanvasElement>(null);
  const [candles, setCandles]   = useState<Candle[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [lastPrice, setLast]    = useState(0);
  const [pct, setPct]           = useState(0);
  const [updated, setUpdated]   = useState('');

  const fetchData = useCallback(async () => {
    if (!apiUrl) { setError('NO API URL — set via Pip-Boy TRADE screen'); setLoading(false); return; }
    try {
      const res = await fetch(`${apiUrl}/api/proxy/ohlc?market=${market}&tf=${tf}&ts=${Date.now()}`, {
        cache: 'no-store',
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const parsed = parseCandles(json);
      if (parsed.length > 0) {
        setCandles(parsed);
        const l = parsed[parsed.length - 1];
        const f = parsed[0];
        setLast(l.close);
        setPct(((l.close - f.open) / f.open) * 100);
        setUpdated(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        setError('');
      }
    } catch {
      setError('SIGNAL LOST');
    } finally {
      setLoading(false);
    }
  }, [apiUrl, market, tf]);

  useEffect(() => {
    fetchData();
    const t = setInterval(fetchData, 30_000);
    return () => clearInterval(t);
  }, [fetchData]);

  useEffect(() => {
    if (canvasRef.current && candles.length > 0) drawChart(canvasRef.current, candles, color);
  }, [candles, color]);

  const isUp = pct >= 0;

  return (
    <div style={{ fontFamily: "'Courier New', monospace", width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
        <div>
          <div style={{ color, fontSize: 12, letterSpacing: 2, fontWeight: 'bold' }}>{market}</div>
          <div style={{ color: color + '66', fontSize: 9, letterSpacing: 1 }}>5-MIN CANDLES · {updated || '...'}</div>
        </div>
        {loading && <div style={{ color: color + '66', fontSize: 10, marginTop: 2 }}>LOADING...</div>}
        {!loading && !error && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: '#ffffff', fontSize: 13, fontWeight: 'bold' }}>
              ${lastPrice >= 1000
                ? lastPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                : lastPrice.toFixed(4)}
            </div>
            <div style={{ color: isUp ? '#00ff88' : '#ff4444', fontSize: 10, fontWeight: 'bold' }}>
              {isUp ? '▲' : '▼'} {Math.abs(pct).toFixed(2)}%
            </div>
          </div>
        )}
        {error && <div style={{ color: '#ff4444', fontSize: 9, maxWidth: 140, textAlign: 'right', lineHeight: 1.4 }}>{error}</div>}
      </div>
      <div style={{ position: 'relative' }}>
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          style={{
            width: '100%',
            height: height,
            display: 'block',
            border: `1px solid ${color}33`,
            borderRadius: 2,
          }}
        />
        {loading && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: color + '55', fontSize: 10, letterSpacing: 3,
            background: '#000a0066',
          }}>
            FETCHING MARKET DATA...
          </div>
        )}
        {!loading && candles.length === 0 && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#ff444477', fontSize: 10, letterSpacing: 2,
          }}>
            NO DATA
          </div>
        )}
      </div>
    </div>
  );
}
