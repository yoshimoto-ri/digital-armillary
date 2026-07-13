import { AstroTime } from 'astronomy-engine';
import type { Mansion } from '../data/types';
import { norm360, starEclipticLonOfDate } from './frames';

export interface MansionBoundary {
  mansion: Mansion;
  /** 該宿距星在指定時刻的當日黃道黃經（度） */
  lon: number;
}

/**
 * 計算指定時刻的宿界：28 顆距星換算為當日黃道黃經後**依黃經排序**。
 * 宿界綁定恆星（恆星黃道），歲差之下會相對十二宮（回歸黃道）漂移。
 * 依實際黃經排序也如實處理「觜參易位」（現代 觜宿二黃經 > 參宿三黃經）。
 */
export function mansionBoundaries(mansions: Mansion[], time: AstroTime): MansionBoundary[] {
  return mansions
    .map((m) => ({ mansion: m, lon: starEclipticLonOfDate(m.raJ2000, m.decJ2000, time) }))
    .sort((a, b) => a.lon - b.lon);
}

/** 黃經（當日黃道，度）→ 所在宿。boundaries 需來自 mansionBoundaries()（已排序）。 */
export function mansionOf(eclipticLonOfDate: number, boundaries: MansionBoundary[]): Mansion {
  const lon = norm360(eclipticLonOfDate);
  // 找出黃經 ≤ lon 的最後一個距星；都大於則屬（環狀）最後一宿
  let found = boundaries[boundaries.length - 1];
  for (const b of boundaries) {
    if (b.lon <= lon) found = b;
    else break;
  }
  return found.mansion;
}
