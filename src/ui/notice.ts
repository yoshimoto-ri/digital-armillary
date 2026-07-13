/** 常駐聲明（比例尺、精度）與標題 */
export function createNotice(root: HTMLElement): void {
  const title = document.createElement('div');
  title.className = 'app-title';
  title.innerHTML = '數位渾象<small>DIGITAL ARMILLARY SPHERE</small>';
  root.appendChild(title);

  const notice = document.createElement('div');
  notice.className = 'notice';
  notice.innerHTML =
    '行星距離經 √ 比例壓縮（非等比）；行星大小為示意。<br>' +
    '星曆：astronomy-engine（高精度範圍 1700–2200 年，範圍外為推算值）。';
  root.appendChild(notice);
}
