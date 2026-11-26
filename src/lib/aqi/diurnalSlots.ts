/**
 * 24-hour winter inversion diurnal PM2.5 curve factors highlighting the afternoon airing window.
 */
export const DIURNAL_SLOTS: readonly { label: string; factor: number; lowest?: boolean }[] = [
  { label: '00:00', factor: 1.15 },
  { label: '03:00', factor: 1.1 },
  { label: '06:00', factor: 1.24 },
  { label: '08:00', factor: 1.28 },
  { label: '11:00', factor: 0.96 },
  { label: '14:00', factor: 0.74, lowest: true },
  { label: '17:00', factor: 0.94 },
  { label: '21:00', factor: 1.26 },
];
