import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { cryptoPrices, availableProducts } from '../data/mockData';

// Fetch user's wallets and combine with live/mock prices
export function useWallets() {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    const fetchWallets = async () => {
      const { data: walletsData } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user.id);
        
      if (walletsData) {
        // Map with crypto details
        const enriched = walletsData.map(w => {
          const coinData = cryptoPrices.find(c => c.coin === w.asset) || { price: 0, icon: '?', color: '#ccc', change: 0 };
          return {
            id: w.id,
            coin: w.asset,
            name: w.asset === 'BTC' ? 'Bitcoin' : w.asset === 'ETH' ? 'Ethereum' : w.asset === 'USDT' ? 'Tether' : w.asset === 'SOL' ? 'Solana' : w.asset,
            balance: Number(w.balance),
            usdValue: Number(w.balance) * coinData.price,
            change24h: coinData.change,
            icon: coinData.icon,
            color: coinData.color
          };
        });
        setData(enriched);
      }
      setLoading(false);
    };

    fetchWallets();

    // Listen for real-time wallet updates
    const channel = supabase
      .channel('wallets_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wallets', filter: `user_id=eq.${user.id}` }, fetchWallets)
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user]);

  return { data, loading };
}

// Fetch user's investments
export function useInvestments() {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchInvestments = async () => {
      const { data: invData } = await supabase
        .from('investments')
        .select('*, investment_products(*)')
        .eq('user_id', user.id);

      if (invData) {
        const enriched = invData.map(inv => {
          const prod = inv.investment_products;
          return {
            id: inv.id,
            type: prod.type,
            name: prod.name,
            apy: Number(prod.apy),
            minDeposit: Number(prod.min_deposit),
            duration: prod.duration_days,
            totalInvested: Number(inv.amount_usd),
            currentValue: Number(inv.current_value || inv.amount_usd),
            pnl: Number(inv.yield_earned),
            pnlPercent: Number(inv.amount_usd) > 0 ? (Number(inv.yield_earned) / Number(inv.amount_usd)) * 100 : 0,
            status: inv.status,
            color: prod.color,
            icon: prod.icon,
          };
        });
        setData(enriched);
      }
      setLoading(false);
    };

    fetchInvestments();
  }, [user]);

  return { data, loading };
}

// Fetch user's transactions
export function useTransactions() {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchTxs = async () => {
      const { data: txData } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (txData) {
        const mapped = txData.map(tx => ({
          id: tx.id,
          type: tx.type,
          asset: tx.asset,
          amount: tx.type === 'deposit' || tx.type === 'yield' ? Number(tx.amount_crypto) : -Number(tx.amount_crypto),
          usdValue: Number(tx.amount_usd),
          status: tx.status,
          date: new Date(tx.created_at).toISOString().split('T')[0],
          time: new Date(tx.created_at).toISOString().split('T')[1].substring(0,5),
          hash: tx.tx_hash || 'internal'
        }));
        setData(mapped);
      }
      setLoading(false);
    };

    fetchTxs();

    const channel = supabase
      .channel('tx_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${user.id}` }, fetchTxs)
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user]);

  return { data, loading };
}

// Fetch all available products
export function useProducts() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      const { data: prodData } = await supabase
        .from('investment_products')
        .select('*')
        .eq('is_active', true)
        .order('apy', { ascending: true });

      if (prodData && prodData.length > 0) {
        const mapped = prodData.map(p => ({
          id: p.id,
          type: p.type,
          name: p.name,
          subtitle: p.duration_days ? `${p.duration_days}-Day Lock` : 'Flexible Access',
          apy: Number(p.apy),
          minDeposit: Number(p.min_deposit),
          duration: p.duration_days,
          risk: p.risk_level.charAt(0).toUpperCase() + p.risk_level.slice(1),
          icon: p.icon,
          gradient: `linear-gradient(135deg, ${p.color}, #19172a)`,
          color: p.color,
          features: p.features,
        }));
        setData(mapped);
      } else {
        // Fallback to mock data if empty (just in case they didn't run the seed)
        setData(availableProducts);
      }
      setLoading(false);
    };

    fetchProducts();
  }, []);

  return { data, loading };
}

// Fetch Portfolio snapshots
export function usePortfolioHistory() {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    const fetchHistory = async () => {
      const { data: snaps } = await supabase
        .from('portfolio_snapshots')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: true });

      if (snaps && snaps.length > 0) {
        setData(snaps.map(s => ({
          date: new Date(s.date).toLocaleString('default', { month: 'short' }),
          value: Number(s.total_usd)
        })));
      } else {
        // Provide an empty timeline if no snaps exist
        setData([
          { date: 'Jan', value: 0 }, { date: 'Feb', value: 0 }
        ]);
      }
      setLoading(false);
    };

    fetchHistory();
  }, [user]);

  return { data, loading };
}

// Fetch user's assigned deposit addresses
export function useDepositAddresses() {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    const fetchAddresses = async () => {
      const { data: addrs } = await supabase
        .from('deposit_addresses')
        .select('*')
        .eq('user_id', user.id);

      if (addrs) {
        setData(addrs);
      }
      setLoading(false);
    };

    fetchAddresses();
  }, [user]);

  return { data, loading };
}
