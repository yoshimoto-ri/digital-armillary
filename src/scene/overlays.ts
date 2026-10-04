import * as THREE from 'three';
import { AstroTime } from 'astronomy-engine';
import type { LayerState } from '../state/store';
import { eclipticOfDateToEqj, equatorOfDateToEqj } from '../astro/frames';
import { t, zodiacName } from '../i18n';
import { directionToSphere, R_OVERLAY } from './scale';
import { makeLabel } from './labels';

const CIRCLE_SAMPLES = 256;
/** 宮界刻線：黃緯 ±8° 的短弧 */
const TICK_LAT_RANGE = 8;
const TICK_SAMPLES = 8;
/** 時間變化超過此天數才重算覆蓋層（歲差 ~1°/72 年，30 日內變化不可見） */
const RECOMPUTE_DAYS = 30;

/**
 * 當日框架覆蓋層：黃道線、天赤道線、十二宮宮界與宮名、春分點標記。
 * 全部依「當日框架」幾何投影回 EQJ 世界座標繪製——恆星不動、框架在動，
 * 時間軸播放時歲差漂移（宮界相對恆星移動）自然浮現（ARCHITECTURE.md §4.4）。
 */
export class Overlays {
  readonly group = new THREE.Group();
  private readonly eclipticLine: THREE.LineLoop;
  private readonly equatorLine: THREE.LineLoop;
  private readonly zodiacTicks: THREE.LineSegments;
  private readonly zodiacGroup = new THREE.Group();
  private readonly zodiacLabels: ReturnType<typeof makeLabel>[] = [];
  private readonly equinoxLabel: ReturnType<typeof makeLabel>;
  private lastComputed: AstroTime | null = null;

  constructor() {
    this.eclipticLine = new THREE.LineLoop(
      circleGeometry(),
      new THREE.LineBasicMaterial({ color: 0xd8b84a, transparent: true, opacity: 0.55 }),
    );
    this.equatorLine = new THREE.LineLoop(
      circleGeometry(),
      new THREE.LineBasicMaterial({ color: 0xc06858, transparent: true, opacity: 0.5 }),
    );

    const tickGeo = new THREE.BufferGeometry();
    tickGeo.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(new Float32Array(12 * TICK_SAMPLES * 2 * 3), 3),
    );
    this.zodiacTicks = new THREE.LineSegments(
      tickGeo,
      new THREE.LineBasicMaterial({ color: 0x8a7ab8, transparent: true, opacity: 0.5 }),
    );
    this.zodiacGroup.add(this.zodiacTicks);
    for (let k = 0; k < 12; k++) {
      const label = makeLabel(zodiacName(k), { className: 'label-zodiac' });
      this.zodiacLabels.push(label);
      this.zodiacGroup.add(label);
    }
    this.equinoxLabel = makeLabel(t('equinox'), { className: 'label-equinox' });
    this.zodiacGroup.add(this.equinoxLabel);

    this.group.add(this.eclipticLine, this.equatorLine, this.zodiacGroup);
  }

  /** 依時刻重算當日框架幾何（有重算門檻，播放時不至於每幀全算） */
  update(time: AstroTime): void {
    if (this.lastComputed && Math.abs(time.ut - this.lastComputed.ut) < RECOMPUTE_DAYS) return;
    this.lastComputed = time;
    const tmp = new THREE.Vector3();

    // 黃道線：當日黃道 β=0 一圈
    const ecl = this.eclipticLine.geometry.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i < CIRCLE_SAMPLES; i++) {
      directionToSphere(eclipticOfDateToEqj((i / CIRCLE_SAMPLES) * 360, 0, time), R_OVERLAY, tmp);
      ecl.setXYZ(i, tmp.x, tmp.y, tmp.z);
    }
    ecl.needsUpdate = true;
    this.eclipticLine.geometry.computeBoundingSphere();

    // 天赤道線：當日赤道 δ=0 一圈
    const eq = this.equatorLine.geometry.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i < CIRCLE_SAMPLES; i++) {
      directionToSphere(equatorOfDateToEqj((i / CIRCLE_SAMPLES) * 360, 0, time), R_OVERLAY, tmp);
      eq.setXYZ(i, tmp.x, tmp.y, tmp.z);
    }
    eq.needsUpdate = true;
    this.equatorLine.geometry.computeBoundingSphere();

    // 宮界刻線：λ = 30k° 上黃緯 ±8° 的短弧（線段串）
    const ticks = this.zodiacTicks.geometry.getAttribute('position') as THREE.BufferAttribute;
    let vi = 0;
    for (let k = 0; k < 12; k++) {
      const lon = k * 30;
      for (let s = 0; s < TICK_SAMPLES; s++) {
        const b0 = -TICK_LAT_RANGE + (s / TICK_SAMPLES) * TICK_LAT_RANGE * 2;
        const b1 = -TICK_LAT_RANGE + ((s + 1) / TICK_SAMPLES) * TICK_LAT_RANGE * 2;
        directionToSphere(eclipticOfDateToEqj(lon, b0, time), R_OVERLAY, tmp);
        ticks.setXYZ(vi++, tmp.x, tmp.y, tmp.z);
        directionToSphere(eclipticOfDateToEqj(lon, b1, time), R_OVERLAY, tmp);
        ticks.setXYZ(vi++, tmp.x, tmp.y, tmp.z);
      }
    }
    ticks.needsUpdate = true;
    this.zodiacTicks.geometry.computeBoundingSphere();

    // 宮名：宮中央（λ = 30k+15°）黃緯 +12° 處
    for (let k = 0; k < 12; k++) {
      directionToSphere(eclipticOfDateToEqj(k * 30 + 15, 12, time), R_OVERLAY, tmp);
      this.zodiacLabels[k].position.copy(tmp);
    }
    // 春分點：λ=0 黃緯 −12°（與宮名錯開）
    directionToSphere(eclipticOfDateToEqj(0, -12, time), R_OVERLAY, tmp);
    this.equinoxLabel.position.copy(tmp);
  }

  /** 語言切換：重寫宮名與春分點標籤 */
  relabel(): void {
    this.zodiacLabels.forEach((l, k) => {
      l.element.textContent = zodiacName(k);
    });
    this.equinoxLabel.element.textContent = t('equinox');
  }

  applyVisibility(layers: LayerState): void {
    this.eclipticLine.visible = layers.eclipticLine;
    this.equatorLine.visible = layers.equatorLine;
    this.zodiacGroup.visible = layers.zodiacBands;
  }
}

function circleGeometry(): THREE.BufferGeometry {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(CIRCLE_SAMPLES * 3), 3));
  return geo;
}
