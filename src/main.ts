import * as THREE from 'three';
import { store } from './state/store';
import { toAstroTime } from './astro/time';
import { Engine } from './scene/engine';
import { CelestialSphere } from './scene/celestialSphere';
import { Planets } from './scene/planets';
import { Orbits } from './scene/orbits';
import { injectStyles } from './ui/styles';
import { createControlBar } from './ui/controlBar';
import { createSidebar } from './ui/sidebar';
import { createNotice } from './ui/notice';
import mansionsJson from './data/mansions.json';
import mansionStarsJson from './data/mansionStars.json';
import type { MansionsFile, MansionStarsFile } from './data/types';

const mansionsFile = mansionsJson as unknown as MansionsFile;
const starsFile = mansionStarsJson as unknown as MansionStarsFile;

const sceneRoot = document.getElementById('scene-root')!;
const labelRoot = document.getElementById('label-root')!;
const uiRoot = document.getElementById('ui-root')!;

injectStyles();
const engine = new Engine(sceneRoot, labelRoot);

// --- 場景物件 ---
const sphere = new CelestialSphere(mansionsFile, starsFile, (name) =>
  store.set({ selection: { type: 'mansion', key: name } }),
);
const planets = new Planets((key) => store.set({ selection: { type: 'planet', key } }));
const orbits = new Orbits();
engine.scene.add(sphere.group, planets.group, orbits.group);

// --- UI ---
createControlBar(uiRoot);
createSidebar(uiRoot, mansionsFile);
createNotice(uiRoot);

// --- 狀態驅動重繪 ---
function refresh(): void {
  const s = store.get();
  const t = toAstroTime(s.time);
  const year = s.time.getUTCFullYear();
  const showModern = s.viewMode === 'helio' ? s.layers.modernPlanetsHelio : s.layers.modernPlanetsGeo;
  planets.update(t);
  orbits.update(t);
  planets.applyVisibility(showModern, year);
  orbits.applyVisibility(s.layers.orbits, showModern, year);
  sphere.setLinesVisible(s.layers.mansionLines);
  sphere.setLabelsVisible(s.layers.mansionLabels);
}
store.subscribe((_s, changed) => {
  if (changed.has('time') || changed.has('layers') || changed.has('viewMode')) refresh();
});
refresh();

// 開發期除錯掛鉤：預覽環境分頁隱藏時 rAF 停擺，可由 console 手動觸發渲染
if (import.meta.env.DEV) {
  (window as unknown as Record<string, unknown>).__armillary = {
    engine, planets, orbits, sphere, store, refresh,
    renderOnce: () => {
      engine.renderer.render(engine.scene, engine.camera);
      engine.labelRenderer.render(engine.scene, engine.camera);
    },
  };
}

// --- 點選行星（raycast） ---
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let downAt: [number, number] | null = null;
engine.renderer.domElement.addEventListener('pointerdown', (e) => {
  downAt = [e.clientX, e.clientY];
});
engine.renderer.domElement.addEventListener('pointerup', (e) => {
  // 拖曳旋轉不算點選
  if (!downAt || Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 5) return;
  pointer.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
  raycaster.setFromCamera(pointer, engine.camera);
  const hits = raycaster.intersectObjects(planets.getMeshes().filter((m) => m.visible), false);
  if (hits.length > 0) {
    store.set({ selection: { type: 'planet', key: hits[0].object.userData.planetKey as string } });
  }
});
