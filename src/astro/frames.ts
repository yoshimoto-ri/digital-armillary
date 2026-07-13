import {
  AstroTime,
  Ecliptic,
  RotateVector,
  Rotation_ECT_EQJ,
  Rotation_EQD_EQJ,
  Spherical,
  Vector,
  VectorFromSphere,
} from 'astronomy-engine';
import type { EqjVec } from './ephemeris';

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
