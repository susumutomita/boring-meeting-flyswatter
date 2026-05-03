export type SponsoredItemSpriteKind =
  | 'frappuccino'
  | 'announcement'
  | 'campaign'
  | 'ribbon';

export type SponsoredItem = {
  id: string;
  label: string;
  description: string;
  spriteKind: SponsoredItemSpriteKind;
};

// 社内向けに差し替えるときは、このリストに追記するだけ。
// 表示中の 1 個は createSponsoredItem が乱数で抽選する。
export const sponsoredItems: readonly SponsoredItem[] = [
  {
    id: 'frappuccino',
    label: '冷たいご褒美',
    description: 'スコアが 2 倍。会議の合間に休憩を。',
    spriteKind: 'frappuccino',
  },
];

export const pickSponsoredItem = (
  items: readonly SponsoredItem[] = sponsoredItems,
  random = Math.random
): SponsoredItem => {
  if (items.length === 0) {
    throw new Error('sponsoredItems が空です');
  }
  const index = Math.floor(random() * items.length) % items.length;
  return items[index];
};

export const findSponsoredItem = (
  id: string,
  items: readonly SponsoredItem[] = sponsoredItems
): SponsoredItem | null =>
  items.find((item) => item.id === id) ?? items[0] ?? null;
