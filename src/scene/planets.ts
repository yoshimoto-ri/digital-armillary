import * as THREE from 'three';
import { AstroTime, Body } from 'astronomy-engine';
import type { ViewMode } from '../state/store';
import { ALL_PLANETS, HAS_RETROGRADE, PlanetSpec } from '../data/planets';
import { geoVec, helioVec } from '../astro/ephemeris';
import { motionState } from '../astro/retrograde';
import { compressToScene, directionToSphere, eqjToScene, R_GEO_BODIES } from './scale';
import { makeLabel } from './labels';
import { planetLabelText, t } from '../i18n';

/** 月球在日心視角中的固定示意偏移量（場景單位）——方向真實、距離示意 */
const MOON_OFFSET_UNITS = 9;

/** 逆行光暈直徑相對行星本體直徑的倍數 */
const GLOW_SCALE = 3.8;

/** 逆行光暈貼圖（白色徑向漸層，各行星以材質 color 染成同色系）——全部 sprite 共用 */
function makeGlowTexture(): THREE.Texture {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,0.75)');
  g.addColorStop(0.35, 'rgba(255,255,255,0.30)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

interface PlanetNode {
  spec: PlanetSpec;
  mesh: THREE.Mesh;
  label: ReturnType<typeof makeLabel>;
  /** 標籤原始文字；逆行時加註「·逆」後還原用 */
  baseLabelText: string;
  /** 逆行光暈（僅渾象視角逆行期間顯示） */
  glow: THREE.Sprite | null;
  /** 引擎範圍外（如冥王星遠古時刻）為 false */
  available: boolean;
}

/** 行星（七曜 + 三王星）本體與標籤；位置更新（日心視角） */
export class Planets {
  readonly group = new THREE.Group();
  private readonly nodes = new Map<string, PlanetNode>();

  constructor(onSelect: (key: string) => void) {
    const glowTexture = makeGlowTexture();
    for (const spec of ALL_PLANETS) {
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(spec.renderRadius, 24, 16),
        new THREE.MeshBasicMaterial({ color: spec.color, transparent: true }),
      );
      mesh.userData.planetKey = spec.key;
      const labelText = planetLabelText(spec);
      const label = makeLabel(labelText, {
        className: spec.group === 'modern' ? 'label-planet label-planet-modern' : 'label-planet',
        onClick: () => onSelect(spec.key),
      });
      mesh.add(label);

      // 逆行光暈：同色系柔光 sprite，掛在 mesh 下（隨渾象視角的 mesh scale 等比放大）
      let glow: THREE.Sprite | null = null;
      if (HAS_RETROGRADE.has(spec.key)) {
        glow = new THREE.Sprite(
          new THREE.SpriteMaterial({
            map: glowTexture,
            color: spec.color,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
          }),
        );
        glow.scale.setScalar(spec.renderRadius * 2 * GLOW_SCALE);
        glow.visible = false;
        mesh.add(glow);
      }

      this.group.add(mesh);
      this.nodes.set(spec.key, { spec, mesh, label, baseLabelText: labelText, glow, available: true });
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

  /**
   * 逆行標示（僅渾象視角——逆行是地心視覺現象，日心視角中行星皆順行，一律關閉）。
   * 偵測：t±0.5 日地心視黃經中央差分（astro/retrograde.ts，含跨 0°/360° 最短角距
   * 處理），黃經減少即逆行；暫停時同樣可判定，不依賴播放的前後幀。
   * 播放速度分級：暫停或 ≤1 天/秒 → 光暈＋標籤「·逆」；快轉 → 只留標籤「·逆」。
   */
  applyRetrograde(time: AstroTime, mode: ViewMode, playing: boolean, playSpeed: number): void {
    const inGeo = mode === 'geo';
    const showGlow = !playing || playSpeed <= 1;
    for (const node of this.nodes.values()) {
      const { spec, mesh, glow, label } = node;
      if (!HAS_RETROGRADE.has(spec.key)) continue;
      const retro =
        inGeo && node.available && mesh.visible && motionState(spec.body, time) === 'retrograde';
      if (glow) glow.visible = retro && showGlow;
      const text = retro ? `${node.baseLabelText}${t('retroSuffix')}` : node.baseLabelText;
      if (label.element.textContent !== text) label.element.textContent = text;
    }
  }

  /** 語言切換：重算標籤文字（逆行後綴由 applyRetrograde 於下一次 refresh 補上） */
  relabel(): void {
    for (const node of this.nodes.values()) {
      node.baseLabelText = planetLabelText(node.spec);
      node.label.element.textContent = node.baseLabelText;
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
