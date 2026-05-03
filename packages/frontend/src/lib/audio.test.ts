import { describe, expect, it } from 'bun:test';
import {
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
