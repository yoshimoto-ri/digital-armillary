import distarJson from './distarSystems.json';
import type { DistarSystem, DistarSystemId, DistarSystemsFile, Mansion } from './types';

/** 三距星系統表（清＝基準、漢、明）。詳細考證見 distarSystems.json 的 source/finding。 */
export const DISTAR_FILE = distarJson as unknown as DistarSystemsFile;

export function distarSystemById(id: DistarSystemId): DistarSystem {
  const sys = DISTAR_FILE.systems.find((s) => s.id === id);
  if (!sys) throw new Error(`未知距星系統：${id}`);
  return sys;
}

/**
 * 把距星系統的覆寫套用到基準宿表，回傳新陣列（不改動基準）。
 * 清系統無覆寫，回傳即基準本身的複本。
 */
export function applyDistarSystem(base: Mansion[], sys: DistarSystem): Mansion[] {
  if (sys.overrides.length === 0) return base.slice();
  const byName = new Map(sys.overrides.map((o) => [o.mansionName, o]));
  return base.map((m) => {
    const o = byName.get(m.name);
    if (!o) return m;
    return {
      ...m,
      detStarName: o.detStarName,
      westernName: o.westernName,
      hip: o.hip,
      raJ2000: o.raJ2000,
      decJ2000: o.decJ2000,
      vmag: o.vmag,
    };
  });
}

/** 指定宿在指定系統的距星覆寫（無覆寫＝與清基準相同，回傳 undefined） */
export function distarOverrideOf(sys: DistarSystem, mansionName: string) {
  return sys.overrides.find((o) => o.mansionName === mansionName);
}
