/** 集中狀態 + 型別化 pub/sub（ARCHITECTURE.md §5）。無外部依賴。 */

import type { DistarSystemId } from '../data/types';

export type ViewMode = 'helio' | 'geo';

/** 介面語言（i18n/index.ts 管理偵測與持久化） */
export type Lang = 'zh' | 'en';

export interface SelectedBody {
  type: 'planet' | 'mansion' | 'comet';
  /** planet: PlanetSpec.key；mansion: 宿名；comet: CometSpec.key */
  key: string;
}

export interface LayerState {
  orbits: boolean;
  mansionLines: boolean;
  mansionLabels: boolean;
  /** 當日黃道線 */
  eclipticLine: boolean;
  /** 當日天赤道線 */
  equatorLine: boolean;
  /** 十二宮分區（宮界刻線 + 宮名 + 春分點） */
  zodiacBands: boolean;
  /** 彗星本體與軌道 */
  comets: boolean;
  /** 歲差對照環：對照時刻的十二宮分區同屏顯示 */
  precessionCompare: boolean;
  /** 宿界對照：清《儀象考成》宿界 + 對照距星系統差異同屏顯示（§7.9） */
  distarCompare: boolean;
  /** 現代三王星——兩個視角各自記住開關 */
  modernPlanetsHelio: boolean;
  modernPlanetsGeo: boolean;
}

export interface AppState {
  lang: Lang;
  time: Date;
  viewMode: ViewMode;
  /** 時間軸播放中 */
  playing: boolean;
  /** 播放速率：模擬日／真實秒 */
  playSpeed: number;
  /** 歲差對照時刻（天文年；-99 = 西元前 100 年） */
  compareYear: number;
  /** 宿界對照的對照距星系統（基準恆為清《儀象考成》） */
  distarCompareSystem: Exclude<DistarSystemId, 'qing'>;
  layers: LayerState;
  selection: SelectedBody | null;
}

export type StateKey = keyof AppState;
type Listener = (state: AppState, changed: Set<StateKey>) => void;

const state: AppState = {
  lang: 'zh',
  time: new Date(),
  viewMode: 'helio',
  playing: false,
  playSpeed: 1,
  compareYear: -99,
  distarCompareSystem: 'ming',
  layers: {
    orbits: true,
    mansionLines: true,
    mansionLabels: true,
    eclipticLine: true,
    equatorLine: true,
    zodiacBands: true,
    comets: true,
    precessionCompare: false,
    distarCompare: false,
    modernPlanetsHelio: true,
    modernPlanetsGeo: false,
  },
  selection: null,
};

const listeners = new Set<Listener>();

export const store = {
  get(): Readonly<AppState> {
    return state;
  },
  set(patch: Partial<AppState>): void {
    const changed = new Set<StateKey>();
    for (const k of Object.keys(patch) as StateKey[]) {
      (state as Record<StateKey, unknown>)[k] = patch[k];
      changed.add(k);
    }
    if (changed.size === 0) return;
    for (const fn of listeners) fn(state, changed);
  },
  setLayer(patch: Partial<LayerState>): void {
    Object.assign(state.layers, patch);
    for (const fn of listeners) fn(state, new Set<StateKey>(['layers']));
  },
  subscribe(fn: Listener): () => void {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};
