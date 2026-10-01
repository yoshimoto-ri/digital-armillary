import {
  AstroTime,
  Ecliptic,
  MakeTime,
  RotateVector,
  Rotation_ECL_EQJ,
  Rotation_ECT_EQJ,
  Rotation_EQD_EQJ,
  Rotation_EQJ_ECL,
  Spherical,
  Vector,
  VectorFromSphere,
} from 'astronomy-engine';
import type { EqjVec } from './ephemeris';

/** J2000 平黃道旋轉為時間無關常數，向量僅需任一時刻標記 */
const T0 = MakeTime(0);

/** J2000 赤經赤緯（度）→ EQJ 單位向量。恆星視為無窮遠，只取方向。 */
export function raDecToEqjUnit(raDeg: number, decDeg: number): EqjVec {
  const ra = (raDeg * Math.PI) / 180;
  const dec = (decDeg * Math.PI) / 180;
  const c = Math.cos(dec);
  return { x: c * Math.cos(ra), y: c * Math.sin(ra), z: Math.sin(dec) };
}

/**
 * 恆星（J2000 座標）在指定時刻的「當日黃道」黃經（度，0–360）。
 * 透過 astronomy-engine 的框架轉換取得，不自行實作歲差（ARCHITECTURE.md §4.4）。
 */
export function starEclipticLonOfDate(raDeg: number, decDeg: number, time: AstroTime): number {
  const v = VectorFromSphere(new Spherical(decDeg, raDeg, 1), time);
  return Ecliptic(v).elon;
}

/**
 * 「當日黃道」座標（黃經 λ、黃緯 β，度）→ EQJ 單位向量。
 * 用於把當日黃道線、十二宮宮界投影回 EQJ 世界座標繪製——
 * 恆星不動、框架在動，歲差漂移自然浮現（ARCHITECTURE.md §4.4）。
 */
export function eclipticOfDateToEqj(lonDeg: number, latDeg: number, time: AstroTime): EqjVec {
  const lon = (lonDeg * Math.PI) / 180;
  const lat = (latDeg * Math.PI) / 180;
  const c = Math.cos(lat);
  const v = new Vector(c * Math.cos(lon), c * Math.sin(lon), Math.sin(lat), time);
  const r = RotateVector(Rotation_ECT_EQJ(time), v);
  return { x: r.x, y: r.y, z: r.z };
}

/** 「當日赤道」座標（赤經 α、赤緯 δ，度）→ EQJ 單位向量。天赤道線用。 */
export function equatorOfDateToEqj(raDeg: number, decDeg: number, time: AstroTime): EqjVec {
  const ra = (raDeg * Math.PI) / 180;
  const dec = (decDeg * Math.PI) / 180;
  const c = Math.cos(dec);
  const v = new Vector(c * Math.cos(ra), c * Math.sin(ra), Math.sin(dec), time);
  const r = RotateVector(Rotation_EQD_EQJ(time), v);
  return { x: r.x, y: r.y, z: r.z };
}

/** 度數正規化至 [0, 360) */
export function norm360(deg: number): number {
  const d = deg % 360;
  return d < 0 ? d + 360 : d;
}

/** 黃經格式化為「123°45′」 */
export function formatLon(deg: number): string {
  const d = norm360(deg);
  const whole = Math.floor(d);
  const min = Math.round((d - whole) * 60);
  return min === 60 ? `${whole + 1}°00′` : `${whole}°${String(min).padStart(2, '0')}′`;
}

/**
 * 恆星（J2000 赤經赤緯）的 **J2000 平黃道** 黃經（度，0–360）。
 * 恆星系框架、與時間無關——宿界綁定恆星即以此黃經劃定與排序繪製
 * （runtime 定宿用當日黃經排序，兩者順序與間隔一致，僅整體相差歲差偏移）。
 */
export function starEclipticLonJ2000(raDeg: number, decDeg: number): number {
  const v = VectorFromSphere(new Spherical(decDeg, raDeg, 1), T0);
  const e = RotateVector(Rotation_EQJ_ECL(), v);
  const lon = (Math.atan2(e.y, e.x) * 180) / Math.PI;
  return norm360(lon);
}

/** J2000 平黃道座標（黃經 λ、黃緯 β，度）→ EQJ 單位向量。宿界刻線（恆星系、不隨時間）用。 */
export function eclJ2000ToEqj(lonDeg: number, latDeg: number): EqjVec {
  const lon = (lonDeg * Math.PI) / 180;
  const lat = (latDeg * Math.PI) / 180;
  const c = Math.cos(lat);
  const v = new Vector(c * Math.cos(lon), c * Math.sin(lon), Math.sin(lat), T0);
  const r = RotateVector(Rotation_ECL_EQJ(), v);
  return { x: r.x, y: r.y, z: r.z };
}
