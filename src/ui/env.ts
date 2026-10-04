/**
 * 手機版版面判斷。僅小螢幕（或橫持手機）才啟用手機版樣式；
 * 桌面寬度完全不受影響。CSS 與 JS 共用同一條查詢字串，避免兩邊判斷不一致。
 */
export const MOBILE_QUERY = '(max-width: 720px), (max-height: 500px) and (pointer: coarse)';

export const isMobileLayout = (): boolean => window.matchMedia(MOBILE_QUERY).matches;
