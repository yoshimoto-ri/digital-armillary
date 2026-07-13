import { AstroTime, Body } from 'astronomy-engine';
import { geoEclipticLon } from './ephemeris';

export type MotionState = 'direct' | 'retrograde';

/**
 * 順行/逆行判定：取 t±0.5 日的地心黃經差分，僅判斷變化方向的正負，
 * 位置本身仍全由 astronomy-engine 計算。
 */
export function motionState(body: Body, time: AstroTime): MotionState | null {
  const before = geoEclipticLon(body, time.AddDays(-0.5));
  const after = geoEclipticLon(body, time.AddDays(0.5));
  if (before == null || after == null) return null;
  let d = after - before;
  // 跨 0°/360° 邊界時取最短角距
  if (d > 180) d -= 360;
  if (d < -180) d += 360;
  return d < 0 ? 'retrograde' : 'direct';
}
