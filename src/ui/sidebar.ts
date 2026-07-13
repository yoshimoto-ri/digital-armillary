import { store } from '../state/store';
import { dateFromAstronomicalYear, formatAstronomicalYear, toAstroTime } from '../astro/time';
import { geoEclipticLon } from '../astro/ephemeris';
import { formatLon, starEclipticLonOfDate } from '../astro/frames';
import { mansionBoundaries, mansionOf } from '../astro/mansions';
import { zodiacOf } from '../astro/zodiac';
import { motionState } from '../astro/retrograde';
import { cometGeoEclipticLon, cometHelioDistance } from '../astro/comets';
import { ALL_PLANETS, HAS_RETROGRADE } from '../data/planets';
import { COMETS } from '../data/comets';
import type { MansionsFile } from '../data/types';

/** 儒略日 → UTC 年月日字串 */
function jdToDateString(jd: number): string {
  const d = new Date((jd - 2440587.5) * 86400000);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

/** 側欄：點選行星/宿後顯示黃經、所在宿、所在宮、順逆行（ARCHITECTURE.md UI 需求） */
export function createSidebar(root: HTMLElement, mansionsFile: MansionsFile): void {
  const el = document.createElement('aside');
  el.className = 'sidebar';
  root.appendChild(el);

  const render = () => {
    const { selection, time } = store.get();
    if (!selection) {
      el.classList.remove('open');
      return;
    }
    el.classList.add('open');
    const t = toAstroTime(time);
    const boundaries = mansionBoundaries(mansionsFile.mansions, t);
    const rows: [string, string][] = [];
    let title = '';
    let extra = '';

    if (selection.type === 'planet') {
      const spec = ALL_PLANETS.find((p) => p.key === selection.key)!;
      title = spec.nameZh;
      if (spec.key === 'earth') {
        extra = '地心黃經以地球為原點定義，不適用於地球本身。';
      } else {
        const lon = geoEclipticLon(spec.body, t);
        if (lon == null) {
          extra = '目前時刻超出星曆引擎支援範圍。';
        } else {
          rows.push(['地心黃經', formatLon(lon)]);
          rows.push(['所在宿', `${mansionOf(lon, boundaries).name}宿`]);
          const z = zodiacOf(lon);
          rows.push(['所在宮', `${z.name} ${formatLon(z.degreeInSign)}`]);
          if (HAS_RETROGRADE.has(spec.key)) {
            const m = motionState(spec.body, t);
            rows.push(['運行狀態', m === 'retrograde' ? '逆行' : m === 'direct' ? '順行' : '—']);
          }
          if (spec.discoveryYear != null) {
            rows.push(['發現年', `西元 ${spec.discoveryYear} 年`]);
          }
        }
      }
    } else if (selection.type === 'comet') {
      const spec = COMETS.find((c) => c.key === selection.key)!;
      title = spec.nameZh;
      rows.push(['編號', spec.designation]);
      const lon = cometGeoEclipticLon(spec, t);
      if (lon != null) {
        rows.push(['地心黃經', formatLon(lon)]);
        rows.push(['所在宿', `${mansionOf(lon, boundaries).name}宿`]);
        const z = zodiacOf(lon);
        rows.push(['所在宮', `${z.name} ${formatLon(z.degreeInSign)}`]);
      }
      const r = cometHelioDistance(spec, t);
      rows.push(['日心距', `${r < 10 ? r.toFixed(2) : r.toFixed(1)} AU`]);
      rows.push(['週期', spec.periodYears >= 1000 ? `約 ${Math.round(spec.periodYears / 100) * 100} 年` : `約 ${spec.periodYears} 年`]);
      rows.push(['曆元近日點', jdToDateString(spec.tpJd)]);
      extra = `${spec.note} 軌道為二體克卜勒推算（未含行星攝動），離曆元近日點越遠誤差越大。`;
    } else {
      const m = mansionsFile.mansions.find((x) => x.name === selection.key)!;
      title = `${m.name}宿（${m.group}）`;
      const lon = starEclipticLonOfDate(m.raJ2000, m.decJ2000, t);
      rows.push(['距星', `${m.detStarName}（${m.westernName}）`]);
      rows.push(['視星等', m.vmag.toFixed(2)]);
      rows.push(['距星黃經', formatLon(lon)]);
      rows.push(['距星所在宮', zodiacOf(lon).name]);
      // 歲差對照（§7.6）：同一距星在對照時刻落在哪一宮
      const s = store.get();
      if (s.layers.precessionCompare) {
        const ct = toAstroTime(dateFromAstronomicalYear(s.compareYear));
        const clon = starEclipticLonOfDate(m.raJ2000, m.decJ2000, ct);
        rows.push([`${formatAstronomicalYear(s.compareYear)}所在宮`, zodiacOf(clon).name]);
      }
    }

    el.innerHTML = '';
    const closeBtn = document.createElement('button');
    closeBtn.className = 'close';
    closeBtn.textContent = '✕';
    closeBtn.addEventListener('click', () => store.set({ selection: null }));
    const h2 = document.createElement('h2');
    h2.textContent = title;
    el.append(closeBtn, h2);
    for (const [k, v] of rows) {
      const row = document.createElement('div');
      row.className = 'row';
      const kEl = document.createElement('span');
      kEl.className = 'k';
      kEl.textContent = k;
      const vEl = document.createElement('span');
      vEl.textContent = v;
      if (k === '運行狀態' && v === '逆行') vEl.className = 'retro';
      row.append(kEl, vEl);
      el.appendChild(row);
    }
    if (extra) {
      const p = document.createElement('div');
      p.className = 'src';
      p.textContent = extra;
      el.appendChild(p);
    }
    if (selection.type === 'mansion') {
      const p = document.createElement('div');
      p.className = 'src';
      p.textContent = '距星依清《儀象考成》系統；黃經為當日黃道座標。';
      el.appendChild(p);
    }
  };

  store.subscribe((_s, changed) => {
    if (changed.has('selection') || changed.has('time') || changed.has('compareYear') || changed.has('layers')) render();
  });
  render();
}
