import { getLang, onLang, setLang, t } from '../i18n';

/** 常駐聲明（比例尺、精度）、標題、語言切換、手機說明鈕 */
export function createNotice(root: HTMLElement): void {
  const title = document.createElement('div');
  title.className = 'app-title';
  // index.html 的 #ui-root > * { pointer-events: auto }（ID 選擇器）會蓋過
  // class 樣式的 none，改用 inline style 確保不攔截場景操作
  title.style.pointerEvents = 'none';
  onLang(() => {
    title.innerHTML = `${t('appTitle')}<small>DIGITAL ARMILLARY SPHERE</small>`;
  });
  root.appendChild(title);

  // 語言切換（桌面／手機共用，位於標題下方）
  const langBtn = document.createElement('button');
  langBtn.className = 'lang-btn';
  onLang(() => {
    langBtn.textContent = t('langBtn');
    langBtn.title = t('langBtnTitle');
  });
  langBtn.addEventListener('click', () => setLang(getLang() === 'zh' ? 'en' : 'zh'));
  root.appendChild(langBtn);

  const notice = document.createElement('div');
  notice.className = 'notice';
  notice.style.pointerEvents = 'none';
  onLang(() => {
    notice.innerHTML = [t('notice1'), t('notice2'), t('notice3'), t('notice4')].join('<br>');
  });
  root.appendChild(notice);

  // 手機專用：說明聲明預設收起，點「ⓘ」才展開（桌面 CSS 隱藏此鈕）
  const infoBtn = document.createElement('button');
  infoBtn.className = 'info-btn';
  onLang(() => {
    infoBtn.textContent = t('infoBtn');
  });
  infoBtn.addEventListener('click', () => notice.classList.toggle('show'));
  root.appendChild(infoBtn);
}
