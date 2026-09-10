import {
  LockClosedIcon,
  BanknotesIcon,
  ArrowTrendingUpIcon,
  RocketLaunchIcon,
  CurrencyDollarIcon,
  CubeTransparentIcon,
  CircleStackIcon,
  GlobeAltIcon,
  UsersIcon,
  BoltIcon,
  SparklesIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  ScaleIcon,
  GiftIcon,
  FireIcon,
  ShieldCheckIcon,
  CheckBadgeIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  MagnifyingGlassIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/react/24/outline';

/**
 * Maps data-driven icon keys (and legacy emojis from the DB seed) to
 * Heroicons so icons stay consistent with the design system.
 * Usage: <DataIcon name="locked" /> — name comes from data (mockData/DB `icon` field).
 */
const ICON_MAP = {
  // Product / finance keys
  locked:        LockClosedIcon,
  banknote:      BanknotesIcon,
  'trending-up': ArrowTrendingUpIcon,
  rocket:        RocketLaunchIcon,
  dollar:        CurrencyDollarIcon,
  cube:          CubeTransparentIcon,
  coins:         CircleStackIcon,
  globe:         GlobeAltIcon,
  users:         UsersIcon,
  bolt:          BoltIcon,
  sparkles:      SparklesIcon,
  deposit:       ArrowDownTrayIcon,
  withdraw:      ArrowUpTrayIcon,
  yield:         BanknotesIcon,
  scale:         ScaleIcon,
  triangle:      FireIcon,
  lock:          LockClosedIcon,
  shield:        ShieldCheckIcon,
  'check-badge': CheckBadgeIcon,
  warning:       ExclamationTriangleIcon,
  info:          InformationCircleIcon,
  search:        MagnifyingGlassIcon,

  // Legacy emoji aliases (DB seed / older mock data)
  '🔒': LockClosedIcon,
  '💰': BanknotesIcon,
  '📈': ArrowTrendingUpIcon,
  '🚀': RocketLaunchIcon,
  '💵': CurrencyDollarIcon,
  '⚡': BoltIcon,
  '💎': SparklesIcon,
  '👥': UsersIcon,
  '🌍': GlobeAltIcon,
  '⬇': ArrowDownTrayIcon,
  '⬆': ArrowUpTrayIcon,
  '♻': ScaleIcon,
  '🎁': GiftIcon,
  '🔐': LockClosedIcon,
  '🛡': ShieldCheckIcon,
  '✅': CheckBadgeIcon,
  '⚠': ExclamationTriangleIcon,
  'ℹ': InformationCircleIcon,
  '🔍': MagnifyingGlassIcon,
  '🎉': SparklesIcon,

  // Legacy coin glyphs (DB seed / older mock data)
  '₿': CircleStackIcon,
  'Ξ': CubeTransparentIcon,
  '₮': BanknotesIcon,
  '◎': BoltIcon,
  'B': CircleStackIcon,
  'A': FireIcon,
  '₳': CircleStackIcon,
  '●': SparklesIcon,
  'M': CircleStackIcon,
};

const FALLBACK = QuestionMarkCircleIcon;

export default function DataIcon({ name, className = 'data-icon', ...rest }) {
  const key = name == null ? '' : String(name).trim();
  const Icon = ICON_MAP[key] || FALLBACK;
  return <Icon className={className} aria-hidden="true" {...rest} />;
}
