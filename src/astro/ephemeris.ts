import { AstroTime, Body, Ecliptic, GeoVector, HelioVector } from 'astronomy-engine';

/** EQJ（J2000 平赤道）直角座標，單位 AU。本層一律輸出純 EQJ（ARCHITECTURE.md §4.1）。 */
export interface EqjVec {
  x: number;
  y: number;
  z: number;
}

/**
 * 日心 EQJ 向量（AU）。
 * 冥王星等在 astronomy-engine 支援範圍外會拋錯，回傳 null 由呼叫端隱藏該天體。
 */
export function helioVec(body: Body, time: AstroTime): EqjVec | null {
  try {
    const v = HelioVector(body, time);
    return { x: v.x, y: v.y, z: v.z };
  } catch {
    return null;
  }
}

/** 地心 EQJ 向量（AU），含光行時修正。範圍外回傳 null。 */
export function geoVec(body: Body, time: AstroTime): EqjVec | null {
  try {
    const v = GeoVector(body, time, true);
    return { x: v.x, y: v.y, z: v.z };
  } catch {
    return null;
  }
}

/** 地心「當日黃道」黃經（度，0–360）。定宮、側欄顯示用。範圍外回傳 null。 */
export function geoEclipticLon(body: Body, time: AstroTime): number | null {
  try {
    const v = GeoVector(body, time, true);
    return Ecliptic(v).elon;
  } catch {
    return null;
  }
}
