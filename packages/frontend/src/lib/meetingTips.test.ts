import { describe, expect, it } from 'bun:test';
import { meetingTips, pickMeetingTip } from './meetingTips';

describe('生産的な会議のコツ', () => {
  it('seed が 0 のときは先頭のコツを返すべき', () => {
    expect(pickMeetingTip(0)).toBe(meetingTips[0]);
  });

  it('seed は配列長で剰余をとってループするべき', () => {
    expect(pickMeetingTip(meetingTips.length + 2)).toBe(meetingTips[2]);
  });

  it('NaN や Infinity が来ても先頭にフォールバックするべき', () => {
    expect(pickMeetingTip(Number.NaN)).toBe(meetingTips[0]);
    expect(pickMeetingTip(Number.POSITIVE_INFINITY)).toBe(meetingTips[0]);
  });

  it('全てのコツは空文字でないべき', () => {
    for (const tip of meetingTips) {
      expect(tip.length).toBeGreaterThan(0);
    }
  });
});
