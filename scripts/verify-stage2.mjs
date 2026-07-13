/**
 * 階段二驗收腳本：彗星二體克卜勒傳播與當日框架轉換檢核
 *
 * 1) 哈雷彗星：近日點時刻 r = q、半週期後 r = 遠日點 Q = a(1+e)、
 *    近日點附近 r 的極小值落在曆元 Tp（自洽）；比角動量守恆（克卜勒解品質）。
 * 2) 恩克彗星：由半長軸推得的週期 ≈ 3.30 年（外部公開值）。
 * 3) 黃道 J2000 → EQJ：春分點方向不變（引擎旋轉矩陣用法檢核）。
 * 4) 當日黃道 λ=0 於 J2000.0 時刻 ≈ EQJ +x（Rotation_ECT_EQJ 用法檢核）。
 *
 * 註：軌道根數為密切根數的二體外推，未含攝動。哈雷 2061 回歸以此推算
 * 與實際預測（2061-07-28 前後）相差數週，屬預期內誤差，僅列印供參考。
 *
 * 執行：npm run verify:stage2
 */
import { MakeTime, RotateVector, Rotation_ECL_EQJ, Rotation_ECT_EQJ, Vector } from 'astronomy-engine';

// —— 與 src/data/comets.ts 相同的元素（獨立複寫，交叉檢核常數抄寫）——
const HALLEY = { q: 0.5871, e: 0.96714, i: 162.2627, node: 58.42, peri: 111.3325, tpJd: 2446467.395 };
const ENCKE = { q: 0.3359, e: 0.8483 };

const JD_J2000 = 2451545.0;
const GAUSSIAN_YEAR = 365.2568983;
const DEG = Math.PI / 180;

const a = (c) => c.q / (1 - c.e);
const periodDays = (c) => GAUSSIAN_YEAR * Math.pow(a(c), 1.5);

function solveKepler(M, e) {
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

/** 位置與速度（黃道 J2000，AU、AU/日）——速度供角動量檢核 */
function stateAtJd(c, jd) {
  const P = periodDays(c);
  const M = (2 * Math.PI * (jd - c.tpJd)) / P;
  const E = solveKepler(M, c.e);
  const A = a(c);
  const xp = A * (Math.cos(E) - c.e);
  const yp = A * Math.sqrt(1 - c.e * c.e) * Math.sin(E);
  const n = (2 * Math.PI) / P;
  const Edot = n / (1 - c.e * Math.cos(E));
  const vxp = -A * Math.sin(E) * Edot;
  const vyp = A * Math.sqrt(1 - c.e * c.e) * Math.cos(E) * Edot;
  const rot = ([x, y]) => {
    const cw = Math.cos(c.peri * DEG), sw = Math.sin(c.peri * DEG);
    const ci = Math.cos(c.i * DEG), si = Math.sin(c.i * DEG);
    const cn = Math.cos(c.node * DEG), sn = Math.sin(c.node * DEG);
    const x1 = cw * x - sw * y, y1 = sw * x + cw * y;
    return [cn * x1 - sn * ci * y1, sn * x1 + cn * ci * y1, si * y1];
  };
  return { r: rot([xp, yp]), v: rot([vxp, vyp]) };
}

const cross = (u, w) => [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]];
const norm = (u) => Math.hypot(...u);

let ok = true;
const check = (name, val, ref, tol) => {
  const pass = Math.abs(val - ref) <= tol;
  ok &&= pass;
  console.log(`${pass ? '✓' : '✗'} ${name}: ${val} （期望 ${ref} ± ${tol}）`);
};

console.log('=== 階段二驗收：彗星克卜勒傳播與框架轉換 ===\n');

// 1) 哈雷：近日點距 / 遠日點距 / 極小值位置 / 角動量守恆
const P = periodDays(HALLEY);
check('哈雷 r(Tp)（AU）', norm(stateAtJd(HALLEY, HALLEY.tpJd).r), HALLEY.q, 1e-9);
check('哈雷 r(Tp+P/2) 遠日點（AU）', norm(stateAtJd(HALLEY, HALLEY.tpJd + P / 2).r), a(HALLEY) * (1 + HALLEY.e), 1e-6);
console.log(`  （公開值：哈雷遠日點 ≈ 35.1 AU、週期 ≈ ${(P / 365.25).toFixed(1)} 年 ≈ 75.3 年）`);

let minR = Infinity, minJd = 0;
for (let d = -30; d <= 30; d += 0.01) {
  const r = norm(stateAtJd(HALLEY, HALLEY.tpJd + d).r);
  if (r < minR) { minR = r; minJd = HALLEY.tpJd + d; }
}
check('哈雷 r 極小值時刻（相對 Tp 日）', minJd - HALLEY.tpJd, 0, 0.02);

const s0 = stateAtJd(HALLEY, HALLEY.tpJd + 1234.5);
const s1 = stateAtJd(HALLEY, HALLEY.tpJd + 9876.5);
const h0 = norm(cross(s0.r, s0.v)), h1 = norm(cross(s1.r, s1.v));
check('哈雷比角動量守恆（相對差）', Math.abs(h0 - h1) / h0, 0, 1e-9);

// 2) 恩克週期
check('恩克週期（年）', periodDays(ENCKE) / 365.25, 3.30, 0.02);

// 3) 黃道 J2000 → EQJ：春分點方向不變
const t0 = MakeTime(new Date(Date.UTC(2000, 0, 1, 12)));
const eq = RotateVector(Rotation_ECL_EQJ(), new Vector(1, 0, 0, t0));
check('ECL→EQJ 春分點 x', eq.x, 1, 1e-9);
check('ECL→EQJ 春分點 y', Math.abs(eq.y) + Math.abs(eq.z), 0, 1e-9);

// 4) 當日黃道 λ=0（J2000.0）≈ EQJ +x（歲差/章動修正在 1e-4 量級內）
const ect = RotateVector(Rotation_ECT_EQJ(t0), new Vector(1, 0, 0, t0));
check('ECT→EQJ（J2000.0）春分點 x', ect.x, 1, 1e-4);

// 參考列印：二體外推的 2061 回歸（未含攝動，預期早約 2 個月）
const nextTp = HALLEY.tpJd + P;
const d = new Date((nextTp - 2440587.5) * 86400000);
console.log(`\n（參考）二體外推哈雷下次近日點：${d.toISOString().slice(0, 10)}（含攝動之預測為 2061-07-28 前後；相差數週來自未含攝動，屬預期）`);

console.log(ok ? '\n✅ 驗收通過' : '\n❌ 驗收失敗');
if (!ok) process.exit(1);
