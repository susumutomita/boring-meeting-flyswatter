export const speechThresholdDb = -45;
export const speechSustainSamples = 3;
export const minSpeechIntervalMs = 700;

export const isSpeechSample = (
  recentDecibels: readonly number[],
  thresholdDb = speechThresholdDb,
  sustainSamples = speechSustainSamples
): boolean => {
  if (recentDecibels.length < sustainSamples) {
    return false;
  }

  const tail = recentDecibels.slice(-sustainSamples);
  return tail.every((decibels) => decibels > thresholdDb);
};

export const audioLevelFloorDb = -60;
export const audioLevelCeilingDb = -10;

export const audioLevelToPercent = (
  decibels: number,
  floorDb = audioLevelFloorDb,
  ceilingDb = audioLevelCeilingDb
): number => {
  if (!Number.isFinite(decibels)) {
    return 0;
  }
  if (decibels <= floorDb) {
    return 0;
  }
  if (decibels >= ceilingDb) {
    return 100;
  }
  const span = ceilingDb - floorDb;
  return ((decibels - floorDb) / span) * 100;
};

export const computeRmsDecibels = (samples: Float32Array): number => {
  if (samples.length === 0) {
    return Number.NEGATIVE_INFINITY;
  }

  let sumOfSquares = 0;
  for (let index = 0; index < samples.length; index += 1) {
    sumOfSquares += samples[index] * samples[index];
  }

  const rms = Math.sqrt(sumOfSquares / samples.length);
  return 20 * Math.log10(Math.max(rms, 1e-8));
};
