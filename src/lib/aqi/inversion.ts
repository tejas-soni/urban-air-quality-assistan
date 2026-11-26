export interface InversionAssessment {
  severity: 'severe' | 'moderate' | 'none';
  isInversion: boolean;
  lapseRateC: number;
  headline: string;
  guidance: string;
  bestVentilationWindow: string;
}

/** Evaluates winter atmospheric thermal inversion trapping from surface/aloft temps and wind speed. */
export function evaluateInversionRisk(
  tempGroundC: number,
  tempAloftC: number,
  windSpeedKmh: number,
  aqi: number,
): InversionAssessment {
  const safeGround = Number.isFinite(tempGroundC) ? tempGroundC : 8;
  const safeAloft = Number.isFinite(tempAloftC) ? tempAloftC : 11;
  const safeWind = Number.isFinite(windSpeedKmh) ? Math.max(0, windSpeedKmh) : 4;
  const safeAqi = Number.isFinite(aqi) ? Math.max(0, aqi) : 50;
  const lapseRateC = Math.round((safeAloft - safeGround) * 10) / 10;

  if ((lapseRateC > 2 && safeWind < 6) || safeAqi > 200) {
    return {
      severity: 'severe',
      isInversion: true,
      lapseRateC,
      headline: `Severe Smog Trapping Risk (+${Math.max(0, lapseRateC)}°C aloft · ${safeWind} km/h wind)`,
      guidance:
        'Nocturnal cold surface air + low wind traps tailpipe and heating PM2.5 near street level. Keep windows sealed until afternoon solar mixing.',
      bestVentilationWindow: '14:00–16:00 (brief check only if outdoor AQI drops)',
    };
  }

  if (lapseRateC > 0 && safeWind < 12) {
    return {
      severity: 'moderate',
      isInversion: true,
      lapseRateC,
      headline: `Moderate Morning Inversion (+${lapseRateC}°C aloft · ${safeWind} km/h wind)`,
      guidance:
        'Morning rush-hour emissions accumulate slowly before midday warming breaks the boundary layer.',
      bestVentilationWindow: '13:00–16:00 (~40% lower outdoor PM2.5)',
    };
  }

  return {
    severity: 'none',
    isInversion: false,
    lapseRateC,
    headline: `Active Atmospheric Dispersion (${safeWind} km/h wind)`,
    guidance:
      'Vertical mixing is dispersing ground-level particulates cleanly. Standard afternoon airing applies.',
    bestVentilationWindow: '12:00–17:00',
  };
}
