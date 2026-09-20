import { useCallback, useEffect, useRef, useState } from 'react';
import { cryptoPrices as MOCK_PRICES } from '../data/mockData';

// Map our coin symbols to CoinGecko ids (free public API, no key needed)
const COINGECKO_IDS = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  SOL: 'solana',
  BNB: 'binancecoin',
  AVAX: 'avalanche-2',
  ADA: 'cardano',
  DOT: 'polkadot',
  MATIC: 'matic-network',
};

const CACHE_KEY = 'ripple-prices-cache';
const CACHE_TTL = 60 * 1000; // 1 minute
const REFRESH_INTERVAL = 60 * 1000; // poll once a minute
const STALE_TTL = 24 * 60 * 60 * 1000; // keep cache up to 24h for offline fallback

// Fiat units per 1 USD (EUR/GBP refreshed from CoinGecko alongside prices)
const DEFAULT_FIAT_RATES = { USD: 1, EUR: 0.92, GBP: 0.79 };

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.ts || !Array.isArray(parsed.prices)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(prices, fiatRates) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), prices, fiatRates }));
  } catch {
    /* storage unavailable */
  }
}

function buildMockPrices() {
  return MOCK_PRICES.map(p => ({ ...p, source: 'mock' }));
}

/**
 * Live crypto prices via CoinGecko's free public API (no key required).
 * - Polls every 60s while the tab is visible
 * - Caches to localStorage for instant loads / offline fallback
 * - Falls back to cached → mock data when the API fails or rate-limits
 *
 * Returns: { prices, source: 'live'|'cache'|'mock', isLive, loading, error, refresh }
 */
export function useCryptoPrices({ refresh = true } = {}) {
  const [prices, setPrices] = useState(() => {
    const cached = readCache();
    if (cached) return cached.prices.map(p => ({ ...p, source: 'cache' }));
    return buildMockPrices();
  });
  const [fiatRates, setFiatRates] = useState(() => readCache()?.fiatRates || DEFAULT_FIAT_RATES);
  const [source, setSource] = useState(() => {
    const cached = readCache();
    if (cached && Date.now() - cached.ts < CACHE_TTL) return 'cache';
    return 'mock';
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const inFlight = useRef(false);

  const fetchPrices = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      const ids = Object.values(COINGECKO_IDS).join(',');
      const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd,eur,gbp&include_24hr_change=true`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`CoinGecko ${res.status}`);
      const json = await res.json();

      const live = MOCK_PRICES.map(base => {
        const gid = COINGECKO_IDS[base.coin];
        const entry = json[gid];
        if (!entry) return { ...base, source: 'mock' };
        return {
          ...base,
          price: entry.usd ?? base.price,
          change: typeof entry.usd_24h_change === 'number' ? entry.usd_24h_change : base.change,
          source: 'live',
        };
      });

      // Derive fiat-per-USD from any coin that returned both currencies
      const ref = Object.values(json).find(e => e?.usd && e?.eur);
      const rates = ref
        ? { USD: 1, EUR: ref.eur / ref.usd, GBP: (ref.gbp ?? ref.eur * DEFAULT_FIAT_RATES.GBP / DEFAULT_FIAT_RATES.EUR) / ref.usd }
        : fiatRates;

      setPrices(live);
      setFiatRates(rates);
      setSource('live');
      setError(null);
      writeCache(live, rates);
    } catch (e) {
      // Keep whatever we had on screen; just surface the state
      setError(e.message || 'Failed to fetch prices');
      setSource(prev => (prev === 'live' ? 'cache' : prev));
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Serve from cache instantly if it's fresh, otherwise fetch on mount
    const cached = readCache();
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      setLoading(false);
    } else {
      fetchPrices();
    }

    if (!refresh) return undefined;

    const id = setInterval(() => {
      if (document.visibilityState === 'visible') fetchPrices();
    }, REFRESH_INTERVAL);
    return () => clearInterval(id);
  }, [fetchPrices, refresh]);

  const manualRefresh = useCallback(() => fetchPrices(), [fetchPrices]);

  return { prices, fiatRates, source, isLive: source === 'live', loading, error, refresh: manualRefresh };
}

const HISTORY_KEY = 'ripple-market-history-cache';
const HISTORY_TTL = 15 * 60 * 1000; // 15 minutes

function readJSONCache(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeJSONCache(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable */
  }
}

/**
 * Real portfolio history for a fixed holdings basket, built from CoinGecko's
 * daily market charts (one request per coin, cached for 15 minutes).
 *
 * Returns { history, source, loading } where history is an array of
 * { m: 'Jun 12', v: 63.4 } points — v is the basket value in thousands USD,
 * matching the landing hero chart's existing dataKey/formatter.
 * Falls back to null (caller uses its static demo data) if the API fails.
 */
export function useMarketHistory({ holdings = {}, days = 30 } = {}) {
  const coinsKey = Object.keys(holdings).join(',');

  const [history, setHistory] = useState(() => {
    const cached = readJSONCache(HISTORY_KEY);
    if (cached && Date.now() - cached.ts < HISTORY_TTL && Array.isArray(cached.history)) {
      return cached.history;
    }
    return null;
  });
  const [source, setSource] = useState(() => {
    const cached = readJSONCache(HISTORY_KEY);
    return cached && Date.now() - cached.ts < HISTORY_TTL ? 'cache' : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const coins = coinsKey ? coinsKey.split(',') : [];
      if (coins.length === 0) {
        setLoading(false);
        return;
      }
      try {
        const results = await Promise.all(coins.map(async (coin) => {
          const gid = COINGECKO_IDS[coin];
          if (!gid) return null;
          const res = await fetch(
            `https://api.coingecko.com/api/v3/coins/${gid}/market_chart?vs_currency=usd&days=${days}&interval=daily`
          );
          if (!res.ok) throw new Error(`CoinGecko ${res.status} for ${coin}`);
          const json = await res.json();
          return { coin, prices: json.prices || [] };
        }));

        const ok = results.filter(r => r && r.prices.length > 0);
        if (cancelled) return;
        if (ok.length === 0) {
          setLoading(false);
          return; // keep fallback (null → caller uses static data)
        }

        const len = Math.min(...ok.map(r => r.prices.length));
        const series = [];
        for (let i = 0; i < len; i++) {
          let value = 0;
          for (const r of ok) {
            value += (holdings[r.coin] || 0) * r.prices[i][1];
          }
          const label = new Date(ok[0].prices[i][0]).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          series.push({ m: label, v: Math.round((value / 1000) * 10) / 10 });
        }

        setHistory(series);
        setSource('live');
        writeJSONCache(HISTORY_KEY, { ts: Date.now(), history: series });
      } catch {
        /* keep whatever fallback the caller has */
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    const cached = readJSONCache(HISTORY_KEY);
    if (cached && Date.now() - cached.ts < HISTORY_TTL && Array.isArray(cached.history)) {
      setLoading(false); // fresh cache, no fetch needed
    } else {
      run();
    }

    return () => {
      cancelled = true;
    };
  }, [coinsKey, days]); // eslint-disable-line react-hooks/exhaustive-deps

  return { history, source, loading };
}
