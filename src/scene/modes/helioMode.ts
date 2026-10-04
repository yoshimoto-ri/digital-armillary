import type { Engine } from '../engine';

/** 日心視角：上帝視角俯瞰太陽系，環繞原點（太陽）旋轉／縮放 */
export function applyHelioMode(engine: Engine): void {
  const { camera, controls } = engine;
  camera.fov = 45;
  // 直向窄螢幕（手機）水平視野窄，相機拉遠讓太陽系完整入鏡；橫向／桌面維持原值
  const k = camera.aspect < 0.8 ? 1.7 : 1;
  camera.position.set(0, 420 * k, 860 * k);
  camera.updateProjectionMatrix();
  controls.target.set(0, 0, 0);
  controls.minDistance = 30;
  controls.maxDistance = 3200;
  controls.rotateSpeed = 1;
  controls.enableZoom = true;
  controls.update();
}
