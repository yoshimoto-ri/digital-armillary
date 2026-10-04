import { store } from '../state/store';
import { clampDate, MAX_DATE, MIN_DATE } from '../astro/time';
import { fmtYear, onLang, t } from '../i18n';
import type { DictKey } from '../i18n/zh';

/** 播放速率檔位（模擬日／真實秒）。100 年/秒供觀察歲差漂移。 */
const SPEEDS: { label: DictKey; daysPerSec: number }[] = [
  { label: 'speed1', daysPerSec: 1 },
  { label: 'speed2', daysPerSec: 10 },
  { label: 'speed3', daysPerSec: 365.25 },
  { label: 'speed4', daysPerSec: 3652.5 },
  { label: 'speed5', daysPerSec: 36525 },
];

const MIN_YEAR = MIN_DATE.getUTCFullYear();
const MAX_YEAR = MAX_DATE.getUTCFullYear();

/** 時間軸列：播放/暫停、速率、年份滑桿（西元前 1000 – 西元 5000） */
export function createTimeline(root: HTMLElement): void {
  const bar = document.createElement('div');
  bar.className = 'timeline-bar';

  const playBtn = document.createElement('button');
  playBtn.className = 'play';
  const syncPlayBtn = () => {
    playBtn.textContent = t(store.get().playing ? 'pause' : 'play');
  };
  onLang(syncPlayBtn);
  playBtn.addEventListener('click', () => store.set({ playing: !store.get().playing }));

  const speedSel = document.createElement('select');
  for (const s of SPEEDS) {
    const opt = document.createElement('option');
    opt.value = String(s.daysPerSec);
    onLang(() => {
      opt.textContent = t(s.label);
    });
    speedSel.appendChild(opt);
  }
  speedSel.value = String(SPEEDS[2].daysPerSec); // 預設 1 年/秒
  store.set({ playSpeed: SPEEDS[2].daysPerSec });
  speedSel.addEventListener('change', () => store.set({ playSpeed: Number(speedSel.value) }));

  const slider = document.createElement('input');
  slider.type = 'range';
  slider.min = String(MIN_YEAR);
  slider.max = String(MAX_YEAR);
  slider.step = '1';

  const readout = document.createElement('span');
  readout.className = 'year-readout';

  const syncFromState = (d: Date) => {
    slider.value = String(d.getUTCFullYear());
    readout.textContent = fmtYear(d.getUTCFullYear());
  };
  onLang(() => syncFromState(store.get().time));

  slider.addEventListener('input', () => {
    const cur = store.get().time;
    const d = new Date(cur.getTime());
    d.setUTCFullYear(Number(slider.value));
    store.set({ time: clampDate(d), playing: false });
  });

  bar.append(playBtn, speedSel, slider, readout);
  root.appendChild(bar);

  store.subscribe((s, changed) => {
    if (changed.has('time')) syncFromState(s.time);
    if (changed.has('playing')) syncPlayBtn();
  });
}
