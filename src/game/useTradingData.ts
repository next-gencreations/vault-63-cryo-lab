import { useEffect, useRef, useState } from 'react';

export type VaultGirlMood = 'cryo' | 'idle' | 'happy' | 'sick' | 'thriving' | 'weak' | 'zombie';

export interface BotMemory {
  total: number;
  wins: number;
  losses: number;
  win_rate: number;
  avg_pnl: number;
}

export interface BotBrain {
  mode: string;
  avoid_active: boolean;
  loss_streak: number;
}

export interface TradingData {
  connected: boolean;
  secondsAgo: number;
  status: 'ACTIVE' | 'WEAK SIGNAL' | 'OFFLINE';
  botMode: string;
  equity: number;
  pnlToday: number;
  openPositions: number;
  lossStreak: number;
  markets: string[];
  memory: BotMemory;
  brain: BotBrain;
  // Derived mood — matches VaultCompanion logic exactly
  mood: VaultGirlMood;
  vaultState: string;
  vaultLine: string;
  vaultRoom: string;
  lastUpdated: string;
}

const DEFAULT: TradingData = {
  connected: false,
  secondsAgo: 999,
  status: 'OFFLINE',
  botMode: '—',
  equity: 0,
  pnlToday: 0,
  openPositions: 0,
  lossStreak: 0,
  markets: [],
  memory: { total: 0, wins: 0, losses: 0, win_rate: 0, avg_pnl: 0 },
  brain: { mode: '—', avoid_active: false, loss_streak: 0 },
  mood: 'cryo',
  vaultState: 'CRYO LOCKDOWN',
  vaultLine: 'AWAITING SIGNAL FROM RENDER CORE',
  vaultRoom: 'CRYO BAY',
  lastUpdated: '--:--',
};

function deriveMood(
  pnl: number,
  positions: number,
  lossStreak: number,
  secondsAgo: number,
): { mood: VaultGirlMood; vaultState: string; vaultLine: string; vaultRoom: string } {
  if (secondsAgo > 30) {
    return { mood: 'cryo', vaultState: 'CRYO LOCKDOWN', vaultLine: 'SIGNAL LOST · RECONNECTING TO RENDER CORE', vaultRoom: 'CRYO BAY' };
  }
  if (lossStreak >= 5) {
    return { mood: 'zombie', vaultState: 'MEDICAL EMERGENCY', vaultLine: 'LOSS STREAK PROTECTION ACTIVE', vaultRoom: 'MED BAY' };
  }
  if (lossStreak >= 3) {
    return { mood: 'sick', vaultState: 'RECOVERY MODE', vaultLine: 'DEFENSIVE MODE ARMED', vaultRoom: 'MED BAY' };
  }
  if (positions > 0) {
    const m = pnl >= 0 ? 'thriving' : 'weak';
    return { mood: m, vaultState: 'HUNTER MODE', vaultLine: 'LIVE POSITION UNDER WATCH', vaultRoom: 'TRADING TERMINAL' };
  }
  if (pnl > 0.05) {
    return { mood: 'happy', vaultState: 'VAULT ENERGISED', vaultLine: 'PROFIT MEMORY FEEDING CORE', vaultRoom: 'GYM / CANTEEN' };
  }
  if (pnl < -0.05) {
    return { mood: 'weak', vaultState: 'UNDER PRESSURE', vaultLine: 'SMALL DAMAGE DETECTED', vaultRoom: 'REST BAY' };
  }
  return { mood: 'idle', vaultState: 'SCANNING', vaultLine: 'LOOKING FOR CLEAN ENTRY', vaultRoom: 'LAB FLOOR' };
}

function parseData(raw: Record<string, unknown>, lastUpdate: number): TradingData {
  const equity = Number(raw?.equity ?? (raw?.heartbeat as Record<string,unknown>)?.equity_usd ?? 0);
  const pnlToday = Number(raw?.pnl_today ?? 0);
  const openPositions = Number(raw?.open_positions_count ?? 0);
  const brain = (raw?.brain ?? {}) as Record<string, unknown>;
  const lossStreak = Number(brain?.loss_streak ?? 0);
  const botMode = String(raw?.mode ?? raw?.status ?? 'UNKNOWN').toUpperCase();
  const mem = (raw?.memory ?? raw?.stats ?? {}) as Record<string, unknown>;
  const memory: BotMemory = {
    total:    Number(mem?.total ?? 0),
    wins:     Number(mem?.wins ?? 0),
    losses:   Number(mem?.losses ?? 0),
    win_rate: Number(mem?.win_rate ?? 0),
    avg_pnl:  Number(mem?.avg_pnl ?? 0),
  };
  const brainParsed: BotBrain = {
    mode:         String(brain?.mode ?? '—'),
    avoid_active: Boolean(brain?.avoid_active),
    loss_streak:  lossStreak,
  };
  const runtime = raw?.runtime_universe ?? raw?.universe ?? (raw?.scout as Record<string,unknown>)?.expanded_universe;
  const markets = Array.isArray(runtime) && runtime.length > 0 ? runtime as string[] : ['BTC-USD'];
  const secondsAgo = Math.floor((Date.now() - lastUpdate) / 1000);
  const status: TradingData['status'] = secondsAgo < 10 ? 'ACTIVE' : secondsAgo < 30 ? 'WEAK SIGNAL' : 'OFFLINE';
  const { mood, vaultState, vaultLine, vaultRoom } = deriveMood(pnlToday, openPositions, lossStreak, secondsAgo);
  return {
    connected: true,
    secondsAgo,
    status,
    botMode,
    equity,
    pnlToday,
    openPositions,
    lossStreak,
    markets,
    memory,
    brain: brainParsed,
    mood,
    vaultState,
    vaultLine,
    vaultRoom,
    lastUpdated: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  };
}

function getApiUrl(): string {
  return localStorage.getItem('trading_api_url') ?? '';
}

export function useTradingData(intervalMs = 8_000): TradingData & { apiUrl: string; setApiUrl: (u: string) => void } {
  const [data, setData]         = useState<TradingData>(DEFAULT);
  const [apiUrl, setApiUrlState] = useState(() => getApiUrl());
  const lastUpdateRef            = useRef(0);
  const timerRef                 = useRef<ReturnType<typeof setInterval> | null>(null);

  const setApiUrl = (url: string) => {
    const trimmed = url.trim().replace(/\/+$/, '');
    localStorage.setItem('trading_api_url', trimmed);
    setApiUrlState(trimmed);
  };

  useEffect(() => {
    if (!apiUrl) {
      setData(d => ({ ...d, connected: false, status: 'OFFLINE', mood: 'cryo' }));
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        // Use the exact same endpoint as the dashboard: /api/proxy/data
        const res = await fetch(`${apiUrl}/api/proxy/data?ts=${Date.now()}`, {
          cache: 'no-store',
          signal: AbortSignal.timeout(8000),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const raw = await res.json() as Record<string, unknown>;
        lastUpdateRef.current = Date.now();
        if (!cancelled) setData(parseData(raw, lastUpdateRef.current));
      } catch {
        if (!cancelled) {
          setData(prev => {
            const secondsAgo = lastUpdateRef.current
              ? Math.floor((Date.now() - lastUpdateRef.current) / 1000)
              : 999;
            const { mood, vaultState, vaultLine, vaultRoom } = deriveMood(prev.pnlToday, prev.openPositions, prev.lossStreak, secondsAgo);
            return { ...prev, connected: false, status: 'OFFLINE', secondsAgo, mood, vaultState, vaultLine, vaultRoom };
          });
        }
      }
    };

    load();
    timerRef.current = setInterval(load, intervalMs);
    return () => {
      cancelled = true;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [apiUrl, intervalMs]);

  // Tick secondsAgo every second so mood updates live
  useEffect(() => {
    const t = setInterval(() => {
      if (!lastUpdateRef.current) return;
      setData(prev => {
        if (!prev.connected) return prev;
        const secondsAgo = Math.floor((Date.now() - lastUpdateRef.current) / 1000);
        const status: TradingData['status'] = secondsAgo < 10 ? 'ACTIVE' : secondsAgo < 30 ? 'WEAK SIGNAL' : 'OFFLINE';
        const { mood, vaultState, vaultLine, vaultRoom } = deriveMood(prev.pnlToday, prev.openPositions, prev.lossStreak, secondsAgo);
        return { ...prev, secondsAgo, status, mood, vaultState, vaultLine, vaultRoom };
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  return { ...data, apiUrl, setApiUrl };
}
