# 數位渾象（Digital Armillary Sphere）

以三維視覺化呈現太陽系天體與中國二十八宿、黃道十二宮位置關係的純前端靜態網站。
概念源自中國古代「渾象」，並以數位方式同時提供上帝視角（日心）與古代觀測者視角（地心）。

架構設計見 [ARCHITECTURE.md](ARCHITECTURE.md)。

## 開發

```bash
npm install
npm run dev            # 開發伺服器（http://localhost:5173）
npm run build          # 產出靜態檔至 dist/
npm run preview        # 預覽 build 結果
npm run verify:stage1  # 階段一驗收：木星黃經對照星曆
```

## 技術棧

- Vite + TypeScript（strict）
- Three.js（3D 渲染）
- astronomy-engine（星曆計算，VSOP87 基礎，含歲差；全案唯一天文計算來源）

## 資料來源

- 距星認定：清《儀象考成》距星系統（參考潘鼐《中國恒星觀測史》、
  伊世同《中西對照恒星圖表》、維基百科「二十八宿」條目）。
  注意：奎宿距星＝奎宿二（ζ And）、觜宿距星＝觜宿二（φ¹ Ori）、
  參宿距星＝參宿三（δ Ori），非各宿第一星。
- 恆星座標／星等／HIP 編號：[HYG Database v4.1](https://github.com/astronexus/HYG-Database)
  （Hipparcos 為主之合成星表，J2000，CC BY-SA 4.0）
- 中文星名：[Stellarium](https://github.com/Stellarium/stellarium) chinese skyculture
  （伊世同系統），簡轉繁
- 資料由 `npm run gen:stars` 重新產生（需先下載上述兩檔，見腳本內說明）

## 已知限制

- 恆星自行（proper motion）第一版忽略，恆星固定於 J2000 位置
- astronomy-engine 高精度範圍為 1700–2200 年，範圍外精度遞減（UI 已註明）
- 行星距離經 √ 比例壓縮（非等比），行星大小為示意
- 冥王星使用引擎專用模型，支援年代範圍較行星窄，超出時隱藏並註記

## 部署（靜態主機，如 Hostinger 子網域）

1. `npm run build` — 產出至 `dist/`（全部為相對路徑，`base: './'`）
2. 將 `dist/` 內全部檔案上傳至子網域的網站根目錄
   （Hostinger：hPanel → 檔案管理員 → 該子網域的 `public_html/`）
3. 完成。不需任何伺服器端設定；純靜態檔案，任何主機皆可。

## 里程碑

- [x] 階段一：日心立體星圖（靜態時刻）
- [ ] 階段二：地心天球視角（渾象模式）
- [ ] 階段三：時間軸與歲差（±3000 年）、哈雷彗星
