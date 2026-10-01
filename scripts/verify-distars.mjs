/**
 * 距星系統驗收腳本：以《漢書·律曆志》二十八宿距度為裁判，驗證三距星系統
 * （清《儀象考成》／漢《石氏》／明《崇禎曆書》，src/data/distarSystems.json）。
 *
 * 方法：把各系統 28 距星的 J2000 座標以 astronomy-engine 旋轉至
 * 西元前 100 年（太初曆時代）的當日赤道，依赤經排序取相鄰間隔換算古度
 * （1 古度 = 360/365.25°），與《漢書·律曆志》實測距度逐宿比對。
 *
 * 預期（即本專案的考證結論）：
 *   1) 清系統吻合漢代實測（平均誤差 < 1 古度）——清代「改距星」實為回歸漢代測量；
 *   2) 漢系統（觜改 λ Ori）同樣吻合（λ 與 φ¹ 漢代僅差 0.35 古度，考證存疑）；
 *   3) 明系統的參宿（ζ Ori）與漢代實測明顯不合（誤差 > 3 古度）——
 *      明末距星為後世變動，非漢代原貌；
 *   4) 於 1750 年曆元，清系統出現觜參赤經易位（參前觜後），與乾隆十七年史實一致。
 *
 * 執行：npm run verify:distars
 */
import { readFileSync } from 'node:fs';
import { AstroTime, RotateVector, Rotation_EQJ_EQD, SphereFromVector, Spherical, VectorFromSphere } from 'astronomy-engine';

const mansionsFile = JSON.parse(readFileSync(new URL('../src/data/mansions.json', import.meta.url), 'utf8'));
const distarFile = JSON.parse(readFileSync(new URL('../src/data/distarSystems.json', import.meta.url), 'utf8'));

/** 《漢書·律曆志》二十八宿距度（太初／石氏，合計 365¼ 古度） */
const HAN_DU = {
  角: 12, 亢: 9, 氐: 15, 房: 5, 心: 5, 尾: 18, 箕: 11,
  斗: 26.25, 牛: 8, 女: 12, 虛: 10, 危: 17, 室: 16, 壁: 9,
  奎: 16, 婁: 12, 胃: 14, 昴: 11, 畢: 16, 觜: 2, 參: 9,
  井: 33, 鬼: 4, 柳: 15, 星: 7, 張: 18, 翼: 18, 軫: 17,
};
const DU = 360 / 365.25;

function timeAtYear(year) {
  return AstroTime.FromTerrestrialTime((year - 2000) * 365.2425);
}

function raOfDate(raJ2000, decJ2000, time) {
  const v = VectorFromSphere(new Spherical(decJ2000, raJ2000, 1), time);
  return SphereFromVector(RotateVector(Rotation_EQJ_EQD(time), v)).lon;
}

function applySystem(base, sys) {
  const byName = new Map(sys.overrides.map((o) => [o.mansionName, o]));
  return base.map((m) => {
    const o = byName.get(m.name);
    return o ? { ...m, raJ2000: o.raJ2000, decJ2000: o.decJ2000 } : m;
  });
}

/** 回傳 { meanErr, order, errByName } */
function fit(mansions, time) {
  const pts = mansions
    .map((m) => ({ name: m.name, ra: raOfDate(m.raJ2000, m.decJ2000, time) }))
    .sort((a, b) => a.ra - b.ra);
  let total = 0;
  const errByName = {};
  for (let i = 0; i < pts.length; i++) {
    const next = pts[(i + 1) % pts.length];
    let gap = next.ra - pts[i].ra;
    if (gap < 0) gap += 360;
    const err = gap / DU - HAN_DU[pts[i].name];
    errByName[pts[i].name] = err;
    total += Math.abs(err);
  }
  return { meanErr: total / pts.length, order: pts.map((p) => p.name).join(''), errByName };
}

const tHan = timeAtYear(-100);
const base = mansionsFile.mansions;
const sys = (id) => distarFile.systems.find((s) => s.id === id);

let failed = 0;
const check = (ok, msg) => {
  console.log(`${ok ? '✓' : '✗'} ${msg}`);
  if (!ok) failed++;
};

console.log('=== 距星系統 vs《漢書·律曆志》距度（曆元 西元前 100 年） ===');
const qing = fit(applySystem(base, sys('qing')), tHan);
const han = fit(applySystem(base, sys('han')), tHan);
const ming = fit(applySystem(base, sys('ming')), tHan);
console.log(`清《儀象考成》 平均誤差 ${qing.meanErr.toFixed(2)} 古度`);
console.log(`漢《石氏》     平均誤差 ${han.meanErr.toFixed(2)} 古度`);
console.log(`明《崇禎曆書》 平均誤差 ${ming.meanErr.toFixed(2)} 古度（參宿誤差 ${ming.errByName['參'].toFixed(1)}）`);

check(qing.meanErr < 1.0, `清系統吻合漢代實測（${qing.meanErr.toFixed(2)} < 1.0 古度）`);
check(han.meanErr < 1.0, `漢系統吻合漢代實測（${han.meanErr.toFixed(2)} < 1.0 古度）`);
check(
  Math.abs(han.errByName['觜'] - qing.errByName['觜']) < 0.5,
  '觜宿 λ/φ¹ 於漢代曆元無法分辨（差 < 0.5 古度）→ 標「考證存疑」成立',
);
check(
  Math.abs(ming.errByName['參']) > 3.0,
  `明系統參宿（ζ Ori）與漢代實測不合（|${ming.errByName['參'].toFixed(1)}| > 3 古度）→ 明末距星非漢代原貌`,
);
check(
  qing.order.includes('觜參') && han.order.includes('觜參'),
  '漢代曆元：觜前參後（清／漢距星皆然，順序正確）',
);
const qing1750 = fit(applySystem(base, sys('qing')), timeAtYear(1750));
check(
  qing1750.order.includes('參觜'),
  '1750 年曆元：清距星出現參前觜後（觜參易位，與乾隆十七年並定史實一致）',
);

// 資料完整性：overrides 欄位齊備、宿名存在於基準表
for (const s of distarFile.systems) {
  for (const o of s.overrides) {
    const m = base.find((x) => x.name === o.mansionName);
    check(m != null, `${s.id} 覆寫之宿「${o.mansionName}」存在於基準表`);
    check(
      Number.isFinite(o.hip) && Number.isFinite(o.raJ2000) && Number.isFinite(o.decJ2000),
      `${s.id}/${o.mansionName} 距星資料欄位完整（HIP ${o.hip}）`,
    );
  }
}

console.log(failed === 0 ? '\n全部通過 ✓' : `\n${failed} 項未通過 ✗`);
process.exit(failed === 0 ? 0 : 1);
