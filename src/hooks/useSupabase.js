import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useCryptoPrices } from './useCryptoPrices';
import { cryptoPrices as MOCK_PRICES, availableProducts } from '../data/mockData';
import { normalizeIcon, coinMeta } from '../utils/icons';

// Fetch user's wallets and combine with live/mock prices
export function useWallets() {
  const { user } = useAuth();
  const { prices } = useCryptoPrices();
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
        // Enrich wallet rows with live prices and normalized coin metadata
        const enriched = walletsData.map(w => {
          const meta = coinMeta(w.asset);
          const priceRow = prices.find(c => c.coin === w.asset);
          const price = priceRow?.price ?? 0;
          return {
            id: w.id,
            coin: w.asset,
            name: meta.name,
            balance: Number(w.balance),
            usdValue: Number(w.balance) * price,
            change24h: priceRow?.change ?? 0,
            icon: meta.icon,
            color: meta.color,
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
  }, [user, prices]);

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
            icon: normalizeIcon(prod.icon),
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
          icon: normalizeIcon(p.icon),
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

// Fetch user's assigned deposit addresses (realtime — admin assignment shows up instantly)
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

    const channel = supabase
      .channel('deposit_addresses_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deposit_addresses', filter: `user_id=eq.${user.id}` }, fetchAddresses)
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user]);

  return { data, loading };
}

// ─── ADMIN PORTAL ─────────────────────────────────────────
// Paginated + searchable users list for /admin.
// Requires the caller to be an admin (RLS blocks others).
export function useAdminUsers(page, pageSize, search) {
  const [users, setUsers] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchUsers = async () => {
      setLoading(true);
      let query = supabase
        .from('profiles')
        // wallets joined so the table can show a per-user balance summary
        .select('id, full_name, email, created_at, role, status, gas_fee, wallets(asset, balance)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

      if (search) {
        query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
      }

      const { data, count: totalCount } = await query;
      if (!cancelled) {
        if (data) {
          setUsers(data.map(u => ({
            ...u,
            gas_fee: Number(u.gas_fee ?? 3.80),
            wallets: (u.wallets || []).map(w => ({ asset: w.asset, balance: Number(w.balance) })),
          })));
        }
        if (totalCount !== null) setCount(totalCount);
        setLoading(false);
      }
    };

    fetchUsers();
    return () => { cancelled = true; };
  }, [page, pageSize, search]);

  const totalPages = Math.max(1, Math.ceil(count / pageSize));
  return { users, count, totalPages, loading };
}

// Everything the admin drawer needs for one user.
// Realtime on wallets/transactions so balance edits show instantly;
// `refetch()` covers profile/request changes that have no channel.
export function useAdminUserDetail(userId) {
  const [wallets, setWallets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [addressRequests, setAddressRequests] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!userId) return;

    const fetchAll = async () => {
      const [prof, wals, txs, addrs, reqs] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('wallets').select('*').eq('user_id', userId).order('asset'),
        supabase.from('transactions').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(50),
        supabase.from('deposit_addresses').select('*').eq('user_id', userId).order('asset'),
        supabase.from('address_requests').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      ]);

      const firstError = prof.error || wals.error || txs.error || addrs.error || reqs.error;
      if (firstError) setError(firstError.message);
      if (prof.data) setUser({ ...prof.data, gas_fee: Number(prof.data.gas_fee ?? 3.80) });
      if (wals.data) setWallets(wals.data.map(w => ({ ...w, balance: Number(w.balance) })));
      if (txs.data) setTransactions(txs.data);
      if (addrs.data) setAddresses(addrs.data);
      if (reqs.data) setAddressRequests(reqs.data);
      setLoading(false);
    };

    fetchAll();

    const channel = supabase
      .channel(`admin_user_${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wallets', filter: `user_id=eq.${userId}` }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${userId}` }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deposit_addresses', filter: `user_id=eq.${userId}` }, fetchAll)
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [userId, tick]);

  return { user, wallets, transactions, addresses, addressRequests, loading, error, refetch: () => setTick((t) => t + 1) };
}

// Fetch user's address requests (e.g. "Request USDT address" -> pending)
export function useAddressRequests() {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = true;

  useEffect(() => {
    if (!user) return;

    const fetchRequests = async () => {
      const { data: reqs } = await supabase
        .from('address_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (reqs) {
        setData(reqs);
      }
      setLoading(false);
    };

    fetchRequests();

    const channel = supabase
      .channel('address_requests_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'address_requests', filter: `user_id=eq.${user.id}` }, fetchRequests)
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user]);

  return { data, loading };
}
