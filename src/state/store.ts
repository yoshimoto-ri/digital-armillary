/** 集中狀態 + 型別化 pub/sub（ARCHITECTURE.md §5）。無外部依賴。 */

export type ViewMode = 'helio' | 'geo';

export interface SelectedBody {
  type: 'planet' | 'mansion';
  /** planet: PlanetSpec.key；mansion: 宿名 */
  key: string;
}

export interface LayerState {
  orbits: boolean;
  mansionLines: boolean;
  mansionLabels: boolean;
  /** 現代三王星——兩個視角各自記住開關 */
  modernPlanetsHelio: boolean;
  modernPlanetsGeo: boolean;
}

export interface AppState {
  time: Date;
  viewMode: ViewMode;
  layers: LayerState;
  selection: SelectedBody | null;
}

export type StateKey = keyof AppState;
type Listener = (state: AppState, changed: Set<StateKey>) => void;

const state: AppState = {
  time: new Date(),
  viewMode: 'helio',
  layers: {
    orbits: true,
    mansionLines: true,
    mansionLabels: true,
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
