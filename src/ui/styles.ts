/** UI 全域樣式（一次注入；元件結構各自建立） */
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
  .label-undiscovered::after { content: '（尚未發現）'; font-size: 10px; }
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

  .notice {
    position: absolute; left: 14px; bottom: 14px; font-size: 11px; color: #5a6680;
    line-height: 1.6; pointer-events: none; text-shadow: 0 0 3px #000;
  }
  .app-title {
    position: absolute; left: 16px; top: 12px; color: #a8b6d0; font-size: 15px;
    letter-spacing: 2px; pointer-events: none; text-shadow: 0 0 4px #000;
  }
  .app-title small { display: block; font-size: 10px; color: #5a6680; letter-spacing: 1px; margin-top: 2px; }

  @media (max-width: 640px) {
    .sidebar { width: auto; left: 14px; right: 14px; top: auto; bottom: 130px; }
    .control-bar { gap: 8px; font-size: 12px; padding: 6px 10px; }
  }
  `;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
}
