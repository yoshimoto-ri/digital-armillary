import { Body } from 'astronomy-engine';

export type PlanetGroup = 'seven' | 'modern';

export interface PlanetSpec {
  key: string;
  nameZh: string;
  body: Body;
  /** 顯示顏色 */
  color: number;
  /** 渲染半徑（場景單位，示意非等比） */
  renderRadius: number;
  group: PlanetGroup;
  /** 渾象（地心）視角投影於天球面時的渲染半徑（場景單位，示意）。0 = 不顯示（地球） */
  geoRenderRadius: number;
  /** 現代行星的發現年（七曜為 undefined） */
  discoveryYear?: number;
  /** 恆星週期概略值（日）——僅用於決定軌道線取樣時間窗，非位置計算 */
  periodDays: number;
  /** 是否於日心視角繪製軌道線 */
  hasOrbit: boolean;
}

/** 七曜（日月五星）+ 地球。順序即 UI 顯示順序。 */
export const SEVEN_LUMINARIES: PlanetSpec[] = [
  { key: 'sun',     nameZh: '太陽', body: Body.Sun,     color: 0xffd75e, renderRadius: 11,  geoRenderRadius: 30, group: 'seven', periodDays: 0,     hasOrbit: false },
  { key: 'moon',    nameZh: '月球', body: Body.Moon,    color: 0xd8d8e8, renderRadius: 1.3, geoRenderRadius: 27, group: 'seven', periodDays: 27.3,  hasOrbit: false },
  { key: 'mercury', nameZh: '水星', body: Body.Mercury, color: 0x9aa0a8, renderRadius: 2.0, geoRenderRadius: 10, group: 'seven', periodDays: 88,    hasOrbit: true },
  { key: 'venus',   nameZh: '金星', body: Body.Venus,   color: 0xf0e0b0, renderRadius: 2.9, geoRenderRadius: 14, group: 'seven', periodDays: 225,   hasOrbit: true },
  { key: 'earth',   nameZh: '地球', body: Body.Earth,   color: 0x5aa0ff, renderRadius: 3.0, geoRenderRadius: 0,  group: 'seven', periodDays: 365.25, hasOrbit: true },
  { key: 'mars',    nameZh: '火星', body: Body.Mars,    color: 0xff6a4d, renderRadius: 2.5, geoRenderRadius: 12, group: 'seven', periodDays: 687,   hasOrbit: true },
  { key: 'jupiter', nameZh: '木星', body: Body.Jupiter, color: 0xe8b878, renderRadius: 6.5, geoRenderRadius: 18, group: 'seven', periodDays: 4333,  hasOrbit: true },
  { key: 'saturn',  nameZh: '土星', body: Body.Saturn,  color: 0xd8c890, renderRadius: 5.5, geoRenderRadius: 16, group: 'seven', periodDays: 10759, hasOrbit: true },
];

/** 現代三王星（冷色系、虛線軌道、附發現年） */
export const MODERN_PLANETS: PlanetSpec[] = [
  { key: 'uranus',  nameZh: '天王星', body: Body.Uranus,  color: 0x7fd4d4, renderRadius: 4.2, geoRenderRadius: 10, group: 'modern', discoveryYear: 1781, periodDays: 30687, hasOrbit: true },
  { key: 'neptune', nameZh: '海王星', body: Body.Neptune, color: 0x5f8fe8, renderRadius: 4.0, geoRenderRadius: 10, group: 'modern', discoveryYear: 1846, periodDays: 60190, hasOrbit: true },
  { key: 'pluto',   nameZh: '冥王星', body: Body.Pluto,   color: 0xb0a4c8, renderRadius: 1.8, geoRenderRadius: 7,  group: 'modern', discoveryYear: 1930, periodDays: 90560, hasOrbit: true },
];

export const ALL_PLANETS: PlanetSpec[] = [...SEVEN_LUMINARIES, ...MODERN_PLANETS];

/** 會顯示順/逆行狀態的天體（日月除外） */
export const HAS_RETROGRADE = new Set(
  ALL_PLANETS.filter((p) => p.key !== 'sun' && p.key !== 'moon' && p.key !== 'earth').map((p) => p.key),
);
