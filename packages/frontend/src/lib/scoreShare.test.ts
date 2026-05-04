import { describe, expect, it } from 'bun:test';
import {
  type ScoreSnapshot,
  buildHostPeerId,
  mergePeerScores,
  rankPeers,
  removePeerScore,
  sanitizeDisplayName,
  sanitizeRoomCode,
  tallyReasons,
} from './scoreShare';

const buildSnapshot = (
  overrides: Partial<ScoreSnapshot> = {}
): ScoreSnapshot => ({
  peerId: 'peer-1',
  displayName: 'ゲスト',
  score: 0,
  bestScore: 0,
  phase: 'monitoring',
  updatedAt: 0,
  reasons: [],
  swattingStartedAt: null,
  productivityScore: null,
  ...overrides,
});

describe('スコア共有のルーム / ピア処理', () => {
  it('ルームコードは英数とハイフンに正規化されるべき', () => {
    expect(sanitizeRoomCode('My  Meeting!! 2026')).toBe('my-meeting-2026');
    expect(sanitizeRoomCode('   ')).toBe('');
    expect(sanitizeRoomCode('---abc---')).toBe('abc');
  });

  it('表示名は空白を畳み 24 文字までで、空ならゲストになるべき', () => {
    expect(sanitizeDisplayName('  山田   太郎  ')).toBe('山田 太郎');
    expect(sanitizeDisplayName('   ')).toBe('ゲスト');
    expect(sanitizeDisplayName('a'.repeat(40)).length).toBe(24);
  });

  it('ホストピア ID はルームコードを前置きするべき', () => {
    expect(buildHostPeerId('demo-room')).toBe('bmf-room-demo-room');
  });

  it('同じピアの新しいスナップショットは古いものを置き換えるべき', () => {
    const before = [buildSnapshot({ peerId: 'a', score: 1 })];
    const after = mergePeerScores(
      before,
      buildSnapshot({ peerId: 'a', score: 5 })
    );

    expect(after).toHaveLength(1);
    expect(after[0]?.score).toBe(5);
  });

  it('離脱したピアのスナップショットは取り除かれるべき', () => {
    const before = [
      buildSnapshot({ peerId: 'a' }),
      buildSnapshot({ peerId: 'b' }),
    ];
    const after = removePeerScore(before, 'a');

    expect(after).toHaveLength(1);
    expect(after[0]?.peerId).toBe('b');
  });

  it('ランキングはベストスコア・現在スコア・名前の順に並ぶべき', () => {
    const ranked = rankPeers([
      buildSnapshot({ peerId: 'a', displayName: 'A', bestScore: 3, score: 1 }),
      buildSnapshot({ peerId: 'b', displayName: 'B', bestScore: 5, score: 2 }),
      buildSnapshot({ peerId: 'c', displayName: 'C', bestScore: 5, score: 4 }),
    ]);

    expect(ranked.map((snapshot) => snapshot.peerId)).toEqual(['c', 'b', 'a']);
  });

  it('退屈の理由は人数の多い順に集計され同数なら名前順で揃うべき', () => {
    const tally = tallyReasons([
      buildSnapshot({ peerId: 'a', reasons: ['議題が逸れた', '一方通行'] }),
      buildSnapshot({ peerId: 'b', reasons: ['議題が逸れた', 'テンポが遅い'] }),
      buildSnapshot({ peerId: 'c', reasons: ['議題が逸れた'] }),
      buildSnapshot({ peerId: 'd', reasons: [] }),
    ]);

    expect(tally).toEqual([
      { preset: '議題が逸れた', count: 3 },
      { preset: 'テンポが遅い', count: 1 },
      { preset: '一方通行', count: 1 },
    ]);
  });
});
