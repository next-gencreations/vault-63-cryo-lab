import { useEffect, useState } from "react";

export type TradingData = {
  connected: boolean;
  equity: number;
  todayPnl: number;
  positions: number;
  lossStreak: number;
  trades: number;
  wins: number;
  losses: number;
  winRate: number;
  avgPnl: number;
  mode: string;
  avoidMode: boolean;
  heartbeat: string;
};

const API_BASE =
  import.meta.env.VITE_API_BASE ||
  "https://coinbase-trader-bot-r39n.onrender.com";

const emptyData: TradingData = {
  connected: false,
  equity: 0,
  todayPnl: 0,
  positions: 0,
  lossStreak: 0,
  trades: 0,
  wins: 0,
  losses: 0,
  winRate: 0,
  avgPnl: 0,
  mode: "-",
  avoidMode: false,
  heartbeat: "OFFLINE",
};

function numberValue(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function useTradingData() {
  const [data, setData] = useState<TradingData>(emptyData);
  const [loading, setLoading] = useState(true);

  async function loadTradingData() {
    try {
      const response = await fetch(`${API_BASE}/api/proxy/data`, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`API error ${response.status}`);
      }

      const json = await response.json();

      const memory = json.memory || json.stats || {};
      const account = json.account || json.portfolio || json || {};

      const equity = numberValue(
        account.equity ?? json.equity ?? json.balance ?? json.portfolio_value
      );

      const todayPnl = numberValue(
        account.todayPnl ??
          account.today_pnl ??
          json.todayPnl ??
          json.today_pnl ??
          json.pnl
      );

      const trades = numberValue(
        memory.trades ?? memory.total_trades ?? json.trades ?? json.total_trades
      );

      const wins = numberValue(memory.wins ?? json.wins);
      const losses = numberValue(memory.losses ?? json.losses);

      const winRate =
        trades > 0
          ? numberValue(memory.winRate ?? memory.win_rate ?? json.winRate ?? json.win_rate) ||
            (wins / trades) * 100
          : 0;

      setData({
        connected: true,
        equity,
        todayPnl,
        positions: numberValue(json.positions ?? account.positions),
        lossStreak: numberValue(
          memory.lossStreak ?? memory.loss_streak ?? json.lossStreak ?? json.loss_streak
        ),
        trades,
        wins,
        losses,
        winRate,
        avgPnl: numberValue(memory.avgPnl ?? memory.avg_pnl ?? json.avgPnl ?? json.avg_pnl),
        mode: String(json.mode ?? json.brain_mode ?? memory.mode ?? "hybrid"),
        avoidMode: Boolean(json.avoidMode ?? json.avoid_mode ?? memory.avoidMode ?? false),
        heartbeat: "ONLINE",
      });
    } catch (error) {
      console.error("Vault 63 trading API offline:", error);
      setData((old) => ({
        ...old,
        connected: false,
        heartbeat: "OFFLINE",
      }));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTradingData();
    const timer = window.setInterval(loadTradingData, 8000);
    return () => window.clearInterval(timer);
  }, []);

  return {
    ...data,
    loading,
    apiBase: API_BASE,
  };
}
