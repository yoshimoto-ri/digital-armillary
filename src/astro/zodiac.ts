import { ZODIAC_NAMES } from '../data/zodiacNames';
import { norm360 } from './frames';

export interface ZodiacPosition {
  /** 宮序 0–11 */
  index: number;
  name: string;
  /** 宮內度數 0–30 */
  degreeInSign: number;
}

/** 當日黃經（度）→ 所在宮。回歸黃道等分制：春分點起每 30° 一宮。 */
export function zodiacOf(eclipticLonOfDate: number): ZodiacPosition {
  const lon = norm360(eclipticLonOfDate);
  const index = Math.min(11, Math.floor(lon / 30));
  return { index, name: ZODIAC_NAMES[index], degreeInSign: lon - index * 30 };
}
