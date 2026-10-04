import * as THREE from 'three';
import type { DistarSystem, Mansion } from '../data/types';
import { eclJ2000ToEqj, starEclipticLonJ2000 } from '../astro/frames';
import { directionToSphere, R_OVERLAY } from './scale';
import { makeLabel } from './labels';
import { distarSysShort, mansionName, t } from '../i18n';

/** 基準（清）宿界刻線：J2000 黃緯 ±10° 短弧 */
const BASE_LAT_RANGE = 10;
/** 對照系統差異刻線：±14°，比基準長一截，一眼可分 */
const CMP_LAT_RANGE = 14;
const TICK_SAMPLES = 6;
/** 1 古度 = 360/365.25 度 */
const DU = 360 / 365.25;

/**
 * 宿界對照（ARCHITECTURE.md §7.9）：同屏繪製清《儀象考成》28 條宿界（青色，基準）
 * 與對照距星系統（漢《石氏》／明《崇禎曆書》）有差異之宿的宿界（橙紅色 + 標籤）。
 * 宿界綁定恆星——以距星的 **J2000 平黃道黃經** 劃線，幾何固定於 EQJ、不隨時間軸變動；
 * 播放歲差時可見十二宮宮界漂移而宿界不動，兩種對照（歲差 vs 距星系統）互補。
 * 幾何只在對照系統切換時重建。
 */
export class DistarCompare {
  readonly group = new THREE.Group();
  private readonly baseTicks: THREE.LineSegments;
  private readonly cmpTicks: THREE.LineSegments;
  private cmpLabels: ReturnType<typeof makeLabel>[] = [];
  private builtSystemId: string | null = null;

  constructor() {
    this.baseTicks = new THREE.LineSegments(
      new THREE.BufferGeometry(),
      new THREE.LineBasicMaterial({ color: 0x4fa8a0, transparent: true, opacity: 0.55 }),
    );
    this.cmpTicks = new THREE.LineSegments(
      new THREE.BufferGeometry(),
      new THREE.LineBasicMaterial({ color: 0xe06a50, transparent: true, opacity: 0.85 }),
    );
    this.group.add(this.baseTicks, this.cmpTicks);
    this.group.visible = false;
  }

  /** 依基準宿表 + 對照系統建立幾何（同系統重複呼叫為 no-op） */
  build(baseMansions: Mansion[], sys: DistarSystem): void {
    if (this.builtSystemId === sys.id) return;
    this.builtSystemId = sys.id;

    // 基準（清）：28 條宿界
    this.baseTicks.geometry.dispose();
    this.baseTicks.geometry = ticksGeometry(
      baseMansions.map((m) => starEclipticLonJ2000(m.raJ2000, m.decJ2000)),
      BASE_LAT_RANGE,
    );

    // 對照系統：僅繪與基準不同的宿界，附標籤（含與基準的差距古度）
    for (const l of this.cmpLabels) this.group.remove(l);
    this.cmpLabels = [];
    const diffs = sys.overrides.filter((o) => {
      const base = baseMansions.find((m) => m.name === o.mansionName);
      return base != null && base.hip !== o.hip;
    });
    this.cmpTicks.geometry.dispose();
    this.cmpTicks.geometry = ticksGeometry(
      diffs.map((o) => starEclipticLonJ2000(o.raJ2000, o.decJ2000)),
      CMP_LAT_RANGE,
    );
    const tmp = new THREE.Vector3();
    const sysShort = distarSysShort(sys); // 「漢」「明」／Han／Ming
    for (const o of diffs) {
      const base = baseMansions.find((m) => m.name === o.mansionName)!;
      const lon = starEclipticLonJ2000(o.raJ2000, o.decJ2000);
      const baseLon = starEclipticLonJ2000(base.raJ2000, base.decJ2000);
      let d = (lon - baseLon) / DU;
      if (d > 180 / DU) d -= 360 / DU;
      if (d < -180 / DU) d += 360 / DU;
      const uncertain = sys.uncertain?.includes(o.mansionName) ?? false;
      const text = t('distarLabel', {
        mansion: mansionName(o.mansionName),
        sys: sysShort,
        uncertain: uncertain ? t('uncertainShort') : '',
        d: `${d >= 0 ? '+' : ''}${d.toFixed(1)}`,
      });
      const label = makeLabel(text, { className: 'label-distar-compare' });
      directionToSphere(eclJ2000ToEqj(lon, CMP_LAT_RANGE + 2.5), R_OVERLAY, tmp);
      label.position.copy(tmp);
      this.cmpLabels.push(label);
      this.group.add(label);
    }
  }

  /** 語言切換：強制下次 build 重建標籤文字 */
  invalidate(): void {
    this.builtSystemId = null;
  }

  setVisible(v: boolean): void {
    this.group.visible = v;
  }
}

/** 一組恆星系黃經 → 黃緯 ±latRange 的短弧線段幾何 */
function ticksGeometry(lons: number[], latRange: number): THREE.BufferGeometry {
  const geo = new THREE.BufferGeometry();
  const arr = new Float32Array(lons.length * TICK_SAMPLES * 2 * 3);
  const tmp = new THREE.Vector3();
  let vi = 0;
  for (const lon of lons) {
    for (let s = 0; s < TICK_SAMPLES; s++) {
      const b0 = -latRange + (s / TICK_SAMPLES) * latRange * 2;
      const b1 = -latRange + ((s + 1) / TICK_SAMPLES) * latRange * 2;
      directionToSphere(eclJ2000ToEqj(lon, b0), R_OVERLAY, tmp);
      arr[vi++] = tmp.x; arr[vi++] = tmp.y; arr[vi++] = tmp.z;
      directionToSphere(eclJ2000ToEqj(lon, b1), R_OVERLAY, tmp);
      arr[vi++] = tmp.x; arr[vi++] = tmp.y; arr[vi++] = tmp.z;
    }
  }
  geo.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3));
  geo.computeBoundingSphere();
  return geo;
}
