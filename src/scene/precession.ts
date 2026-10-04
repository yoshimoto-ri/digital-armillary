import * as THREE from 'three';
import { AstroTime } from 'astronomy-engine';
import { eclipticOfDateToEqj } from '../astro/frames';
import { fmtYear, t, zodiacName } from '../i18n';
import { directionToSphere, R_OVERLAY } from './scale';
import { makeLabel } from './labels';

/** 對照環刻線：黃緯 ±5°（比目前時刻的 ±8° 短，一眼可分） */
const TICK_LAT_RANGE = 5;
const TICK_SAMPLES = 6;
/** 對照時刻固定不隨播放變動，只在對照年改變時重算 */

/**
 * 歲差對照環（ARCHITECTURE.md §7.6）：同屏繪製「對照時刻」的十二宮宮界與宮名
 * （暖橙色系），與目前時刻的宮界（紫色系，scene/overlays.ts）並列。
 * 播放時間軸時，目前時刻的環沿黃道漂移、對照環固定，兩環的錯位即歲差累積量
 * （約 1°/72 年；對照西元前 100 年與今日相差近整整一宮）。
 */
export class PrecessionCompare {
  readonly group = new THREE.Group();
  private readonly ticks: THREE.LineSegments;
  private readonly zodiacLabels: ReturnType<typeof makeLabel>[] = [];
  private readonly equinoxLabel: ReturnType<typeof makeLabel>;
  private lastYear: number | null = null;

  constructor() {
    const tickGeo = new THREE.BufferGeometry();
    tickGeo.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(new Float32Array(12 * TICK_SAMPLES * 2 * 3), 3),
    );
    this.ticks = new THREE.LineSegments(
      tickGeo,
      new THREE.LineBasicMaterial({ color: 0xd8884a, transparent: true, opacity: 0.55 }),
    );
    this.group.add(this.ticks);

    for (let k = 0; k < 12; k++) {
      const label = makeLabel(zodiacName(k), { className: 'label-zodiac-compare' });
      this.zodiacLabels.push(label);
      this.group.add(label);
    }
    this.equinoxLabel = makeLabel('', { className: 'label-equinox-compare' });
    this.group.add(this.equinoxLabel);
  }

  /** 依對照時刻重算宮界幾何（對照年不變時不重算） */
  update(compareYear: number, compareTime: AstroTime): void {
    if (this.lastYear === compareYear) return;
    this.lastYear = compareYear;
    const tmp = new THREE.Vector3();

    const attr = this.ticks.geometry.getAttribute('position') as THREE.BufferAttribute;
    let vi = 0;
    for (let k = 0; k < 12; k++) {
      const lon = k * 30;
      for (let s = 0; s < TICK_SAMPLES; s++) {
        const b0 = -TICK_LAT_RANGE + (s / TICK_SAMPLES) * TICK_LAT_RANGE * 2;
        const b1 = -TICK_LAT_RANGE + ((s + 1) / TICK_SAMPLES) * TICK_LAT_RANGE * 2;
        directionToSphere(eclipticOfDateToEqj(lon, b0, compareTime), R_OVERLAY, tmp);
        attr.setXYZ(vi++, tmp.x, tmp.y, tmp.z);
        directionToSphere(eclipticOfDateToEqj(lon, b1, compareTime), R_OVERLAY, tmp);
        attr.setXYZ(vi++, tmp.x, tmp.y, tmp.z);
      }
    }
    attr.needsUpdate = true;
    this.ticks.geometry.computeBoundingSphere();

    // 宮名放黃緯 −16°（目前時刻的宮名在 +12°，上下錯開不打架）
    for (let k = 0; k < 12; k++) {
      directionToSphere(eclipticOfDateToEqj(k * 30 + 15, -16, compareTime), R_OVERLAY, tmp);
      this.zodiacLabels[k].position.copy(tmp);
    }
    this.equinoxLabel.element.textContent = t('equinoxAt', { year: fmtYear(compareYear) });
    directionToSphere(eclipticOfDateToEqj(0, -22, compareTime), R_OVERLAY, tmp);
    this.equinoxLabel.position.copy(tmp);
  }

  /** 語言切換：重寫宮名並讓下次 update 重寫春分點標籤 */
  relabel(): void {
    this.zodiacLabels.forEach((l, k) => {
      l.element.textContent = zodiacName(k);
    });
    this.lastYear = null;
  }

  setVisible(v: boolean): void {
    this.group.visible = v;
  }
}
