import { store } from '../state/store';
import { dateFromAstronomicalYear, toAstroTime } from '../astro/time';
import { geoEclipticLon } from '../astro/ephemeris';
import { formatLon, starEclipticLonJ2000, starEclipticLonOfDate } from '../astro/frames';
import { mansionBoundaries, mansionOf } from '../astro/mansions';
import { zodiacOf } from '../astro/zodiac';
import { motionState } from '../astro/retrograde';
import { cometGeoEclipticLon, cometHelioDistance } from '../astro/comets';
import { ALL_PLANETS, HAS_RETROGRADE } from '../data/planets';
import { COMETS } from '../data/comets';
import type { MansionsFile } from '../data/types';
import { DISTAR_FILE, distarOverrideOf } from '../data/distarSystems';
import {
  cometName, cometNote, distarStarName, distarSysLabel, fmtYear, groupName, mansionName,
  planetName, t, zodiacName,
} from '../i18n';

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
      document.body.classList.remove('sidebar-open');
      return;
    }
    el.classList.add('open');
    document.body.classList.add('sidebar-open');
    const at = toAstroTime(time);
    const boundaries = mansionBoundaries(mansionsFile.mansions, at);
    const rows: [string, string, string?][] = [];
    let title = '';
    let extra = '';

    if (selection.type === 'planet') {
      const spec = ALL_PLANETS.find((p) => p.key === selection.key)!;
      title = planetName(spec);
      if (spec.key === 'earth') {
        extra = t('earthNA');
      } else {
        const lon = geoEclipticLon(spec.body, at);
        if (lon == null) {
          extra = t('outOfRange');
        } else {
          rows.push([t('geoLon'), formatLon(lon)]);
          rows.push([t('inMansion'), mansionName(mansionOf(lon, boundaries).name)]);
          const z = zodiacOf(lon);
          rows.push([t('inSign'), `${zodiacName(z.index)} ${formatLon(z.degreeInSign)}`]);
          if (HAS_RETROGRADE.has(spec.key)) {
            const m = motionState(spec.body, at);
            rows.push([
              t('motion'),
              m === 'retrograde' ? t('retrograde') : m === 'direct' ? t('direct') : '—',
              m === 'retrograde' ? 'retro' : undefined,
            ]);
          }
          if (spec.discoveryYear != null) {
            rows.push([t('discoveryYear'), t('discoveryYearVal', { year: spec.discoveryYear })]);
          }
        }
      }
    } else if (selection.type === 'comet') {
      const spec = COMETS.find((c) => c.key === selection.key)!;
      title = cometName(spec);
      rows.push([t('cometId'), spec.designation]);
      const lon = cometGeoEclipticLon(spec, at);
      if (lon != null) {
        rows.push([t('geoLon'), formatLon(lon)]);
        rows.push([t('inMansion'), mansionName(mansionOf(lon, boundaries).name)]);
        const z = zodiacOf(lon);
        rows.push([t('inSign'), `${zodiacName(z.index)} ${formatLon(z.degreeInSign)}`]);
      }
      const r = cometHelioDistance(spec, at);
      rows.push([t('helioDist'), `${r < 10 ? r.toFixed(2) : r.toFixed(1)} AU`]);
      rows.push([
        t('period'),
        t('periodAbout', { n: spec.periodYears >= 1000 ? Math.round(spec.periodYears / 100) * 100 : spec.periodYears }),
      ]);
      rows.push([t('perihelion'), jdToDateString(spec.tpJd)]);
      extra = t('cometExtra', { note: cometNote(spec) });
    } else {
      const m = mansionsFile.mansions.find((x) => x.name === selection.key)!;
      title = t('mansionTitle', { name: mansionName(m.name), group: groupName(m.group) });
      const lon = starEclipticLonOfDate(m.raJ2000, m.decJ2000, at);
      rows.push([t('distarStar'), distarStarName(m)]);
      rows.push([t('magnitude'), m.vmag.toFixed(2)]);
      rows.push([t('distarLon'), formatLon(lon)]);
      rows.push([t('distarSign'), zodiacName(zodiacOf(lon).index)]);
      // 歲差對照（§7.6）：同一距星在對照時刻落在哪一宮
      const s = store.get();
      if (s.layers.precessionCompare) {
        const ct = toAstroTime(dateFromAstronomicalYear(s.compareYear));
        const clon = starEclipticLonOfDate(m.raJ2000, m.decJ2000, ct);
        rows.push([t('signAt', { year: fmtYear(s.compareYear) }), zodiacName(zodiacOf(clon).index)]);
      }
      // 歷代距星對照（§7.9）：此宿距星在漢／明系統與清基準不同者逐列顯示
      const DU = 360 / 365.25;
      const baseLon = starEclipticLonJ2000(m.raJ2000, m.decJ2000);
      for (const sys of DISTAR_FILE.systems) {
        if (sys.id === 'qing') continue;
        const o = distarOverrideOf(sys, m.name);
        if (!o || o.hip === m.hip) continue;
        let d = (starEclipticLonJ2000(o.raJ2000, o.decJ2000) - baseLon) / DU;
        if (d > 180 / DU) d -= 360 / DU;
        if (d < -180 / DU) d += 360 / DU;
        const uncertain = sys.uncertain?.includes(m.name) ? t('uncertainLong') : '';
        rows.push([
          t('histDistar', { sys: distarSysLabel(sys) }),
          t('histDistarVal', {
            star: distarStarName(o),
            uncertain,
            d: `${d >= 0 ? '+' : ''}${d.toFixed(1)}`,
          }),
        ]);
      }
    }

    el.innerHTML = '';
    const closeBtn = document.createElement('button');
    closeBtn.className = 'close';
    closeBtn.textContent = t('closeBtn');
    closeBtn.addEventListener('click', () => store.set({ selection: null }));
    const h2 = document.createElement('h2');
    h2.textContent = title;
    el.append(closeBtn, h2);
    for (const [k, v, cls] of rows) {
      const row = document.createElement('div');
      row.className = 'row';
      const kEl = document.createElement('span');
      kEl.className = 'k';
      kEl.textContent = k;
      const vEl = document.createElement('span');
      vEl.textContent = v;
      if (cls) vEl.className = cls;
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
      const hasHistory = DISTAR_FILE.systems.some(
        (sys) => sys.id !== 'qing' && distarOverrideOf(sys, selection.key) != null,
      );
      p.textContent = t(hasHistory ? 'distarNoteHist' : 'distarNotePlain');
      el.appendChild(p);
    }
  };

  store.subscribe((_s, changed) => {
    if (changed.has('selection') || changed.has('lang') || changed.has('time') || changed.has('compareYear') || changed.has('layers')) render();
  });
  render();
}
