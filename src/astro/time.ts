import { AstroTime, MakeTime } from 'astronomy-engine';

/** 時間軸範圍：西元前 1000 年（天文年 -999）至西元 5000 年 */
export const MIN_DATE = new Date(Date.UTC(-999, 0, 1));
export const MAX_DATE = new Date(Date.UTC(5000, 11, 31));

export function clampDate(d: Date): Date {
  if (d < MIN_DATE) return new Date(MIN_DATE);
  if (d > MAX_DATE) return new Date(MAX_DATE);
  return d;
}

export function toAstroTime(d: Date): AstroTime {
  return MakeTime(d);
}
