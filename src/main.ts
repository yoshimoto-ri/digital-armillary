import * as THREE from 'three';
import { store } from './state/store';
import { clampDate, toAstroTime } from './astro/time';
import { Engine } from './scene/engine';
import { CelestialSphere } from './scene/celestialSphere';
import { Planets } from './scene/planets';
import { Orbits } from './scene/orbits';
import { Comets } from './scene/comets';
import { Overlays } from './scene/overlays';
import { applyHelioMode } from './scene/modes/helioMode';
import { applyGeoMode } from './scene/modes/geoMode';
import { injectStyles } from './ui/styles';
import { createControlBar } from './ui/controlBar';
import { createTimeline } from './ui/timeline';
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
const comets = new Comets((key) => store.set({ selection: { type: 'comet', key } }));
const overlays = new Overlays();
engine.scene.add(sphere.group, planets.group, orbits.group, comets.group, overlays.group);

// --- UI ---
// 底部直向堆疊：時間軸列在上、控制列在下，高度自適應不互相遮擋
const bottomStack = document.createElement('div');
bottomStack.className = 'bottom-stack';
uiRoot.appendChild(bottomStack);
createTimeline(bottomStack);
createControlBar(bottomStack);
createSidebar(uiRoot, mansionsFile);
createNotice(uiRoot);

// --- 狀態驅動重繪 ---
function refresh(): void {
  const s = store.get();
  const t = toAstroTime(s.time);
  const year = s.time.getUTCFullYear();
  const mode = s.viewMode;
  const showModern = mode === 'helio' ? s.layers.modernPlanetsHelio : s.layers.modernPlanetsGeo;
  planets.update(t, mode);
  planets.applyVisibility(showModern, year, mode);
  orbits.update(t);
  // 軌道線為 √ 壓縮之日心幾何，渾象視角一律隱藏
  orbits.applyVisibility(s.layers.orbits && mode === 'helio', showModern, year);
  comets.update(t, mode);
  comets.applyVisibility(s.layers.comets, mode);
  overlays.update(t);
  overlays.applyVisibility(s.layers);
  sphere.setLinesVisible(s.layers.mansionLines);
  sphere.setLabelsVisible(s.layers.mansionLabels);
}

function applyViewMode(): void {
  if (store.get().viewMode === 'geo') applyGeoMode(engine);
  else applyHelioMode(engine);
}

store.subscribe((_s, changed) => {
  if (changed.has('viewMode')) applyViewMode();
  if (changed.has('time') || changed.has('layers') || changed.has('viewMode')) refresh();
});
applyViewMode();
refresh();

// --- 時間軸播放：rAF 中推進模擬時間（ARCHITECTURE.md §7.7） ---
let lastFrameMs = performance.now();
engine.onFrame = () => {
  const now = performance.now();
  const dt = Math.min((now - lastFrameMs) / 1000, 0.1); // 分頁切回時避免大跳
  lastFrameMs = now;
  const s = store.get();
  if (!s.playing) return;
  const next = new Date(s.time.getTime() + dt * s.playSpeed * 86400_000);
  const clamped = clampDate(next);
  if (clamped.getTime() !== next.getTime()) {
    store.set({ time: clamped, playing: false }); // 到達時間軸端點即停
  } else {
    store.set({ time: clamped });
  }
};

// 開發期除錯掛鉤：預覽環境分頁隱藏時 rAF 停擺，可由 console 手動觸發渲染
if (import.meta.env.DEV) {
  (window as unknown as Record<string, unknown>).__armillary = {
    engine, planets, orbits, comets, overlays, sphere, store, refresh,
    renderOnce: () => {
      engine.renderer.render(engine.scene, engine.camera);
      engine.labelRenderer.render(engine.scene, engine.camera);
    },
  };
}

// --- 點選行星／彗星（raycast） ---
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
  const targets = [...planets.getMeshes(), ...comets.getMeshes()].filter((m) => m.visible);
  const hits = raycaster.intersectObjects(targets, false);
  if (hits.length > 0) {
    const ud = hits[0].object.userData;
    if (ud.planetKey) store.set({ selection: { type: 'planet', key: ud.planetKey as string } });
    else if (ud.cometKey) store.set({ selection: { type: 'comet', key: ud.cometKey as string } });
  }
});
