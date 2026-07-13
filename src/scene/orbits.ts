import * as THREE from 'three';
import { AstroTime } from 'astronomy-engine';
import { ALL_PLANETS, PlanetSpec } from '../data/planets';
import { helioVec } from '../astro/ephemeris';
import { compressToScene } from './scale';

const SAMPLES = 256;
/** 軌道線重算門檻（日）：日心軌道在世紀尺度下幾乎不動，超過 ~10 年才重算 */
const RECOMPUTE_DAYS = 3650;

interface OrbitNode {
  spec: PlanetSpec;
  line: THREE.Line;
  available: boolean;
}

/**
 * 行星軌道線：逐點取樣真實位置再逐點 √ 壓縮（非幾何橢圓，ARCHITECTURE.md §7.5）。
 * 三王星用虛線材質區隔。
 */
export class Orbits {
  readonly group = new THREE.Group();
  private readonly nodes: OrbitNode[] = [];
  private lastComputed: AstroTime | null = null;

  constructor() {
    for (const spec of ALL_PLANETS) {
      if (!spec.hasOrbit) continue;
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array((SAMPLES + 1) * 3), 3));
      const modern = spec.group === 'modern';
      const mat = modern
        ? new THREE.LineDashedMaterial({ color: spec.color, transparent: true, opacity: 0.4, dashSize: 6, gapSize: 5 })
        : new THREE.LineBasicMaterial({ color: spec.color, transparent: true, opacity: 0.32 });
      const line = new THREE.Line(geo, mat);
      this.group.add(line);
      this.nodes.push({ spec, line, available: true });
    }
  }

  update(time: AstroTime): void {
    if (this.lastComputed && Math.abs(time.ut - this.lastComputed.ut) < RECOMPUTE_DAYS) return;
    this.lastComputed = time;
    const tmp = new THREE.Vector3();
    for (const node of this.nodes) {
      const attr = node.line.geometry.getAttribute('position') as THREE.BufferAttribute;
      let ok = true;
      for (let i = 0; i <= SAMPLES; i++) {
        // 取樣一整個週期；periodDays 僅決定時間窗長度，位置全由引擎計算
        const t = time.AddDays((i / SAMPLES) * node.spec.periodDays);
        const hv = helioVec(node.spec.body, t);
        if (!hv) { ok = false; break; }
        compressToScene(hv, tmp);
        attr.setXYZ(i, tmp.x, tmp.y, tmp.z);
      }
      node.available = ok; // 可見性由 applyVisibility 統一收斂
      if (ok) {
        attr.needsUpdate = true;
        node.line.geometry.computeBoundingSphere();
        node.line.computeLineDistances(); // 虛線材質需要
      }
    }
  }

  /** 開關 + 三王星圖層 + 發現年淡化 */
  applyVisibility(showOrbits: boolean, showModern: boolean, year: number): void {
    for (const node of this.nodes) {
      const modern = node.spec.group === 'modern';
      node.line.visible = showOrbits && node.available && (!modern || showModern);
      const mat = node.line.material as THREE.LineBasicMaterial;
      const undiscovered = node.spec.discoveryYear != null && year < node.spec.discoveryYear;
      mat.opacity = (modern ? 0.4 : 0.32) * (undiscovered ? 0.4 : 1);
    }
  }
}
