import { store } from '../state/store';
import { clampDate } from '../astro/time';

/** 底部控制列：日期選擇 + 圖層開關。改狀態 → scene 訂閱重繪。 */
export function createControlBar(root: HTMLElement): void {
  const bar = document.createElement('div');
  bar.className = 'control-bar';

  // --- 日期選擇器 ---
  const dateInput = document.createElement('input');
  dateInput.type = 'datetime-local';
  const syncInput = (d: Date) => {
    const pad = (n: number, w = 2) => String(n).padStart(w, '0');
    // datetime-local 用本地時區
    dateInput.value = `${pad(d.getFullYear(), 4)}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };
  syncInput(store.get().time);
  dateInput.addEventListener('change', () => {
    const d = new Date(dateInput.value);
    if (!isNaN(d.getTime())) store.set({ time: clampDate(d) });
  });

  const nowBtn = document.createElement('button');
  nowBtn.textContent = '現在';
  nowBtn.addEventListener('click', () => store.set({ time: new Date() }));

  // --- 圖層開關 ---
  const makeToggle = (labelText: string, checked: boolean, onChange: (v: boolean) => void) => {
    const label = document.createElement('label');
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = checked;
    cb.addEventListener('change', () => onChange(cb.checked));
    label.append(cb, document.createTextNode(labelText));
    return label;
  };

  const layers = store.get().layers;
  bar.append(
    dateInput,
    nowBtn,
    makeToggle('軌道線', layers.orbits, (v) => store.setLayer({ orbits: v })),
    makeToggle('宿連線', layers.mansionLines, (v) => store.setLayer({ mansionLines: v })),
    makeToggle('宿名', layers.mansionLabels, (v) => store.setLayer({ mansionLabels: v })),
    makeToggle('現代三王星', layers.modernPlanetsHelio, (v) => store.setLayer({ modernPlanetsHelio: v })),
  );
  root.appendChild(bar);

  // 外部改變時間（如「現在」）時回寫輸入框
  store.subscribe((s, changed) => {
    if (changed.has('time')) syncInput(s.time);
  });
}
