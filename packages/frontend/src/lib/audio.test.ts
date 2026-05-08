import { describe, expect, it } from 'bun:test';
import {
  audioLevelToPercent,
  computeRmsDecibels,
  isSpeechSample,
  speechSustainSamples,
  speechThresholdDb,
} from './audio';

describe('音声サンプル分類', () => {
  it('しきい値より大きいサンプルが連続したら発話と判定するべき', () => {
    const aboveThreshold = speechThresholdDb + 5;
    const samples = Array.from({ length: speechSustainSamples }).map(
      () => aboveThreshold
    );

    expect(isSpeechSample(samples)).toBe(true);
  });

  it('連続するサンプル数がしきい値に届かなければ発話と扱わないべき', () => {
    const aboveThreshold = speechThresholdDb + 5;
    const samples = Array.from({
      length: Math.max(0, speechSustainSamples - 1),
    }).map(() => aboveThreshold);

    expect(isSpeechSample(samples)).toBe(false);
  });

  it('連続のうち 1 つでも下回れば発話と扱わないべき', () => {
    const above = speechThresholdDb + 5;
    const below = speechThresholdDb - 5;
    const samples = Array.from({ length: speechSustainSamples }).map(
      (_, index) => (index === speechSustainSamples - 1 ? below : above)
    );

    expect(isSpeechSample(samples)).toBe(false);
  });

  it('RMS デシベル値は無音で大きく下に振れ、信号が乗ると上がるべき', () => {
    const silence = new Float32Array(1024);
    const tone = new Float32Array(1024).fill(0.5);

    const silenceDb = computeRmsDecibels(silence);
    const toneDb = computeRmsDecibels(tone);

    expect(silenceDb).toBeLessThan(-100);
    expect(toneDb).toBeGreaterThan(-10);
  });
});

describe('音量バー用のレベル割合変換', () => {
  it('無音より下のデシベル値は 0% に丸めるべき', () => {
    expect(audioLevelToPercent(-80)).toBe(0);
    expect(audioLevelToPercent(-60)).toBe(0);
  });

  it('上限より上のデシベル値は 100% に丸めるべき', () => {
    expect(audioLevelToPercent(-5)).toBe(100);
    expect(audioLevelToPercent(0)).toBe(100);
  });

  it('床と天井の中間のデシベル値は 50% 前後を返すべき', () => {
    expect(audioLevelToPercent(-35)).toBeGreaterThanOrEqual(45);
    expect(audioLevelToPercent(-35)).toBeLessThanOrEqual(55);
  });

  it('発話判定しきい値の付近では 0% より上を返して可視化されるべき', () => {
    expect(audioLevelToPercent(speechThresholdDb)).toBeGreaterThan(0);
    expect(audioLevelToPercent(speechThresholdDb)).toBeLessThan(50);
  });

  it('NaN や負の無限大は 0% として扱うべき', () => {
    expect(audioLevelToPercent(Number.NEGATIVE_INFINITY)).toBe(0);
    expect(audioLevelToPercent(Number.NaN)).toBe(0);
  });
});
