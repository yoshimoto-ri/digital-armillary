import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

export interface LabelOptions {
  className: string;
  /** 提供時標籤可點擊 */
  onClick?: () => void;
}

/** 建立 CSS2D 文字標籤（中文以 DOM 渲染，品質好且不吃 GPU 字型圖集） */
export function makeLabel(text: string, opts: LabelOptions): CSS2DObject {
  const el = document.createElement('div');
  el.textContent = text;
  el.className = opts.className;
  if (opts.onClick) {
    el.style.pointerEvents = 'auto';
    el.style.cursor = 'pointer';
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      opts.onClick!();
    });
  }
  const obj = new CSS2DObject(el);
  obj.center.set(0.5, 1.1); // 錨點在文字下緣，標籤浮在目標上方
  return obj;
}
