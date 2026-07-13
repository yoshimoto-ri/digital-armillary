import * as THREE from 'three';
import { AstroTime, Body } from 'astronomy-engine';
import type { ViewMode } from '../state/store';
import { ALL_PLANETS, PlanetSpec } from '../data/planets';
import { geoVec, helioVec } from '../astro/ephemeris';
import { compressToScene, directionToSphere, eqjToScene, R_GEO_BODIES } from './scale';
import { makeLabel } from './labels';

/** 月球在日心視角中的固定示意偏移量（場景單位）——方向真實、距離示意 */
const MOON_OFFSET_UNITS = 9;

interface PlanetNode {
  spec: PlanetSpec;
  mesh: THREE.Mesh;
  label: ReturnType<typeof makeLabel>;
  /** 引擎範圍外（如冥王星遠古時刻）為 false */
  available: boolean;
}

/** 行星（七曜 + 三王星）本體與標籤；位置更新（日心視角） */
export class Planets {
  readonly group = new THREE.Group();
  private readonly nodes = new Map<string, PlanetNode>();

  constructor(onSelect: (key: string) => void) {
    for (const spec of ALL_PLANETS) {
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(spec.renderRadius, 24, 16),
        new THREE.MeshBasicMaterial({ color: spec.color, transparent: true }),
      );
      mesh.userData.planetKey = spec.key;
      const labelText =
        spec.discoveryYear != null ? `${spec.nameZh}（${spec.discoveryYear} 年發現）` : spec.nameZh;
      const label = makeLabel(labelText, {
        className: spec.group === 'modern' ? 'label-planet label-planet-modern' : 'label-planet',
        onClick: () => onSelect(spec.key),
      });
      mesh.add(label);
      this.group.add(mesh);
      this.nodes.set(spec.key, { spec, mesh, label, available: true });
    }
  }

  /**
   * 依時刻更新所有行星位置。
   * 日心視角：HelioVector → √ 壓縮；渾象視角：GeoVector 方向投影至天球面。
   */
  update(time: AstroTime, mode: ViewMode): void {
    for (const node of this.nodes.values()) {
      const { spec, mesh } = node;

      if (mode === 'geo') {
        // 地球是觀測點本身，渾象視角不顯示
        if (spec.body === Body.Earth) {
          node.available = false;
          mesh.visible = false;
          continue;
        }
        const gv = geoVec(spec.body, time);
        if (!gv) {
          node.available = false;
          mesh.visible = false;
          continue;
        }
        node.available = true;
        directionToSphere(gv, R_GEO_BODIES, mesh.position);
        continue;
      }

      if (spec.body === Body.Sun) {
        mesh.position.set(0, 0, 0);
        continue;
      }
      if (spec.body === Body.Moon) {
        // 月球：貼著地球，方向取真實地心向量、距離示意。
        // 地球位置直接向引擎取值計算，不讀地球 mesh（避免依賴 Map 迭代順序）。
        const gv = geoVec(Body.Moon, time);
        const ev = helioVec(Body.Earth, time);
        if (!gv || !ev) {
          node.available = false;
          mesh.visible = false;
          continue;
        }
        const dir = eqjToScene(gv).normalize().multiplyScalar(MOON_OFFSET_UNITS);
        compressToScene(ev, mesh.position).add(dir);
        node.available = true;
        continue;
      }
      const hv = helioVec(spec.body, time);
      if (!hv) {
        node.available = false;
        mesh.visible = false;
        continue;
      }
      node.available = true;
      compressToScene(hv, mesh.position);
    }
  }

  /** 圖層開關、發現年淡化、視角尺寸（visible/opacity/scale 統一在此收斂） */
  applyVisibility(showModern: boolean, year: number, mode: ViewMode): void {
    for (const node of this.nodes.values()) {
      const { spec, mesh } = node;
      const layerOn = spec.group !== 'modern' || showModern;
      const geoHidden = mode === 'geo' && spec.geoRenderRadius === 0;
      mesh.visible = layerOn && node.available && !geoHidden;
      // 渾象視角天體遠在天球面（~1100 單位外），以 scale 放大到可視大小
      const scale = mode === 'geo' ? spec.geoRenderRadius / spec.renderRadius : 1;
      mesh.scale.setScalar(scale);
      const mat = mesh.material as THREE.MeshBasicMaterial;
      const undiscovered = spec.discoveryYear != null && year < spec.discoveryYear;
      mat.opacity = undiscovered ? 0.3 : 1;
      node.label.element.classList.toggle('label-undiscovered', undiscovered);
    }
  }

  getMeshes(): THREE.Mesh[] {
    return [...this.nodes.values()].map((n) => n.mesh);
  }

  getPosition(key: string): THREE.Vector3 | null {
    const n = this.nodes.get(key);
    return n && n.available ? n.mesh.position : null;
  }
}
