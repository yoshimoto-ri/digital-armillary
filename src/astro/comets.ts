import { AstroTime, Body, Ecliptic, RotateVector, Rotation_ECL_EQJ, Vector } from 'astronomy-engine';
import type { CometSpec } from '../data/comets';
import { helioVec, type EqjVec } from './ephemeris';

/**
 * 彗星二體克卜勒傳播（ARCHITECTURE.md §7.4——規格明定的唯一自算項目）。
 * 平近點角 → 牛頓迭代解克卜勒方程 → 軌道面座標 → 依 (ω, i, Ω) 旋轉至 J2000 黃道
 * → 引擎旋轉矩陣轉 EQJ。此為精確二體解而非近似公式；未含行星攝動，
 * 離近日點曆元越遠誤差越大（UI 常駐註明）。
 */

/** J2000.0 的儒略日 */
const JD_J2000 = 2451545.0;
/** 高斯年（日）：GM_sun 對應之 a=1 AU 週期 */
const GAUSSIAN_YEAR_DAYS = 365.2568983;

/** 半長軸（AU） */
export function semiMajorAxis(spec: CometSpec): number {
  return spec.q / (1 - spec.e);
}

/** 二體週期（日），由半長軸推得（與傳播一致，不用顯示用的概略週期） */
export function orbitalPeriodDays(spec: CometSpec): number {
  return GAUSSIAN_YEAR_DAYS * Math.pow(semiMajorAxis(spec), 1.5);
}

/** 牛頓迭代解克卜勒方程 E − e·sinE = M。高離心率時以 π 起步保證收斂。 */
function solveKepler(M: number, e: number): number {
  // M 正規化至 (−π, π]
  let m = M % (2 * Math.PI);
  if (m > Math.PI) m -= 2 * Math.PI;
  if (m <= -Math.PI) m += 2 * Math.PI;
  let E = e < 0.8 ? m : Math.PI * Math.sign(m || 1);
  for (let i = 0; i < 60; i++) {
    const dE = (E - e * Math.sin(E) - m) / (1 - e * Math.cos(E));
    E -= dE;
    if (Math.abs(dE) < 1e-12) break;
  }
  return E;
}

const DEG = Math.PI / 180;

/** 偏近點角 E → 日心 EQJ 位置（AU）。軌道面 → (ω, i, Ω) → J2000 黃道 → EQJ。 */
function positionFromE(spec: CometSpec, E: number, time: AstroTime): EqjVec {
  const a = semiMajorAxis(spec);
  const xp = a * (Math.cos(E) - spec.e); // 軌道面：x 指向近日點
  const yp = a * Math.sqrt(1 - spec.e * spec.e) * Math.sin(E);

  const cw = Math.cos(spec.periDeg * DEG), sw = Math.sin(spec.periDeg * DEG);
  const ci = Math.cos(spec.iDeg * DEG), si = Math.sin(spec.iDeg * DEG);
  const cn = Math.cos(spec.nodeDeg * DEG), sn = Math.sin(spec.nodeDeg * DEG);

  // Rz(Ω)·Rx(i)·Rz(ω)·[xp, yp, 0] → J2000 黃道直角座標
  const x1 = cw * xp - sw * yp;
  const y1 = sw * xp + cw * yp;
  const x2 = x1;
  const y2 = ci * y1;
  const z2 = si * y1;
  const ex = cn * x2 - sn * y2;
  const ey = sn * x2 + cn * y2;
  const ez = z2;

  const r = RotateVector(Rotation_ECL_EQJ(), new Vector(ex, ey, ez, time));
  return { x: r.x, y: r.y, z: r.z };
}

/** 指定時刻的日心 EQJ 位置（AU） */
export function cometHelioVec(spec: CometSpec, time: AstroTime): EqjVec {
  const daysSincePeri = time.ut + JD_J2000 - spec.tpJd;
  const M = (2 * Math.PI * daysSincePeri) / orbitalPeriodDays(spec);
  return positionFromE(spec, solveKepler(M, spec.e), time);
}

/** 地心 EQJ 位置（AU）。地球超出引擎範圍時回傳 null。 */
export function cometGeoVec(spec: CometSpec, time: AstroTime): EqjVec | null {
  const c = cometHelioVec(spec, time);
  const e = helioVec(Body.Earth, time);
  if (!e) return null;
  return { x: c.x - e.x, y: c.y - e.y, z: c.z - e.z };
}

/** 地心「當日黃道」黃經（度）。定宿定宮、側欄顯示用。 */
export function cometGeoEclipticLon(spec: CometSpec, time: AstroTime): number | null {
  const g = cometGeoVec(spec, time);
  if (!g) return null;
  return Ecliptic(new Vector(g.x, g.y, g.z, time)).elon;
}

/** 日心距（AU），側欄顯示用 */
export function cometHelioDistance(spec: CometSpec, time: AstroTime): number {
  const v = cometHelioVec(spec, time);
  return Math.hypot(v.x, v.y, v.z);
}

/**
 * 整條軌道取樣（EQJ，AU）：偏近點角均勻取樣，使近日點附近點距合理
 * （時間均勻取樣會把幾乎所有點堆在遠日點）。軌道在慣性系中固定，只需算一次。
 */
export function sampleCometOrbit(spec: CometSpec, samples: number, time: AstroTime): EqjVec[] {
  const pts: EqjVec[] = [];
  for (let i = 0; i <= samples; i++) {
    pts.push(positionFromE(spec, (i / samples) * 2 * Math.PI, time));
  }
  return pts;
}
