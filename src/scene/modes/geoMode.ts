import type { Engine } from '../engine';

/**
 * 渾象（地心）視角：觀測者位於天球中心向外看天球內面。
 * 相機貼在原點旁極小偏移處、目標為原點——視線方向 ≈ −位置方向，
 * 拖曳改變的是視線方向（環繞半徑鎖定 1 單位，對 1200 單位天球視差可忽略）。
 * rotateSpeed 取負值，拖曳手感為「抓著天空移動」。
 */
export function applyGeoMode(engine: Engine): void {
  const { camera, controls } = engine;
  camera.fov = 60;
  // 初始視線朝向 −position 方向：朝春分點附近（EQJ +x → 場景 +x）
  camera.position.set(-1, -0.15, 0);
  camera.updateProjectionMatrix();
  controls.target.set(0, 0, 0);
  controls.minDistance = 1;
  controls.maxDistance = 1;
  controls.rotateSpeed = -0.35;
  controls.enableZoom = false;
  controls.update();
}
