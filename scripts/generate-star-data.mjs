/**
 * 產生 src/data/mansions.json 與 src/data/mansionStars.json
 *
 * 資料來源：
 *  - 座標/星等/HIP：HYG Database v4.1（https://github.com/astronexus/HYG-Database，
 *    Hipparcos 為主之合成星表，J2000）
 *  - 中文星名：Stellarium chinese skyculture star_names.zh_CN.fab（伊世同系統），簡轉繁
 *  - 距星認定：清《儀象考成》距星系統（參考維基百科「二十八宿」距星表、
 *    潘鼐《中國恒星觀測史》）。注意：奎宿距星=奎宿二(ζ And)、觜宿距星=觜宿二(φ¹ Ori)、
 *    參宿距星=參宿三(δ Ori)，非各宿第一星。
 *
 * 用法：node scripts/generate-star-data.mjs <hygdata_v41.csv> <star_names.zh_CN.fab>
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const [, , hygPath, fabPath] = process.argv;
if (!hygPath || !fabPath) {
  console.error('用法: node scripts/generate-star-data.mjs <hygdata_v41.csv> <star_names.zh_CN.fab>');
  console.error('HYG v4.1: https://raw.githubusercontent.com/astronexus/HYG-Database/main/hyg/CURRENT/hygdata_v41.csv');
  console.error('星名表: https://raw.githubusercontent.com/Stellarium/stellarium/master/skycultures/chinese/star_names.zh_CN.fab');
  process.exit(1);
}

// ---------- 二十八宿規格 ----------
// stars: greek=拜耳字母縮寫(HYG格式)、flam=佛氏編號、con=星座縮寫、n=後備中文名
// det: 距星在 stars 陣列中的索引
// lines: 連線（索引對），畫星官形狀
const MANSIONS = [
  { id: 1, name: '角', group: '東方蒼龍', det: 0, lines: [[0, 1]], stars: [
    { n: '角宿一', greek: 'Alp', con: 'Vir' },
    { n: '角宿二', greek: 'Zet', con: 'Vir' },
  ]},
  { id: 2, name: '亢', group: '東方蒼龍', det: 0, lines: [[0, 1], [1, 2], [2, 3]], stars: [
    { n: '亢宿一', greek: 'Kap', con: 'Vir' },
    { n: '亢宿二', greek: 'Iot', con: 'Vir' },
    { n: '亢宿三', greek: 'Phi', con: 'Vir' },
    { n: '亢宿四', greek: 'Lam', con: 'Vir' },
  ]},
  { id: 3, name: '氐', group: '東方蒼龍', det: 0, lines: [[0, 1], [1, 2], [2, 3], [3, 0]], stars: [
    { n: '氐宿一', greek: 'Alp', con: 'Lib' },
    { n: '氐宿二', greek: 'Iot', con: 'Lib' },
    { n: '氐宿三', greek: 'Gam', con: 'Lib' },
    { n: '氐宿四', greek: 'Bet', con: 'Lib' },
  ]},
  { id: 4, name: '房', group: '東方蒼龍', det: 0, lines: [[0, 1], [1, 2], [2, 3]], stars: [
    { n: '房宿一', greek: 'Pi', con: 'Sco' },
    { n: '房宿二', greek: 'Rho', con: 'Sco' },
    { n: '房宿三', greek: 'Del', con: 'Sco' },
    { n: '房宿四', greek: 'Bet', con: 'Sco' },
  ]},
  { id: 5, name: '心', group: '東方蒼龍', det: 0, lines: [[0, 1], [1, 2]], stars: [
    { n: '心宿一', greek: 'Sig', con: 'Sco' },
    { n: '心宿二', greek: 'Alp', con: 'Sco' },
    { n: '心宿三', greek: 'Tau', con: 'Sco' },
  ]},
  { id: 6, name: '尾', group: '東方蒼龍', det: 0, lines: [[1, 0], [0, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 8], [8, 7]], stars: [
    { n: '尾宿一', greek: 'Mu', con: 'Sco' },
    { n: '尾宿二', greek: 'Eps', con: 'Sco' },
    { n: '尾宿三', greek: 'Zet', con: 'Sco' },
    { n: '尾宿四', greek: 'Eta', con: 'Sco' },
    { n: '尾宿五', greek: 'The', con: 'Sco' },
    { n: '尾宿六', greek: 'Iot', con: 'Sco' },
    { n: '尾宿七', greek: 'Kap', con: 'Sco' },
    { n: '尾宿八', greek: 'Lam', con: 'Sco' },
    { n: '尾宿九', greek: 'Ups', con: 'Sco' },
  ]},
  { id: 7, name: '箕', group: '東方蒼龍', det: 0, lines: [[0, 1], [1, 2], [2, 3], [3, 0]], stars: [
    { n: '箕宿一', greek: 'Gam', con: 'Sgr' },
    { n: '箕宿二', greek: 'Del', con: 'Sgr' },
    { n: '箕宿三', greek: 'Eps', con: 'Sgr' },
    { n: '箕宿四', greek: 'Eta', con: 'Sgr' },
  ]},
  { id: 8, name: '斗', group: '北方玄武', det: 0, lines: [[2, 1], [1, 0], [0, 3], [3, 4], [4, 5], [5, 0]], stars: [
    { n: '斗宿一', greek: 'Phi', con: 'Sgr' },
    { n: '斗宿二', greek: 'Lam', con: 'Sgr' },
    { n: '斗宿三', greek: 'Mu', con: 'Sgr' },
    { n: '斗宿四', greek: 'Sig', con: 'Sgr' },
    { n: '斗宿五', greek: 'Tau', con: 'Sgr' },
    { n: '斗宿六', greek: 'Zet', con: 'Sgr' },
  ]},
  { id: 9, name: '牛', group: '北方玄武', det: 0, lines: [[0, 1], [1, 2], [0, 3], [3, 4], [4, 5]], stars: [
    { n: '牛宿一', greek: 'Bet', con: 'Cap' },
    { n: '牛宿二', greek: 'Alp', con: 'Cap' },
    { n: '牛宿三', greek: 'Xi', con: 'Cap' },
    { n: '牛宿四', greek: 'Pi', con: 'Cap' },
    { n: '牛宿五', greek: 'Omi', con: 'Cap' },
    { n: '牛宿六', greek: 'Rho', con: 'Cap' },
  ]},
  { id: 10, name: '女', group: '北方玄武', det: 0, lines: [[0, 1], [1, 2], [2, 3], [3, 0]], stars: [
    { n: '女宿一', greek: 'Eps', con: 'Aqr' },
    { n: '女宿二', greek: 'Mu', con: 'Aqr' },
    { n: '女宿三', flam: 4, con: 'Aqr' },
    { n: '女宿四', flam: 3, con: 'Aqr' },
  ]},
  { id: 11, name: '虛', group: '北方玄武', det: 0, lines: [[0, 1]], stars: [
    { n: '虛宿一', greek: 'Bet', con: 'Aqr' },
    { n: '虛宿二', greek: 'Alp', con: 'Equ' },
  ]},
  { id: 12, name: '危', group: '北方玄武', det: 0, lines: [[0, 1], [1, 2]], stars: [
    { n: '危宿一', greek: 'Alp', con: 'Aqr' },
    { n: '危宿二', greek: 'The', con: 'Peg' },
    { n: '危宿三', greek: 'Eps', con: 'Peg' },
  ]},
  { id: 13, name: '室', group: '北方玄武', det: 0, lines: [[0, 1]], stars: [
    { n: '室宿一', greek: 'Alp', con: 'Peg' },
    { n: '室宿二', greek: 'Bet', con: 'Peg' },
  ]},
  { id: 14, name: '壁', group: '北方玄武', det: 0, lines: [[0, 1]], stars: [
    { n: '壁宿一', greek: 'Gam', con: 'Peg' },
    { n: '壁宿二', greek: 'Alp', con: 'And' },
  ]},
  // 注意：奎宿距星為奎宿二（ζ And），det: 1
  { id: 15, name: '奎', group: '西方白虎', det: 1, lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7]], stars: [
    { n: '奎宿一', greek: 'Eta', con: 'And' },
    { n: '奎宿二', greek: 'Zet', con: 'And' },
    { n: '奎宿三', flam: 65, con: 'Psc' },
    { n: '奎宿四', greek: 'Eps', con: 'And' },
    { n: '奎宿五', greek: 'Del', con: 'And' },
    { n: '奎宿六', greek: 'Pi', con: 'And' },
    { n: '奎宿七', greek: 'Nu', con: 'And' },
    { n: '奎宿九', greek: 'Bet', con: 'And' },
  ]},
  { id: 16, name: '婁', group: '西方白虎', det: 0, lines: [[0, 1], [1, 2]], stars: [
    { n: '婁宿一', greek: 'Bet', con: 'Ari' },
    { n: '婁宿二', greek: 'Gam', con: 'Ari' },
    { n: '婁宿三', greek: 'Alp', con: 'Ari' },
  ]},
  { id: 17, name: '胃', group: '西方白虎', det: 0, lines: [[0, 1], [1, 2], [2, 0]], stars: [
    { n: '胃宿一', flam: 35, con: 'Ari' },
    { n: '胃宿二', flam: 39, con: 'Ari' },
    { n: '胃宿三', flam: 41, con: 'Ari' },
  ]},
  { id: 18, name: '昴', group: '西方白虎', det: 0, lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6]], stars: [
    { n: '昴宿一', flam: 17, con: 'Tau' },
    { n: '昴宿二', flam: 19, con: 'Tau' },
    { n: '昴宿三', flam: 21, con: 'Tau' },
    { n: '昴宿四', flam: 20, con: 'Tau' },
    { n: '昴宿五', flam: 23, con: 'Tau' },
    { n: '昴宿六', greek: 'Eta', con: 'Tau' },
    { n: '昴宿七', flam: 27, con: 'Tau' },
  ]},
  { id: 19, name: '畢', group: '西方白虎', det: 0, lines: [[0, 1], [1, 2], [2, 3], [2, 4], [4, 5], [5, 6]], stars: [
    { n: '畢宿一', greek: 'Eps', con: 'Tau' },
    { n: '畢宿二', greek: 'Del', comp: 3, con: 'Tau' },
    { n: '畢宿三', greek: 'Del', comp: 1, con: 'Tau' },
    { n: '畢宿四', greek: 'Gam', con: 'Tau' },
    { n: '畢宿五', greek: 'Alp', con: 'Tau' },
    { n: '畢宿六', greek: 'The', comp: 1, con: 'Tau' },
    { n: '畢宿八', greek: 'Lam', con: 'Tau' },
  ]},
  // 注意：觜宿距星為觜宿二（φ¹ Ori），det: 1
  { id: 20, name: '觜', group: '西方白虎', det: 1, lines: [[0, 1], [1, 2], [2, 0]], stars: [
    { n: '觜宿一', greek: 'Lam', con: 'Ori' },
    { n: '觜宿二', greek: 'Phi', comp: 1, con: 'Ori' },
    { n: '觜宿三', greek: 'Phi', comp: 2, con: 'Ori' },
  ]},
  // 注意：參宿距星為參宿三（δ Ori），det: 2
  { id: 21, name: '參', group: '西方白虎', det: 2, lines: [[0, 1], [1, 2], [3, 1], [0, 5], [2, 4], [3, 4], [5, 0], [2, 6]], stars: [
    { n: '參宿一', greek: 'Zet', con: 'Ori' },
    { n: '參宿二', greek: 'Eps', con: 'Ori' },
    { n: '參宿三', greek: 'Del', con: 'Ori' },
    { n: '參宿四', greek: 'Alp', con: 'Ori' },
    { n: '參宿五', greek: 'Gam', con: 'Ori' },
    { n: '參宿六', greek: 'Kap', con: 'Ori' },
    { n: '參宿七', greek: 'Bet', con: 'Ori' },
  ]},
  { id: 22, name: '井', group: '南方朱雀', det: 0, lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7]], stars: [
    { n: '井宿一', greek: 'Mu', con: 'Gem' },
    { n: '井宿二', greek: 'Nu', con: 'Gem' },
    { n: '井宿三', greek: 'Gam', con: 'Gem' },
    { n: '井宿四', greek: 'Xi', con: 'Gem' },
    { n: '井宿五', greek: 'Eps', con: 'Gem' },
    { n: '井宿六', flam: 36, con: 'Gem' },
    { n: '井宿七', greek: 'Zet', con: 'Gem' },
    { n: '井宿八', greek: 'Lam', con: 'Gem' },
  ]},
  { id: 23, name: '鬼', group: '南方朱雀', det: 0, lines: [[0, 1], [1, 2], [2, 3], [3, 0]], stars: [
    { n: '鬼宿一', greek: 'The', con: 'Cnc' },
    { n: '鬼宿二', greek: 'Eta', con: 'Cnc' },
    { n: '鬼宿三', greek: 'Gam', con: 'Cnc' },
    { n: '鬼宿四', greek: 'Del', con: 'Cnc' },
  ]},
  { id: 24, name: '柳', group: '南方朱雀', det: 0, lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7]], stars: [
    { n: '柳宿一', greek: 'Del', con: 'Hya' },
    { n: '柳宿二', greek: 'Sig', con: 'Hya' },
    { n: '柳宿三', greek: 'Eta', con: 'Hya' },
    { n: '柳宿四', greek: 'Rho', con: 'Hya' },
    { n: '柳宿五', greek: 'Eps', con: 'Hya' },
    { n: '柳宿六', greek: 'Zet', con: 'Hya' },
    { n: '柳宿七', greek: 'Ome', con: 'Hya' },
    { n: '柳宿八', greek: 'The', con: 'Hya' },
  ]},
  { id: 25, name: '星', group: '南方朱雀', det: 0, lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5]], stars: [
    { n: '星宿一', greek: 'Alp', con: 'Hya' },
    { n: '星宿二', greek: 'Tau', comp: 1, con: 'Hya' },
    { n: '星宿三', greek: 'Tau', comp: 2, con: 'Hya' },
    { n: '星宿四', greek: 'Iot', con: 'Hya' },
    { n: '星宿五', flam: 26, con: 'Hya' },
    { n: '星宿六', flam: 27, con: 'Hya' },
  ]},
  { id: 26, name: '張', group: '南方朱雀', det: 0, lines: [[0, 1], [1, 2], [2, 3], [3, 4]], stars: [
    { n: '張宿一', greek: 'Ups', comp: 1, con: 'Hya' },
    { n: '張宿二', greek: 'Lam', con: 'Hya' },
    { n: '張宿三', greek: 'Mu', con: 'Hya' },
    { n: '張宿四', greek: 'Phi', con: 'Hya' },
    { n: '張宿五', greek: 'Kap', con: 'Hya' },
  ]},
  { id: 27, name: '翼', group: '南方朱雀', det: 0, lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6]], stars: [
    { n: '翼宿一', greek: 'Alp', con: 'Crt' },
    { n: '翼宿二', greek: 'Gam', con: 'Crt' },
    { n: '翼宿三', greek: 'Zet', con: 'Crt' },
    { n: '翼宿四', greek: 'Lam', con: 'Crt' },
    { n: '翼宿五', greek: 'Nu', con: 'Hya' },
    { n: '翼宿六', greek: 'Eta', con: 'Crt' },
    { n: '翼宿七', greek: 'Del', con: 'Crt' },
  ]},
  { id: 28, name: '軫', group: '南方朱雀', det: 0, lines: [[0, 1], [1, 2], [2, 3], [3, 0]], stars: [
    { n: '軫宿一', greek: 'Gam', con: 'Crv' },
    { n: '軫宿二', greek: 'Eps', con: 'Crv' },
    { n: '軫宿三', greek: 'Del', con: 'Crv' },
    { n: '軫宿四', greek: 'Bet', con: 'Crv' },
  ]},
];

// ---------- 解析 HYG ----------
const COL = { hip: 1, bf: 5, proper: 6, ra: 7, dec: 8, mag: 13, bayer: 27, flam: 28, con: 29 };
const rows = readFileSync(hygPath, 'utf-8').split('\n');
const stripQ = (s) => (s ?? '').replace(/^"|"$/g, '').trim();

/** con -> 該星座所有列 */
const byCon = new Map();
for (let i = 1; i < rows.length; i++) {
  const c = rows[i].split(',');
  if (c.length < 30) continue;
  const con = stripQ(c[COL.con]);
  if (!con) continue;
  const rec = {
    hip: Number(stripQ(c[COL.hip])) || null,
    bf: stripQ(c[COL.bf]),
    proper: stripQ(c[COL.proper]),
    raDeg: Number(c[COL.ra]) * 15, // HYG 的 ra 單位為小時
    dec: Number(c[COL.dec]),
    mag: Number(c[COL.mag]),
    bayer: stripQ(c[COL.bayer]),
    flam: stripQ(c[COL.flam]),
  };
  if (!byCon.has(con)) byCon.set(con, []);
  byCon.get(con).push(rec);
}

function resolve(spec) {
  const cands = (byCon.get(spec.con) ?? []).filter((r) => {
    if (spec.flam != null) return Number(r.flam) === spec.flam;
    if (spec.comp != null) return r.bayer === `${spec.greek}-${spec.comp}`;
    return r.bayer === spec.greek || r.bayer.startsWith(`${spec.greek}-`);
  });
  if (cands.length === 0) return null;
  cands.sort((a, b) => a.mag - b.mag); // 多重星取最亮
  return cands[0];
}

// ---------- 解析 Stellarium 中文星名（HIP -> 名），簡轉繁 ----------
const S2T = { 娄: '婁', 毕: '畢', 参: '參', 虚: '虛', 张: '張', 轸: '軫', 钩: '鉤', 铃: '鈴', 积: '積' };
const toTrad = (s) => [...s].map((ch) => S2T[ch] ?? ch).join('');
const fabNames = new Map();
for (const line of readFileSync(fabPath, 'utf-8').split('\n')) {
  const m = line.match(/^(\d+)\|_\("([^"]+)"\)/);
  if (m) {
    const hip = Number(m[1]);
    if (!fabNames.has(hip)) fabNames.set(hip, toTrad(m[2])); // 同 HIP 多名取第一個
  }
}

// ---------- 組裝輸出 ----------
const warnings = [];
const mansionsOut = [];
const byMansionOut = {};

for (const m of MANSIONS) {
  const resolved = m.stars.map((spec) => {
    const r = resolve(spec);
    if (!r) {
      warnings.push(`[缺] ${m.name}宿 ${spec.n}（${spec.greek ?? spec.flam} ${spec.con}）在 HYG 中找不到`);
      return null;
    }
    const fabName = r.hip ? fabNames.get(r.hip) : undefined;
    if (fabName && !fabName.startsWith(m.name)) {
      warnings.push(`[名] ${m.name}宿 規格名=${spec.n} 但 Stellarium 名=${fabName}（${r.bf} HIP ${r.hip}）`);
    }
    if (!fabName) {
      warnings.push(`[無名] ${m.name}宿 ${spec.n}（${r.bf} HIP ${r.hip}）Stellarium 無對應，用規格名`);
    }
    return {
      name: fabName ?? spec.n,
      westernName: r.proper ? `${r.proper} (${r.bf})` : r.bf,
      hip: r.hip,
      raJ2000: Number(r.raDeg.toFixed(5)),
      decJ2000: Number(r.dec.toFixed(5)),
      vmag: Number(r.mag.toFixed(2)),
    };
  });

  const kept = [];
  const idxMap = new Map();
  resolved.forEach((s, i) => {
    if (s) { idxMap.set(i, kept.length); kept.push(s); }
  });
  const lines = m.lines
    .filter(([a, b]) => idxMap.has(a) && idxMap.has(b))
    .map(([a, b]) => [idxMap.get(a), idxMap.get(b)]);

  const det = resolved[m.det];
  if (!det) throw new Error(`${m.name}宿距星解析失敗`);
  mansionsOut.push({
    id: m.id, name: m.name, group: m.group,
    detStarName: det.name, westernName: det.westernName, hip: det.hip,
    raJ2000: det.raJ2000, decJ2000: det.decJ2000, vmag: det.vmag,
  });
  byMansionOut[m.name] = { stars: kept, lines };
}

const SOURCE_MANSIONS =
  '距星認定：清《儀象考成》距星系統（奎宿距星=奎宿二 ζ And、觜宿距星=觜宿二 φ¹ Ori、參宿距星=參宿三 δ Ori，餘為各宿一）；' +
  '座標/星等/HIP：HYG Database v4.1（Hipparcos，J2000，CC BY-SA 4.0）；' +
  '中文星名：Stellarium chinese skyculture（伊世同《中西對照恒星圖表》系統）';
const SOURCE_STARS =
  '星官成員取各宿同名星官之亮星；來源同 mansions.json（HYG v4.1 + Stellarium chinese skyculture）；連線為示意star pattern';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '..', 'src', 'data');
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'mansions.json'),
  JSON.stringify({ system: 'qing', source: SOURCE_MANSIONS, mansions: mansionsOut }, null, 2));
writeFileSync(join(outDir, 'mansionStars.json'),
  JSON.stringify({ source: SOURCE_STARS, byMansion: byMansionOut }, null, 2));

// ---------- 人工檢核輸出 ----------
console.log('=== 距星表 ===');
for (const m of mansionsOut) {
  console.log(`${String(m.id).padStart(2)} ${m.name} ${m.detStarName} = ${m.westernName} HIP ${m.hip} RA ${m.raJ2000} Dec ${m.decJ2000} mag ${m.vmag}`);
}
console.log(`\n=== 星官亮星共 ${Object.values(byMansionOut).reduce((n, v) => n + v.stars.length, 0)} 顆 ===`);
if (warnings.length) {
  console.log('\n=== 警告 ===');
  warnings.forEach((w) => console.log(w));
} else {
  console.log('\n無警告');
}
