/** 常駐聲明（比例尺、精度）與標題 */
export function createNotice(root: HTMLElement): void {
  const title = document.createElement('div');
  title.className = 'app-title';
  // index.html 的 #ui-root > * { pointer-events: auto }（ID 選擇器）會蓋過
  // class 樣式的 none，改用 inline style 確保不攔截場景操作
  title.style.pointerEvents = 'none';
  title.innerHTML = '數位渾象<small>DIGITAL ARMILLARY SPHERE</small>';
  root.appendChild(title);

  const notice = document.createElement('div');
  notice.className = 'notice';
  notice.style.pointerEvents = 'none';
  notice.innerHTML =
    '行星距離經 √ 比例壓縮（非等比）；行星大小為示意。<br>' +
    '星曆：astronomy-engine（高精度範圍 1700–2200 年，範圍外為推算值）。<br>' +
    '彗星為二體克卜勒推算（未含攝動），離曆元越遠誤差越大。<br>' +
    '逆行標示僅於渾象視角——逆行是從地球看的視運動現象，日心視角中行星皆順行。';
  root.appendChild(notice);
}
