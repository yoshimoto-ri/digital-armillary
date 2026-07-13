import { store } from '../state/store';
import { clampDate } from '../astro/time';

/** 底部控制列：視角切換 + 日期選擇 + 圖層開關。改狀態 → scene 訂閱重繪。 */
export function createControlBar(root: HTMLElement): void {
  const bar = document.createElement('div');
  bar.className = 'control-bar';

  // --- 視角切換（日心／渾象） ---
  const modeWrap = document.createElement('div');
  modeWrap.className = 'mode-switch';
  const helioBtn = document.createElement('button');
  helioBtn.textContent = '日心視角';
  const geoBtn = document.createElement('button');
  geoBtn.textContent = '渾象視角';
  const syncModeButtons = () => {
    const mode = store.get().viewMode;
    helioBtn.classList.toggle('active', mode === 'helio');
    geoBtn.classList.toggle('active', mode === 'geo');
  };
  helioBtn.addEventListener('click', () => store.set({ viewMode: 'helio' }));
  geoBtn.addEventListener('click', () => store.set({ viewMode: 'geo' }));
  modeWrap.append(helioBtn, geoBtn);
  syncModeButtons();

  // --- 日期選擇器 ---
  const dateInput = document.createElement('input');
  dateInput.type = 'datetime-local';
  const syncInput = (d: Date) => {
    const pad = (n: number, w = 2) => String(n).padStart(w, '0');
    // datetime-local 用本地時區；西元前年份無法呈現，輸入框留空（時間軸滑桿仍可操作）
    if (d.getFullYear() < 1) {
      dateInput.value = '';
      return;
    }
    dateInput.value = `${pad(d.getFullYear(), 4)}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };
  syncInput(store.get().time);
  dateInput.addEventListener('change', () => {
    const d = new Date(dateInput.value);
    if (!isNaN(d.getTime())) store.set({ time: clampDate(d) });
  });

  const nowBtn = document.createElement('button');
  nowBtn.textContent = '現在';
  nowBtn.addEventListener('click', () => store.set({ time: new Date(), playing: false }));

  // --- 圖層開關 ---
  const makeToggle = (labelText: string, checked: boolean, onChange: (v: boolean) => void) => {
    const label = document.createElement('label');
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = checked;
    cb.addEventListener('change', () => onChange(cb.checked));
    label.append(cb, document.createTextNode(labelText));
    return { label, cb };
  };

  const layers = store.get().layers;
  const orbitsT = makeToggle('軌道線', layers.orbits, (v) => store.setLayer({ orbits: v }));
  const linesT = makeToggle('宿連線', layers.mansionLines, (v) => store.setLayer({ mansionLines: v }));
  const namesT = makeToggle('宿名', layers.mansionLabels, (v) => store.setLayer({ mansionLabels: v }));
  const eclT = makeToggle('黃道', layers.eclipticLine, (v) => store.setLayer({ eclipticLine: v }));
  const eqT = makeToggle('天赤道', layers.equatorLine, (v) => store.setLayer({ equatorLine: v }));
  const zodT = makeToggle('十二宮', layers.zodiacBands, (v) => store.setLayer({ zodiacBands: v }));
  const cometT = makeToggle('彗星', layers.comets, (v) => store.setLayer({ comets: v }));
  // 三王星開關綁定「目前視角」的旗標，切換視角時回讀該視角記住的狀態
  const modernT = makeToggle('現代三王星', layers.modernPlanetsHelio, (v) => {
    if (store.get().viewMode === 'helio') store.setLayer({ modernPlanetsHelio: v });
    else store.setLayer({ modernPlanetsGeo: v });
  });

  bar.append(
    modeWrap, dateInput, nowBtn,
    orbitsT.label, linesT.label, namesT.label,
    eclT.label, eqT.label, zodT.label, cometT.label, modernT.label,
  );
  root.appendChild(bar);

  store.subscribe((s, changed) => {
    if (changed.has('time')) syncInput(s.time);
    if (changed.has('viewMode')) {
      syncModeButtons();
      modernT.cb.checked =
        s.viewMode === 'helio' ? s.layers.modernPlanetsHelio : s.layers.modernPlanetsGeo;
      // 軌道線僅日心視角有意義
      orbitsT.cb.disabled = s.viewMode === 'geo';
    }
  });
}
