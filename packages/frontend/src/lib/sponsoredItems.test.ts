import { describe, expect, it } from 'bun:test';
import {
  type SponsoredItem,
  findSponsoredItem,
  pickSponsoredItem,
  sponsoredItems,
} from './sponsoredItems';

const buildItem = (overrides: Partial<SponsoredItem> = {}): SponsoredItem => ({
  id: 'fixture',
  label: 'fixture',
  description: 'fixture',
  spriteKind: 'frappuccino',
  ...overrides,
});

describe('スポンサーアイテムの抽選 / 検索', () => {
  it('シードを与えれば決定論的に同じアイテムが選ばれるべき', () => {
    const items: SponsoredItem[] = [
      buildItem({ id: 'a' }),
      buildItem({ id: 'b' }),
      buildItem({ id: 'c' }),
    ];

    expect(pickSponsoredItem(items, () => 0).id).toBe('a');
    expect(pickSponsoredItem(items, () => 0.5).id).toBe('b');
    expect(pickSponsoredItem(items, () => 0.999).id).toBe('c');
  });

  it('id で検索でき、見つからなければ先頭にフォールバックするべき', () => {
    const items: SponsoredItem[] = [
      buildItem({ id: 'a' }),
      buildItem({ id: 'b' }),
    ];

    expect(findSponsoredItem('b', items)?.id).toBe('b');
    expect(findSponsoredItem('zzz', items)?.id).toBe('a');
  });

  it('リストが空ならピックできずエラーを投げるべき', () => {
    expect(() => pickSponsoredItem([], () => 0)).toThrow();
  });

  it('既定リストには少なくとも 1 件のアイテムが含まれているべき', () => {
    expect(sponsoredItems.length).toBeGreaterThanOrEqual(1);
    for (const item of sponsoredItems) {
      expect(item.label.length).toBeGreaterThan(0);
      expect(item.description.length).toBeGreaterThan(0);
    }
  });
});
