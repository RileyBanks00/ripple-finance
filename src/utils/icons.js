/**
 * Shared helpers for normalizing data-driven icons and coin metadata.
 * Legacy values (emojis from the DB seed) are mapped to semantic icon keys
 * that the <DataIcon /> component understands.
 */

const LEGACY_ICON_MAP = {
  '🔒': 'locked',
  '💰': 'banknote',
  '💵': 'banknote',
  '📈': 'trending-up',
  '🚀': 'rocket',
  '⚡': 'bolt',
  '💎': 'sparkles',
  '👥': 'users',
  '🌍': 'globe',
  '⬇': 'deposit',
  '⬆': 'withdraw',
  '🎁': 'yield',
  '🔐': 'locked',
  '🛡': 'shield',
  '✅': 'check-badge',
  '⚠': 'warning',
  'ℹ': 'info',
  '🔍': 'search',
  '🎉': 'sparkles',
  // Coin glyphs used in old seeds
  '₿': 'coins',
  'Ξ': 'cube',
  '₮': 'banknote',
  '◎': 'bolt',
  'B': 'coins',
  'A': 'triangle',
  '₳': 'coins',
  '●': 'sparkles',
  'M': 'cube',
};

export function normalizeIcon(icon) {
  if (!icon) return 'sparkles';
  const key = String(icon).trim();
  return LEGACY_ICON_MAP[key] || key;
}

export const COIN_META = {
  BTC:  { name: 'Bitcoin',  color: '#f7931a', icon: 'coins' },
  ETH:  { name: 'Ethereum', color: '#627eea', icon: 'cube' },
  USDT: { name: 'Tether',   color: '#26a17b', icon: 'banknote' },
  SOL:  { name: 'Solana',   color: '#9945ff', icon: 'bolt' },
  BNB:  { name: 'BNB',      color: '#f0b90b', icon: 'coins' },
};

export function coinMeta(asset) {
  return COIN_META[asset] || { name: asset, color: '#64748b', icon: 'coins' };
}
