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

/**
 * 天文年 → 該年 1 月 1 日（UTC）。
 * 不用 Date.UTC(y, …)：其對 0–99 年會誤加 1900，須以 setUTCFullYear 設定。
 */
export function dateFromAstronomicalYear(year: number): Date {
  const d = new Date(Date.UTC(2000, 0, 1));
  d.setUTCFullYear(year);
  return d;
}

/** 天文年 → 顯示字串（年 0 = 西元前 1 年） */
export function formatAstronomicalYear(year: number): string {
  return year > 0 ? `西元 ${year} 年` : `西元前 ${1 - year} 年`;
}
