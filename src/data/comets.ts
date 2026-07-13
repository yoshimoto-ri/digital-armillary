/**
 * 彗星軌道根數（J2000 黃道框架密切根數，取自 JPL Small-Body Database）。
 * 全部以二體克卜勒傳播（astro/comets.ts），未含行星攝動——離曆元越遠誤差越大，
 * UI 常駐註明（ARCHITECTURE.md §7.4）。
 */

export interface CometSpec {
  key: string;
  nameZh: string;
  /** 正式編號／命名 */
  designation: string;
  color: number;
  /** 近日點距 q（AU） */
  q: number;
  /** 離心率 e（< 1） */
  e: number;
  /** 軌道傾角 i（度，J2000 黃道） */
  iDeg: number;
  /** 升交點黃經 Ω（度） */
  nodeDeg: number;
  /** 近日點幅角 ω（度） */
  periDeg: number;
  /** 近日點時刻（儒略日，曆元近日點通過） */
  tpJd: number;
  /** 概略週期（年）——僅顯示用；傳播用的週期由半長軸推得 */
  periodYears: number;
  /** 側欄備註（歷史脈絡） */
  note: string;
}

export const COMETS: CometSpec[] = [
  {
    key: 'halley',
    nameZh: '哈雷彗星',
    designation: '1P/Halley',
    color: 0xaef0e8,
    q: 0.5871,
    e: 0.96714,
    iDeg: 162.2627,
    nodeDeg: 58.42,
    periDeg: 111.3325,
    tpJd: 2446467.395, // 1986-02-05.9（1986 回歸）
    periodYears: 75.3,
    note: '中國史書自《史記》秦始皇七年（西元前 240 年）起連續記錄其歷次回歸，是紀錄最完整的週期彗星。',
  },
  {
    key: 'encke',
    nameZh: '恩克彗星',
    designation: '2P/Encke',
    color: 0xd0e8a0,
    q: 0.3359,
    e: 0.8483,
    iDeg: 11.7783,
    nodeDeg: 334.5679,
    periDeg: 186.542,
    tpJd: 2456618.204, // 2013-11-21.7
    periodYears: 3.3,
    note: '已知週期最短的著名彗星（約 3.3 年），金牛座流星雨母體。',
  },
  {
    key: 'swift-tuttle',
    nameZh: '斯威夫特–塔特爾彗星',
    designation: '109P/Swift-Tuttle',
    color: 0xe8c8f0,
    q: 0.9595,
    e: 0.9632,
    iDeg: 113.4538,
    nodeDeg: 139.3811,
    periDeg: 152.9821,
    tpJd: 2448968.824, // 1992-12-12.3
    periodYears: 133.3,
    note: '英仙座流星雨（每年 8 月）母體；《後漢書》永平八年（西元 69 年）彗星紀錄被認為是其回歸。',
  },
  {
    key: 'hale-bopp',
    nameZh: '海爾–博普彗星',
    designation: 'C/1995 O1 (Hale-Bopp)',
    color: 0xf0ecd0,
    q: 0.9141,
    e: 0.99511,
    iDeg: 89.43,
    nodeDeg: 282.4707,
    periDeg: 130.5887,
    tpJd: 2450539.64, // 1997-04-01.1
    periodYears: 2530,
    note: '1997 年大彗星，肉眼可見長達 18 個月；軌道近乎垂直黃道面。',
  },
];
