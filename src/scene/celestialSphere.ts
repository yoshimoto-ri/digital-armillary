import * as THREE from 'three';
import type { MansionsFile, MansionStarsFile } from '../data/types';
import { raDecToEqjUnit } from '../astro/frames';
import { directionToSphere, R_SPHERE } from './scale';
import { makeLabel } from './labels';

/**
 * 天球：二十八宿恆星（單一 Points，一次 draw call）、宿連線（單一 LineSegments）、
 * 宿名標籤（CSS2D，可點擊）。恆星視為無窮遠、固定於 J2000 方向（忽略自行）。
 */
export class CelestialSphere {
  readonly group = new THREE.Group();
  private readonly lines: THREE.LineSegments;
  private readonly labels: THREE.Group;

  constructor(
    mansionsFile: MansionsFile,
    starsFile: MansionStarsFile,
    onSelectMansion: (name: string) => void,
  ) {
    // --- 恆星 Points：星等 → 亮度（顏色）與均一點大小 ---
    const positions: number[] = [];
    const colors: number[] = [];
    const tmp = new THREE.Vector3();
    for (const asterism of Object.values(starsFile.byMansion)) {
      for (const s of asterism.stars) {
        directionToSphere(raDecToEqjUnit(s.raJ2000, s.decJ2000), R_SPHERE, tmp);
        positions.push(tmp.x, tmp.y, tmp.z);
        // 星等 0 → 1.0 亮度、星等 5.5 → 0.25 亮度
        const b = THREE.MathUtils.clamp(1 - (s.vmag / 5.5) * 0.75, 0.25, 1);
        colors.push(b, b, b * 0.92 + 0.08);
      }
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    starGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    const stars = new THREE.Points(
      starGeo,
      new THREE.PointsMaterial({ size: 3.2, sizeAttenuation: false, vertexColors: true }),
    );
    this.group.add(stars);

    // --- 宿連線：全部合併為單一 LineSegments ---
    const linePos: number[] = [];
    for (const asterism of Object.values(starsFile.byMansion)) {
      for (const [a, b] of asterism.lines) {
        const sa = asterism.stars[a];
        const sb = asterism.stars[b];
        directionToSphere(raDecToEqjUnit(sa.raJ2000, sa.decJ2000), R_SPHERE, tmp);
        linePos.push(tmp.x, tmp.y, tmp.z);
        directionToSphere(raDecToEqjUnit(sb.raJ2000, sb.decJ2000), R_SPHERE, tmp);
        linePos.push(tmp.x, tmp.y, tmp.z);
      }
    }
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePos, 3));
    this.lines = new THREE.LineSegments(
      lineGeo,
      new THREE.LineBasicMaterial({ color: 0x3a6a7a, transparent: true, opacity: 0.55 }),
    );
    this.group.add(this.lines);

    // --- 宿名標籤：置於距星方向、天球面稍外側 ---
    this.labels = new THREE.Group();
    for (const m of mansionsFile.mansions) {
      const label = makeLabel(`${m.name}宿`, {
        className: 'label-mansion',
        onClick: () => onSelectMansion(m.name),
      });
      label.position.copy(
        directionToSphere(raDecToEqjUnit(m.raJ2000, m.decJ2000), R_SPHERE * 1.02),
      );
      this.labels.add(label);
    }
    this.group.add(this.labels);
  }

  setLinesVisible(v: boolean): void {
    this.lines.visible = v;
  }

  setLabelsVisible(v: boolean): void {
    this.labels.visible = v;
  }
}
