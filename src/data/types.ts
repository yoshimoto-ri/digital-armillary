/** 靜態 JSON 資料的型別定義（對應 ARCHITECTURE.md §6） */

/** 二十八宿距星（mansions.json 單筆） */
export interface Mansion {
  id: number;
  /** 宿名（單字，如「角」） */
  name: string;
  /** 四象分組（如「東方蒼龍」） */
  group: string;
  /** 距星中文名（多數為宿一，奎/觜/參例外） */
  detStarName: string;
  westernName: string;
  hip: number;
  /** J2000 赤經（度） */
  raJ2000: number;
  /** J2000 赤緯（度） */
  decJ2000: number;
  vmag: number;
}

export interface MansionsFile {
  system: 'qing';
  source: string;
  mansions: Mansion[];
}

/** 星官亮星（mansionStars.json） */
export interface MansionStar {
  name: string;
  westernName: string;
  hip: number | null;
  raJ2000: number;
  decJ2000: number;
  vmag: number;
}

export interface MansionAsterism {
  stars: MansionStar[];
  /** 連線（stars 索引對） */
  lines: [number, number][];
}

export interface MansionStarsFile {
  source: string;
  byMansion: Record<string, MansionAsterism>;
}
