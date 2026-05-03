import { describe, expect, it } from 'bun:test';
import { meetingQuotes, selectQuote } from './quotes';

describe('ミーティング名言の選び方', () => {
  it('seed が 0 のときは先頭の名言を返すべき', () => {
    expect(selectQuote(0)).toEqual(meetingQuotes[0]);
  });

  it('seed は名言数で剰余を取ってループするべき', () => {
    const wrapped = selectQuote(meetingQuotes.length + 3);
    expect(wrapped).toEqual(meetingQuotes[3]);
  });

  it('負の seed でも有効な名言を返すべき', () => {
    expect(selectQuote(-7)).toEqual(meetingQuotes[7 % meetingQuotes.length]);
  });

  it('NaN や Infinity が来てもクラッシュせず先頭を返すべき', () => {
    expect(selectQuote(Number.NaN)).toEqual(meetingQuotes[0]);
    expect(selectQuote(Number.POSITIVE_INFINITY)).toEqual(meetingQuotes[0]);
  });

  it('全ての名言は本文と著者を持つべき', () => {
    for (const quote of meetingQuotes) {
      expect(quote.body.length).toBeGreaterThan(0);
      expect(quote.author.length).toBeGreaterThan(0);
    }
  });
});
