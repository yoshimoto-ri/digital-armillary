import * as THREE from 'three';
import { AstroTime } from 'astronomy-engine';
import type { ViewMode } from '../state/store';
import { COMETS, CometSpec } from '../data/comets';
import { cometGeoVec, cometHelioVec, sampleCometOrbit } from '../astro/comets';
import { compressToScene, directionToSphere, R_GEO_BODIES } from './scale';
import { makeLabel } from './labels';

const ORBIT_SAMPLES = 512;
/** 渾象視角彗星標記半徑（場景單位） */
const GEO_RADIUS = 8;

interface CometNode {
  spec: CometSpec;
  mesh: THREE.Mesh;
  orbit: THREE.Line;
  label: ReturnType<typeof makeLabel>;
  available: boolean;
}

/**
 * 彗星：本體標記 + 軌道線。
 * 軌道為二體克卜勒解，在慣性系中固定，逐點取樣真實位置後 √ 壓縮，只算一次
 * （ARCHITECTURE.md §7.4、§7.5）。高離心率下以偏近點角均勻取樣，近日點段不失真。
 */
export class Comets {
  readonly group = new THREE.Group();
  private readonly nodes = new Map<string, CometNode>();
  private orbitsComputed = false;

  constructor(onSelect: (key: string) => void) {
    for (const spec of COMETS) {
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(1.6, 16, 12),
        new THREE.MeshBasicMaterial({ color: spec.color }),
      );
      mesh.userData.cometKey = spec.key;
      const label = makeLabel(spec.nameZh, {
        className: 'label-comet',
        onClick: () => onSelect(spec.key),
      });
      mesh.add(label);

      const geo = new THREE.BufferGeometry();
      geo.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(new Float32Array((ORBIT_SAMPLES + 1) * 3), 3),
      );
      const orbit = new THREE.Line(
        geo,
        new THREE.LineDashedMaterial({
          color: spec.color,
          transparent: true,
          opacity: 0.35,
          dashSize: 2.5,
          gapSize: 4,
        }),
      );

      this.group.add(mesh, orbit);
      this.nodes.set(spec.key, { spec, mesh, orbit, label, available: true });
    }
  }

  update(time: AstroTime, mode: ViewMode): void {
    // 軌道線（慣性系固定）只算一次
    if (!this.orbitsComputed) {
      this.orbitsComputed = true;
      const tmp = new THREE.Vector3();
      for (const node of this.nodes.values()) {
        const pts = sampleCometOrbit(node.spec, ORBIT_SAMPLES, time);
        const attr = node.orbit.geometry.getAttribute('position') as THREE.BufferAttribute;
        for (let i = 0; i < pts.length; i++) {
          compressToScene(pts[i], tmp);
          attr.setXYZ(i, tmp.x, tmp.y, tmp.z);
        }
        attr.needsUpdate = true;
        node.orbit.geometry.computeBoundingSphere();
        node.orbit.computeLineDistances(); // 虛線材質需要
      }
    }

    for (const node of this.nodes.values()) {
      if (mode === 'geo') {
        const gv = cometGeoVec(node.spec, time);
        if (!gv) {
          node.available = false;
          continue;
        }
        node.available = true;
        directionToSphere(gv, R_GEO_BODIES, node.mesh.position);
      } else {
        node.available = true;
        compressToScene(cometHelioVec(node.spec, time), node.mesh.position);
      }
    }
  }

  /** 圖層開關與視角尺寸收斂。軌道線僅日心視角有意義（√ 壓縮之日心幾何）。 */
  applyVisibility(show: boolean, mode: ViewMode): void {
    for (const node of this.nodes.values()) {
      node.mesh.visible = show && node.available;
      node.orbit.visible = show && mode === 'helio';
      node.mesh.scale.setScalar(mode === 'geo' ? GEO_RADIUS / 1.6 : 1);
    }
  }

  getMeshes(): THREE.Mesh[] {
    return [...this.nodes.values()].map((n) => n.mesh);
  }
}
