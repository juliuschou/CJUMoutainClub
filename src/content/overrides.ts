type StoryOverride = {
  authors?: string[];
  location?: string;
  summary?: string;
};

export const STORY_OVERRIDES: Record<string, StoryOverride> = {
  "87-05-wushan": { authors: ["謝兆光"] },
  "88-01-shidong-hot-spring": { authors: ["謝兆光"] },
  "89-09-jiali": { authors: ["周其昌"] },
  "90-12-teacher-birthday": { authors: ["黃春燕"], location: "老師慶生與回娘家" },
  "91-04-beichatianshan": { authors: ["張惠雯"] },
  "91-07-yangmingshan-traverse": { authors: ["廖怡斐"] },
  "91-10-shaolai-yuanzui": { authors: ["黃佳靜"] },
  "92-04-paoma-trail": { authors: ["黃吉益"] },
  "92-10-hehuan-north-peak": {
    authors: ["蔡娟娟", "楊婷婷"],
    summary: "在合歡北峰與天巒池之間，一行人穿越霧雨、箭竹與高山湖泊，留下三天縱走與先遣探勘的完整記錄。",
  },
  "94-03-beichatianshan-2": { authors: ["Bingo"] },
  "94-04-dongshi-fireflies": { authors: ["楊婷婷", "白君惠"] },
  "94-10-xueshan-main-peak": { authors: ["陳玲娟", "黃吉益"] },
  "94-12-taimali": { authors: ["Blue（藍怡秋）"] },
  "95-09-teapot-mountain": { authors: ["謝婷夙"] },
};

export const DECORATIVE_ASSETS = new Set(["92-09-malabanshan/image65.png"]);

export const KNOWN_AUTHORS = [
  "白君惠",
  "林文彬",
  "許又文",
  "張惠雯",
  "陳玲娟",
  "黃吉益",
  "黃佳靜",
  "黃春燕",
  "黃惠敏",
  "楊婷婷",
  "廖怡斐",
  "廖佩菁",
  "蔡娟娟",
  "謝兆光",
  "謝婷夙",
  "簡瑞吟",
  "顏彤",
] as const;
