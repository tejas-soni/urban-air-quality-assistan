import { AlertTriangle, ShieldAlert, ShieldCheck, Siren, Skull, Sun } from 'lucide-react';
import { classifyAqi } from '@/lib/aqi/bands';
import type { AqiBandInfo } from '@/lib/types';

interface AqiBadgeProps {
  aqi: number;
  compact?: boolean;
}

const ICON_MAP: Record<AqiBandInfo['iconName'], typeof Sun> = {
  'shield-check': ShieldCheck,
  sun: Sun,
  'alert-triangle': AlertTriangle,
  'shield-alert': ShieldAlert,
  siren: Siren,
  skull: Skull,
};

export function AqiBadge({ aqi, compact = false }: AqiBadgeProps) {
  const info = classifyAqi(aqi);
  const Icon = ICON_MAP[info.iconName];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-semibold ${info.bgClass} ${info.textClass} ${info.borderClass}`}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{compact ? info.shortLabel : info.label}</span>
      <span className="font-bold">({aqi})</span>
    </span>
  );
}
