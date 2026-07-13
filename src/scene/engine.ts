import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';

/** renderer / camera / 控制器 / 渲染迴圈（ARCHITECTURE.md §8） */
export class Engine {
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  readonly renderer: THREE.WebGLRenderer;
  readonly labelRenderer: CSS2DRenderer;
  readonly controls: OrbitControls;
  /** 每幀回呼（駐留動畫用；位置更新走 store 訂閱，不在這裡） */
  onFrame: (() => void) | null = null;

  constructor(sceneRoot: HTMLElement, labelRoot: HTMLElement) {
    this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 10000);
    this.camera.position.set(0, 420, 860);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    sceneRoot.appendChild(this.renderer.domElement);

    this.labelRenderer = new CSS2DRenderer({ element: labelRoot });

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 30;
    this.controls.maxDistance = 3200;

    this.resize();
    window.addEventListener('resize', () => this.resize());

    const loop = () => {
      requestAnimationFrame(loop);
      this.controls.update();
      this.onFrame?.();
      this.renderer.render(this.scene, this.camera);
      this.labelRenderer.render(this.scene, this.camera);
    };
    loop();
  }

  private resize(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.labelRenderer.setSize(w, h);
  }
}
