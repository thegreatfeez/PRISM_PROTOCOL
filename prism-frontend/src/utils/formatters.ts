import { formatUnits, parseUnits } from "viem";

// ─── Address ──────────────────────────────────────────────────────────────────

export function shortenAddress(address: string, chars = 4): string {
  if (!address) return "";
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

// ─── Token Amounts ────────────────────────────────────────────────────────────

export function formatToken(amount: bigint, decimals = 18, displayDecimals = 4): string {
  const formatted = formatUnits(amount, decimals);
  const num = parseFloat(formatted);
  if (num === 0) return "0";
  if (num < 0.0001) return "< 0.0001";
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: displayDecimals,
  });
}

export function formatEth(amount: bigint, displayDecimals = 6): string {
  return formatToken(amount, 18, displayDecimals);
}

export function parseToken(amount: string, decimals = 18): bigint {
  try {
    return parseUnits(amount, decimals);
  } catch {
    return 0n;
  }
}

// ─── Time ─────────────────────────────────────────────────────────────────────

export function formatDuration(seconds: bigint): string {
  const s = Number(seconds);
  const days = Math.floor(s / 86400);
  const hours = Math.floor((s % 86400) / 3600);
  if (days > 0) return `${days}d ${hours}h`;
  return `${hours}h`;
}

export function formatDeadline(timestamp: bigint): string {
  if (timestamp === 0n) return "—";
  const date = new Date(Number(timestamp) * 1000);
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function isExpired(timestamp: bigint): boolean {
  return timestamp > 0n && Number(timestamp) * 1000 < Date.now();
}

export function timeRemaining(timestamp: bigint): string {
  const ms = Number(timestamp) * 1000 - Date.now();
  if (ms <= 0) return "Expired";
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  if (hours > 24) return `${Math.floor(hours / 24)}d remaining`;
  return `${hours}h ${minutes}m remaining`;
}

// ─── BPS ──────────────────────────────────────────────────────────────────────

export function formatBps(bps: bigint): string {
  return `${(Number(bps) / 100).toFixed(2)}%`;
}

// ─── NFT Traits ───────────────────────────────────────────────────────────────

export function getTraitType(mage: boolean, attack: number, defense: number): string {
  if (mage) return "Mage";
  if (attack >= defense) return "Attack";
  return "Defense";
}

export function getTraitColor(trait: string): string {
  switch (trait) {
    case "Mage": return "violet";
    case "Attack": return "rose";
    case "Defense": return "sky";
    default: return "slate";
  }
}

// ─── Explorer URLs ────────────────────────────────────────────────────────────

const EXPLORER = "https://explorer.hashkey.cloud";

export function txUrl(hash: string): string {
  return `${EXPLORER}/tx/${hash}`;
}

export function addressUrl(addr: string): string {
  return `${EXPLORER}/address/${addr}`;
}

export function tokenUrl(tokenId: bigint): string {
  return `${EXPLORER}/token/${tokenId}`;
}
