import { store } from '../state/store';
import { clampDate } from '../astro/time';
import { DISTAR_FILE } from '../data/distarSystems';
import type { DistarSystemId } from '../data/types';
import { bindAttr, bindText, distarSysLabel, onLang, t } from '../i18n';
import type { DictKey } from '../i18n/zh';

/** 底部控制列：視角切換 + 日期選擇 + 圖層開關。改狀態 → scene 訂閱重繪。 */
export function createControlBar(root: HTMLElement): void {
  const bar = document.createElement('div');
  bar.className = 'control-bar';

  // --- 視角切換（日心／渾象） ---
  const modeWrap = document.createElement('div');
  modeWrap.className = 'mode-switch';
  const helioBtn = document.createElement('button');
  bindText(helioBtn, 'helio');
  const geoBtn = document.createElement('button');
  bindText(geoBtn, 'geo');
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
  bindText(nowBtn, 'now');
  nowBtn.addEventListener('click', () => store.set({ time: new Date(), playing: false }));

  // --- 圖層開關 ---
  const makeToggle = (key: DictKey, checked: boolean, onChange: (v: boolean) => void) => {
    const label = document.createElement('label');
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = checked;
    cb.addEventListener('change', () => onChange(cb.checked));
    const text = document.createElement('span');
    bindText(text, key);
    label.append(cb, text);
    return { label, cb };
  };

  const layers = store.get().layers;
  const orbitsT = makeToggle('orbits', layers.orbits, (v) => store.setLayer({ orbits: v }));
  const linesT = makeToggle('mansionLines', layers.mansionLines, (v) => store.setLayer({ mansionLines: v }));
  const namesT = makeToggle('mansionNames', layers.mansionLabels, (v) => store.setLayer({ mansionLabels: v }));
  const eclT = makeToggle('ecliptic', layers.eclipticLine, (v) => store.setLayer({ eclipticLine: v }));
  const eqT = makeToggle('equator', layers.equatorLine, (v) => store.setLayer({ equatorLine: v }));
  const zodT = makeToggle('zodiac', layers.zodiacBands, (v) => store.setLayer({ zodiacBands: v }));
  const cometT = makeToggle('comets', layers.comets, (v) => store.setLayer({ comets: v }));

  // 歲差對照：開關 + 對照年輸入（負數 = 西元前，如 -100 = 西元前 100 年）
  const compareInput = document.createElement('input');
  compareInput.type = 'number';
  compareInput.min = '-1000';
  compareInput.max = '5000';
  compareInput.step = '100';
  bindAttr(compareInput, 'title', 'precessionTitle');
  // 顯示慣例：西元前 N 年 = -N；天文年 = 1 - N（西元前 100 年 → 天文年 -99）
  const astroToDisplay = (y: number) => (y > 0 ? y : y - 1);
  const displayToAstro = (v: number) => (v > 0 ? v : v + 1);
  compareInput.value = String(astroToDisplay(store.get().compareYear));
  compareInput.disabled = !layers.precessionCompare;
  compareInput.addEventListener('change', () => {
    const v = Number(compareInput.value);
    if (!Number.isFinite(v) || v === 0) return; // 無西元 0 年
    const clamped = Math.max(-1000, Math.min(5000, v));
    compareInput.value = String(clamped);
    store.set({ compareYear: displayToAstro(clamped) });
  });
  const compareT = makeToggle('precession', layers.precessionCompare, (v) => {
    compareInput.disabled = !v;
    store.setLayer({ precessionCompare: v });
  });
  // 宿界對照：開關 + 對照距星系統下拉（基準恆為清《儀象考成》）
  const distarSelect = document.createElement('select');
  bindAttr(distarSelect, 'title', 'distarSelectTitle');
  for (const sys of DISTAR_FILE.systems) {
    if (sys.id === 'qing') continue;
    const opt = document.createElement('option');
    opt.value = sys.id;
    onLang(() => {
      opt.textContent = distarSysLabel(sys);
    });
    distarSelect.appendChild(opt);
  }
  distarSelect.value = store.get().distarCompareSystem;
  distarSelect.disabled = !layers.distarCompare;
  distarSelect.addEventListener('change', () => {
    store.set({ distarCompareSystem: distarSelect.value as Exclude<DistarSystemId, 'qing'> });
  });
  const distarT = makeToggle('distar', layers.distarCompare, (v) => {
    distarSelect.disabled = !v;
    store.setLayer({ distarCompare: v });
  });
  bindAttr(distarT.label, 'title', 'distarTitle');

  // 三王星開關綁定「目前視角」的旗標，切換視角時回讀該視角記住的狀態
  const modernT = makeToggle('modern', layers.modernPlanetsHelio, (v) => {
    if (store.get().viewMode === 'helio') store.setLayer({ modernPlanetsHelio: v });
    else store.setLayer({ modernPlanetsGeo: v });
  });

  // 分組容器：桌面 display: contents（排版與未分組時完全相同）；手機收合成「圖層」面板
  const mainGroup = document.createElement('div');
  mainGroup.className = 'cb-main';
  mainGroup.append(modeWrap, dateInput, nowBtn);
  const layerGroup = document.createElement('div');
  layerGroup.className = 'cb-layers';
  layerGroup.append(
    orbitsT.label, linesT.label, namesT.label,
    eclT.label, eqT.label, zodT.label, cometT.label, modernT.label,
    compareT.label, compareInput,
    distarT.label, distarSelect,
  );
  // 手機專用：圖層面板開關鈕（桌面 CSS 隱藏）、語言切換鈕
  const layersBtn = document.createElement('button');
  layersBtn.className = 'cb-layers-btn';
  const syncLayersBtn = () => {
    layersBtn.textContent = t(bar.classList.contains('expanded') ? 'layersBtnClose' : 'layersBtn');
  };
  layersBtn.addEventListener('click', () => {
    bar.classList.toggle('expanded');
    syncLayersBtn();
  });
  onLang(syncLayersBtn);
  mainGroup.append(layersBtn); // 桌面隱藏；手機與模式切換同列
  bar.append(mainGroup, layerGroup);

  // 手機專用：整個底部控制區（控制列＋時間軸）可隱藏，讓出整個星空（桌面 CSS 隱藏此鈕）
  const dockBtn = document.createElement('button');
  dockBtn.className = 'dock-btn';
  const syncDockBtn = () => {
    dockBtn.textContent = t(root.classList.contains('collapsed') ? 'dockShow' : 'dockHide');
  };
  dockBtn.addEventListener('click', () => {
    root.classList.toggle('collapsed');
    syncDockBtn();
  });
  onLang(syncDockBtn);
  root.prepend(dockBtn);
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
