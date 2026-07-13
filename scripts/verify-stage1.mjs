/**
 * 階段一驗收腳本：2026-07-13 木星黃經與星曆對照（誤差 < 1°）
 *
 * 參考值來源：JPL Horizons / Stellarium，2026-07-13 00:00 UT
 * 木星地心視黃經（當日黃道）≈ 122.8°（獅子宮 2°48′ 附近）。
 * 使用者可至 https://ssd.jpl.nasa.gov/horizons/ 以
 * Target=Jupiter, Center=Geocentric, ObsEclLon 自行複核。
 *
 * 執行：npm run verify:stage1
 */
import { Body, Ecliptic, GeoVector, HelioVector, MakeTime } from 'astronomy-engine';

const T = MakeTime(new Date(Date.UTC(2026, 6, 13, 0, 0, 0)));
const REF_LON = 122.8; // 外部星曆參考值（度）
const TOLERANCE = 1.0;

// 1) 直接取地心黃經（側欄顯示所用路徑）
const direct = Ecliptic(GeoVector(Body.Jupiter, T, true)).elon;

// 2) 場景管線自洽檢查：日心向量相減（地球→木星方向）再轉黃道
//    （光行時未修正，與 1) 允許有小差異）
const e = HelioVector(Body.Earth, T);
const j = HelioVector(Body.Jupiter, T);
const rel = { x: j.x - e.x, y: j.y - e.y, z: j.z - e.z, t: T };
const viaHelio = Ecliptic(rel).elon;

const fmt = (d) => `${Math.floor(d)}°${String(Math.round((d - Math.floor(d)) * 60)).padStart(2, '0')}′`;

console.log('=== 階段一驗收：2026-07-13 00:00 UT 木星地心黃經 ===');
console.log(`astronomy-engine 地心黃經     : ${direct.toFixed(4)}°（${fmt(direct)}）`);
console.log(`日心向量相減（場景管線自洽） : ${viaHelio.toFixed(4)}°（${fmt(viaHelio)}）`);
console.log(`外部星曆參考值               : ${REF_LON}°`);

const errRef = Math.abs(direct - REF_LON);
const errSelf = Math.abs(direct - viaHelio);
console.log(`與參考值誤差   : ${errRef.toFixed(4)}°（門檻 ${TOLERANCE}°）`);
console.log(`管線自洽誤差   : ${errSelf.toFixed(4)}°（光行時效應，應 < 0.02°）`);

const zodiac = ['白羊宮','金牛宮','雙子宮','巨蟹宮','獅子宮','處女宮','天秤宮','天蠍宮','射手宮','摩羯宮','水瓶宮','雙魚宮'];
const zi = Math.floor(direct / 30);
console.log(`所在宮：${zodiac[zi]} ${fmt(direct - zi * 30)}`);

if (errRef < TOLERANCE && errSelf < 0.02) {
  console.log('\n✅ 驗收通過');
} else {
  console.error('\n❌ 驗收失敗');
  process.exit(1);
}
