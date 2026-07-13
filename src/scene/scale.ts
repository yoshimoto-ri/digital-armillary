import * as THREE from 'three';
import type { EqjVec } from '../astro/ephemeris';

/**
 * 距離比例尺與座標映射（ARCHITECTURE.md §4.2、§7.5）。
 * eqjToScene 是全案唯一的 EQJ → Three.js 軸映射處。
 */

/** 場景單位 per sqrt(AU)。冥王星遠日點 sqrt(49.3)*40 ≈ 281 單位。 */
export const SCALE_K = 40;

/** 天球半徑：遠大於行星軌道（冥王星遠日點壓縮後 ~281 的 4 倍餘） */
export const R_SPHERE = 1200;

/** 渾象（地心）視角：天體投影半徑，略小於恆星天球以免遮擋星點 */
export const R_GEO_BODIES = R_SPHERE * 0.94;

/** 當日框架覆蓋層（黃道線、天赤道線、十二宮）繪製半徑 */
export const R_OVERLAY = R_SPHERE * 0.985;

/** EQJ → Three.js（Y-up）：x→x、z→y、-y→z，右手系不變 */
export function eqjToScene(v: EqjVec, out?: THREE.Vector3): THREE.Vector3 {
  const o = out ?? new THREE.Vector3();
  return o.set(v.x, v.z, -v.y);
}

/** 日心 EQJ 向量（AU）→ √ 壓縮後的場景位置 */
export function compressToScene(v: EqjVec, out?: THREE.Vector3): THREE.Vector3 {
  const o = eqjToScene(v, out);
  const r = o.length();
  if (r === 0) return o.set(0, 0, 0);
  const rScene = SCALE_K * Math.sqrt(r);
  return o.multiplyScalar(rScene / r);
}

/** EQJ 單位方向 → 天球面上的場景位置 */
export function directionToSphere(v: EqjVec, radius = R_SPHERE, out?: THREE.Vector3): THREE.Vector3 {
  const o = eqjToScene(v, out);
  return o.normalize().multiplyScalar(radius);
}
