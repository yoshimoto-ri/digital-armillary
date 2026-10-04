import { store } from '../state/store';
import type { Lang } from '../state/store';
import type { PlanetSpec } from '../data/planets';
import type { CometSpec } from '../data/comets';
import type { Mansion } from '../data/types';
import { zh } from './zh';
import type { DictKey } from './zh';
import { en } from './en';
import { ZODIAC_EN, PLANET_EN, COMET_EN, MANSION_PINYIN, GROUP_EN, DISTAR_SYS_EN } from './names';
import { ZODIAC_NAMES } from '../data/zodiacNames';

const DICTS: Record<Lang, Record<DictKey, string>> = { zh, en };
const STORAGE_KEY = 'armillary.lang';
const listeners = new Set<() => void>();

export const getLang = (): Lang => store.get().lang;

/** 取字串並代入 {param}。 */
export function t(key: DictKey, params?: Record<string, string | number>): string {
  let s = DICTS[getLang()][key];
  if (params) for (const [k, v] of Object.entries(params)) s = s.split(`{${k}}`).join(String(v));
  return s;
}

/** 立即執行並於語言切換時重跑（UI 元件綁定用） */
export function onLang(fn: () => void): void {
  fn();
  listeners.add(fn);
}

function applyDocument(lang: Lang): void {
  document.documentElement.lang = lang === 'zh' ? 'zh-Hant' : 'en';
  document.title = DICTS[lang].pageTitle;
  // 純 CSS 生成的文字（::after）以 CSS 變數帶入
  document.documentElement.style.setProperty('--undiscovered', JSON.stringify(DICTS[lang].undiscovered));
}

/** 啟動時呼叫一次：已存選擇 > 瀏覽器語言（zh* → 中文，其餘英文） */
export function initLang(): void {
  let lang: Lang | null = null;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'zh' || saved === 'en') lang = saved;
  } catch {
    /* 隱私模式等情況無法讀取，忽略 */
  }
  if (!lang) lang = (navigator.language || 'zh').toLowerCase().startsWith('zh') ? 'zh' : 'en';
  store.set({ lang });
  applyDocument(lang);
}

export function setLang(lang: Lang): void {
  if (lang === getLang()) return;
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    /* ignore */
  }
  store.set({ lang });
  applyDocument(lang);
  for (const fn of listeners) fn();
}

// --- 資料名稱在地化 ---
const isZh = () => getLang() === 'zh';

export const planetName = (p: PlanetSpec): string => (isZh() ? p.nameZh : PLANET_EN[p.key]);
export const cometName = (c: CometSpec): string => (isZh() ? c.nameZh : COMET_EN[c.key].name);
export const cometNote = (c: CometSpec): string => (isZh() ? c.note : COMET_EN[c.key].note);
export const zodiacName = (index: number): string => (isZh() ? ZODIAC_NAMES[index] : ZODIAC_EN[index]);
/** 宿名：中文「角宿」；英文「Jiǎo 角」 */
export const mansionName = (name: string): string =>
  isZh() ? t('mansionLabel', { name }) : `${MANSION_PINYIN[name]} ${name}`;
export const groupName = (group: string): string => (isZh() ? group : GROUP_EN[group] ?? group);
/** 距星顯示名：中文用中文星名＋西名；英文只用西名 */
export const distarStarName = (m: { detStarName: string; westernName: string }): string =>
  isZh() ? `${m.detStarName}（${m.westernName}）` : m.westernName;
export const distarSysLabel = (sys: { id: string; label: string }): string =>
  isZh() ? sys.label : DISTAR_SYS_EN[sys.id].label;
export const distarSysShort = (sys: { id: string; label: string }): string =>
  isZh() ? sys.label.charAt(0) : DISTAR_SYS_EN[sys.id].short;
export const mansionDisplay = (m: Mansion): string => mansionName(m.name);

/** 天文年 → 顯示字串（年 0 = 西元前 1 年） */
export function fmtYear(year: number): string {
  return year > 0 ? t('yearCE', { n: year }) : t('yearBCE', { n: 1 - year });
}

/** 行星標籤文字（含現代行星發現年） */
export function planetLabelText(spec: PlanetSpec): string {
  return spec.discoveryYear != null
    ? t('discovered', { name: planetName(spec), year: spec.discoveryYear })
    : planetName(spec);
}

/** 把元素文字／屬性綁定到字串鍵，語言切換時自動更新 */
export function bindText(el: HTMLElement, key: DictKey): void {
  onLang(() => {
    el.textContent = t(key);
  });
}
export function bindAttr(el: HTMLElement, attr: string, key: DictKey): void {
  onLang(() => el.setAttribute(attr, t(key)));
}
