/** UI 全域樣式（一次注入；元件結構各自建立） */
import { MOBILE_QUERY } from './env';

export function injectStyles(): void {
  const css = `
  .label-mansion {
    color: #7fd0e8; font-size: 13px; text-shadow: 0 0 4px #000;
    user-select: none; white-space: nowrap;
  }
  .label-planet {
    color: #e8e2d0; font-size: 12px; text-shadow: 0 0 4px #000;
    user-select: none; white-space: nowrap;
  }
  .label-planet-modern { color: #9fc8e8; }
  .label-undiscovered { opacity: 0.45; }
  .label-undiscovered::after { content: var(--undiscovered, '（尚未發現）'); font-size: 10px; }
  .label-zodiac {
    color: #a894d8; font-size: 12px; text-shadow: 0 0 4px #000;
    user-select: none; white-space: nowrap; opacity: 0.85;
  }
  .label-equinox {
    color: #e8c860; font-size: 12px; text-shadow: 0 0 4px #000;
    user-select: none; white-space: nowrap;
  }
  .label-zodiac-compare {
    color: #d8a878; font-size: 11px; text-shadow: 0 0 4px #000;
    user-select: none; white-space: nowrap; opacity: 0.85;
  }
  .label-equinox-compare {
    color: #e8a860; font-size: 11px; text-shadow: 0 0 4px #000;
    user-select: none; white-space: nowrap;
  }
  .label-distar-compare {
    color: #f0906e; font-size: 11px; text-shadow: 0 0 4px #000;
    user-select: none; white-space: nowrap;
  }
  .label-comet {
    color: #b8e8e0; font-size: 11px; text-shadow: 0 0 4px #000;
    user-select: none; white-space: nowrap; opacity: 0.9;
  }

  .bottom-stack {
    position: absolute; left: 0; right: 0; bottom: 14px;
    display: flex; flex-direction: column; align-items: center; gap: 8px;
    pointer-events: none;
  }
  .bottom-stack > * { pointer-events: auto; }
  .control-bar {
    display: flex; gap: 14px; align-items: center; flex-wrap: wrap; justify-content: center;
    background: rgba(8, 12, 26, 0.82); border: 1px solid #223050; border-radius: 10px;
    padding: 8px 16px; backdrop-filter: blur(4px); max-width: min(96vw, 900px);
  }
  .control-bar label { display: inline-flex; align-items: center; gap: 4px; cursor: pointer; white-space: nowrap; }
  .control-bar input[type="checkbox"] { accent-color: #4a7ab8; }
  .control-bar input[type="number"] {
    background: #0c1224; color: #c8d2e8; border: 1px solid #2a3a5a; border-radius: 5px;
    padding: 3px 4px; font-family: inherit; font-size: 13px; width: 5.5em; color-scheme: dark;
  }
  .control-bar input[type="number"]:disabled { opacity: 0.4; }
  .control-bar input[type="datetime-local"] {
    background: #0c1224; color: #c8d2e8; border: 1px solid #2a3a5a; border-radius: 5px;
    padding: 3px 6px; font-family: inherit; font-size: 13px; color-scheme: dark;
  }
  .control-bar button {
    background: #1a2846; color: #c8d2e8; border: 1px solid #2a3a5a; border-radius: 5px;
    padding: 4px 12px; cursor: pointer; font-family: inherit; font-size: 13px;
  }
  .control-bar button:hover { background: #24365e; }
  .mode-switch { display: inline-flex; border: 1px solid #2a3a5a; border-radius: 6px; overflow: hidden; }
  .mode-switch button { border: none; border-radius: 0; background: #0c1224; }
  .mode-switch button.active { background: #3a5a96; color: #fff; }

  .timeline-bar {
    display: flex; gap: 10px; align-items: center;
    background: rgba(8, 12, 26, 0.82); border: 1px solid #223050; border-radius: 10px;
    padding: 6px 14px; backdrop-filter: blur(4px); width: min(92vw, 720px);
  }
  .timeline-bar button.play {
    background: #1a2846; color: #c8d2e8; border: 1px solid #2a3a5a; border-radius: 5px;
    padding: 4px 10px; cursor: pointer; font-family: inherit; font-size: 13px; white-space: nowrap;
  }
  .timeline-bar button.play:hover { background: #24365e; }
  .timeline-bar select {
    background: #0c1224; color: #c8d2e8; border: 1px solid #2a3a5a; border-radius: 5px;
    padding: 3px 4px; font-family: inherit; font-size: 12px;
  }
  .timeline-bar input[type="range"] { flex: 1; accent-color: #4a7ab8; min-width: 120px; }
  .timeline-bar .year-readout { font-size: 12px; color: #a8b6d0; white-space: nowrap; min-width: 7.5em; text-align: right; }

  .sidebar {
    position: absolute; top: 14px; right: 14px; width: 230px;
    background: rgba(8, 12, 26, 0.85); border: 1px solid #223050; border-radius: 10px;
    padding: 14px 16px; backdrop-filter: blur(4px); display: none;
  }
  .sidebar.open { display: block; }
  .sidebar h2 { font-size: 16px; margin-bottom: 8px; color: #e8e2d0; font-weight: 600; }
  .sidebar .row { display: flex; justify-content: space-between; padding: 3px 0; font-size: 13px; }
  .sidebar .row .k { color: #8a96b0; }
  .sidebar .retro { color: #ff8a70; font-weight: 600; }
  .sidebar .close {
    position: absolute; top: 8px; right: 10px; cursor: pointer; color: #8a96b0;
    background: none; border: none; font-size: 14px; font-family: inherit;
  }
  .sidebar .close:hover { color: #e8e2d0; }
  .sidebar .src { margin-top: 8px; font-size: 11px; color: #5a6680; line-height: 1.5; }

  /* 桌面：說明文字置於左側欄（語言鈕下方），固定寬度自動換行，中英文都不會壓到底部控制區 */
  .notice {
    position: absolute; left: 16px; top: 92px; width: 250px; font-size: 11px; color: #6a7690;
    line-height: 1.6; pointer-events: none; text-shadow: 0 0 3px #000;
    background: rgba(4, 6, 15, 0.6); border-radius: 8px; padding: 8px 10px;
  }
  .app-title {
    position: absolute; left: 16px; top: 12px; color: #a8b6d0; font-size: 15px;
    letter-spacing: 2px; pointer-events: none; text-shadow: 0 0 4px #000;
  }
  .app-title small { display: block; font-size: 10px; color: #5a6680; letter-spacing: 1px; margin-top: 2px; }

  /* ---- 桌面：新增元件的預設樣式（分組容器透明、手機專用鈕隱藏） ---- */
  .cb-main, .cb-layers { display: contents; }
  .cb-layers-btn, .info-btn, .dock-btn { display: none; }
  .lang-btn {
    position: absolute; left: 16px; top: 52px;
    background: rgba(8, 12, 26, 0.82); color: #a8b6d0; border: 1px solid #223050; border-radius: 6px;
    padding: 2px 10px; font-family: inherit; font-size: 12px; cursor: pointer;
  }
  .lang-btn:hover { background: #24365e; color: #e8e2d0; }

  /* ---- 手機版：全部限定在 MOBILE_QUERY 內，桌面寬度不套用 ---- */
  @media ${MOBILE_QUERY} {
    * { -webkit-tap-highlight-color: transparent; }
    .app-title { font-size: 14px; left: 12px; top: 10px; }
    .lang-btn { left: auto; right: 12px; top: 10px; min-height: 36px; min-width: 52px; font-size: 14px; }
    .info-btn {
      display: block; position: absolute; right: 12px; top: 52px; min-height: 36px; min-width: 52px;
      background: rgba(8, 12, 26, 0.82); color: #a8b6d0; border: 1px solid #223050; border-radius: 6px;
      font-family: inherit; font-size: 13px; padding: 0 10px;
    }
    .notice {
      display: none; position: fixed; left: 12px; right: 12px; top: 96px; max-width: none;
      background: rgba(8, 12, 26, 0.97); border: 1px solid #223050; border-radius: 10px;
      padding: 10px 12px; font-size: 12px; color: #8a96b0; line-height: 1.7;
    }
    .notice.show { display: block; }

    .bottom-stack { bottom: max(8px, env(safe-area-inset-bottom)); gap: 6px; padding: 0 8px; }
    .control-bar, .timeline-bar, .sidebar { background: rgba(8, 12, 26, 0.95); }
    body.sidebar-open .bottom-stack { display: none; }
    .dock-btn {
      display: block; align-self: flex-end; min-height: 34px; padding: 0 12px;
      background: rgba(8, 12, 26, 0.95); color: #a8b6d0; border: 1px solid #223050; border-radius: 8px;
      font-family: inherit; font-size: 13px;
    }
    .bottom-stack.collapsed > :not(.dock-btn) { display: none; }

    .control-bar {
      width: 100%; max-width: 100%; flex-direction: column; align-items: stretch;
      gap: 6px; padding: 8px; font-size: 14px;
    }
    .cb-main { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; align-items: center; }
    .cb-layers-btn { display: block; flex: 1 1 auto; min-height: 40px; }
    /* 收合時只留「視角切換｜現在｜圖層」一列；日期輸入與各圖層開關展開才出現 */
    .cb-main input[type="datetime-local"] { display: none; }
    .control-bar.expanded .cb-main input[type="datetime-local"] { display: block; order: 5; flex: 1 1 100%; }
    .cb-layers { display: none; }
    .control-bar.expanded .cb-layers {
      display: grid; grid-template-columns: 1fr 1fr; gap: 2px 10px;
      max-height: 34vh; overflow-y: auto; padding-top: 4px;
    }
    /* 未啟用的對照附屬欄位（年份／系統下拉）先收起，勾選對應開關後才出現 */
    .cb-layers input[type="number"]:disabled, .cb-layers select:disabled { display: none; }
    .control-bar label { min-height: 40px; gap: 8px; font-size: 14px; }
    .control-bar input[type="checkbox"] { width: 20px; height: 20px; }
    .control-bar input[type="number"], .control-bar select { min-height: 40px; font-size: 16px; }
    .control-bar input[type="datetime-local"] { min-height: 40px; font-size: 16px; }
    .control-bar button { min-height: 40px; font-size: 14px; }
    .mode-switch button { padding: 0 14px; }

    .timeline-bar { width: 100%; flex-wrap: wrap; gap: 6px 10px; padding: 6px 10px; }
    .timeline-bar button.play { min-height: 40px; font-size: 14px; }
    .timeline-bar select { min-height: 40px; font-size: 14px; }
    .timeline-bar .year-readout { order: 2; margin-left: auto; min-width: 0; font-size: 13px; }
    .timeline-bar input[type="range"] { order: 3; flex: 1 1 100%; min-width: 0; min-height: 28px; }

    .sidebar {
      position: fixed; left: 0; right: 0; bottom: 0; top: auto; width: auto;
      max-height: 46vh; overflow-y: auto; border-radius: 14px 14px 0 0;
      padding: 14px 16px calc(14px + env(safe-area-inset-bottom));
    }
    .sidebar h2 { font-size: 18px; padding-right: 36px; }
    .sidebar .row { font-size: 14px; gap: 12px; padding: 5px 0; }
    .sidebar .row span:last-child { text-align: right; }
    .sidebar .src { font-size: 12px; }
    .sidebar .close { top: 6px; right: 8px; font-size: 20px; padding: 8px 10px; }

    .label-mansion { font-size: 12px; padding: 6px; }
    .label-comet, .label-zodiac-compare, .label-equinox-compare, .label-distar-compare { font-size: 12px; }
  }

  /* ---- 手機橫持（矮螢幕）：全部壓成單列，圖層面板與側欄改為右側浮動面板 ---- */
  @media (max-height: 500px) and (pointer: coarse), (max-height: 500px) and (max-width: 720px) {
    .app-title { font-size: 13px; top: 6px; left: 10px; }
    .app-title small { display: none; }
    .lang-btn { top: 6px; right: 8px; min-height: 32px; min-width: 48px; font-size: 13px; }
    .info-btn { top: 6px; right: 64px; min-height: 32px; min-width: 52px; font-size: 12px; }
    .notice { top: 46px; }
    .bottom-stack { bottom: max(4px, env(safe-area-inset-bottom)); gap: 4px; }
    body.sidebar-open .bottom-stack { display: flex; right: 336px; }
    .dock-btn { min-height: 30px; font-size: 12px; }
    .control-bar { padding: 4px 8px; gap: 4px; }
    .cb-main { flex-wrap: nowrap; gap: 6px; }
    .cb-main input[type="datetime-local"] { display: block; flex: 0 1 220px; min-height: 34px; font-size: 14px; }
    .control-bar.expanded .cb-main input[type="datetime-local"] { order: 0; flex: 0 1 220px; }
    .control-bar button, .mode-switch button, .cb-layers-btn { min-height: 34px; font-size: 13px; }
    .cb-layers-btn { flex: 0 0 auto; padding: 0 14px; }
    .control-bar.expanded .cb-layers {
      position: fixed; right: 8px; bottom: 96px; width: 340px; max-height: calc(100vh - 110px);
      background: rgba(8, 12, 26, 0.97); border: 1px solid #223050; border-radius: 10px; padding: 8px 12px;
    }
    .control-bar label { min-height: 34px; font-size: 13px; }
    .timeline-bar { flex-wrap: nowrap; padding: 3px 10px; }
    .timeline-bar button.play, .timeline-bar select { min-height: 34px; font-size: 13px; }
    .timeline-bar input[type="range"] { order: 0; flex: 1 1 auto; min-height: 24px; }
    .timeline-bar .year-readout { order: 0; margin-left: 0; font-size: 12px; min-width: 6.5em; }
    .sidebar {
      left: auto; right: 8px; top: 8px; bottom: 8px; width: 320px; max-height: none;
      border-radius: 12px; padding: 12px 14px;
    }
  }
  `;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
}
