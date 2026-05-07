import { describe, expect, it } from 'bun:test';
import { meetingTips, pickMeetingTip } from './meetingTips';

describe('経営者プラクティスの会議 Tips', () => {
  it('seed が 0 のときは先頭の Tip を返すべき', () => {
    expect(pickMeetingTip(0)).toEqual(meetingTips[0]);
  });

  it('seed は配列長で剰余をとってループするべき', () => {
    expect(pickMeetingTip(meetingTips.length + 2)).toEqual(meetingTips[2]);
  });

  it('NaN や Infinity が来ても先頭にフォールバックするべき', () => {
    expect(pickMeetingTip(Number.NaN)).toEqual(meetingTips[0]);
    expect(pickMeetingTip(Number.POSITIVE_INFINITY)).toEqual(meetingTips[0]);
  });

  it('全ての Tip は practice / body / source を持つべき', () => {
    for (const tip of meetingTips) {
      expect(tip.practice.length).toBeGreaterThan(0);
      expect(tip.body.length).toBeGreaterThan(0);
      expect(tip.source.length).toBeGreaterThan(0);
    }
  });
});
