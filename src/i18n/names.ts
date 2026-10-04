/** 資料名稱的英文對照（靜態資料檔不動，英文名集中於此）。 */

export const ZODIAC_EN = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
] as const;

export const PLANET_EN: Record<string, string> = {
  sun: 'Sun', moon: 'Moon', mercury: 'Mercury', venus: 'Venus', earth: 'Earth',
  mars: 'Mars', jupiter: 'Jupiter', saturn: 'Saturn',
  uranus: 'Uranus', neptune: 'Neptune', pluto: 'Pluto',
};

export const COMET_EN: Record<string, { name: string; note: string }> = {
  halley: {
    name: 'Halley’s Comet',
    note: 'Chinese chronicles record its returns continuously from 240 BCE (the Shiji), making it the best-documented periodic comet.',
  },
  encke: {
    name: 'Comet Encke',
    note: 'The shortest known period of any famous comet (about 3.3 years); parent of the Taurid meteor showers.',
  },
  'swift-tuttle': {
    name: 'Comet Swift–Tuttle',
    note: 'Parent of the August Perseid meteors; the comet recorded in the Hou Hanshu in 69 CE is thought to be one of its returns.',
  },
  'hale-bopp': {
    name: 'Comet Hale–Bopp',
    note: 'The Great Comet of 1997, visible to the naked eye for 18 months; its orbit is nearly perpendicular to the ecliptic.',
  },
};

/** 二十八宿拼音（英文介面標籤：拼音＋漢字） */
export const MANSION_PINYIN: Record<string, string> = {
  角: 'Jiǎo', 亢: 'Kàng', 氐: 'Dī', 房: 'Fáng', 心: 'Xīn', 尾: 'Wěi', 箕: 'Jī',
  斗: 'Dǒu', 牛: 'Niú', 女: 'Nǚ', 虛: 'Xū', 危: 'Wēi', 室: 'Shì', 壁: 'Bì',
  奎: 'Kuí', 婁: 'Lóu', 胃: 'Wèi', 昴: 'Mǎo', 畢: 'Bì', 觜: 'Zī', 參: 'Shēn',
  井: 'Jǐng', 鬼: 'Guǐ', 柳: 'Liǔ', 星: 'Xīng', 張: 'Zhāng', 翼: 'Yì', 軫: 'Zhěn',
};

export const GROUP_EN: Record<string, string> = {
  東方蒼龍: 'Azure Dragon, East',
  北方玄武: 'Black Tortoise, North',
  西方白虎: 'White Tiger, West',
  南方朱雀: 'Vermilion Bird, South',
};

export const DISTAR_SYS_EN: Record<string, { label: string; short: string }> = {
  qing: { label: 'Qing · Yixiang Kaocheng', short: 'Qing' },
  han: { label: 'Han · Shi Shen school', short: 'Han' },
  ming: { label: 'Ming · Chongzhen Lishu', short: 'Ming' },
};
