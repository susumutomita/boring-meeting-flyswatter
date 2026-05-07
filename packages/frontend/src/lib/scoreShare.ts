import type { BoredomReasonPreset } from './meeting';

export type ScoreSnapshot = {
  peerId: string;
  displayName: string;
  score: number;
  bestScore: number;
  phase: 'idle' | 'monitoring' | 'swatting' | 'completed';
  updatedAt: number;
  reasons: BoredomReasonPreset[];
  swattingStartedAt: number | null;
  productivityScore: number | null;
};

export type ReasonTally = {
  preset: BoredomReasonPreset;
  count: number;
};

export const sanitizeRoomCode = (raw: string): string =>
  raw
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 32);

export const sanitizeDisplayName = (raw: string): string => {
  const trimmed = raw.trim().replace(/\s+/g, ' ').slice(0, 24);
  return trimmed.length === 0 ? 'ゲスト' : trimmed;
};

export const buildHostPeerId = (roomCode: string): string =>
  `bmf-room-${roomCode}`;

export const mergePeerScores = (
  existing: readonly ScoreSnapshot[],
  incoming: ScoreSnapshot
): ScoreSnapshot[] => {
  const trimmed = existing.filter(
    (snapshot) => snapshot.peerId !== incoming.peerId
  );
  return [...trimmed, incoming];
};

export const removePeerScore = (
  existing: readonly ScoreSnapshot[],
  peerId: string
): ScoreSnapshot[] => existing.filter((snapshot) => snapshot.peerId !== peerId);

export const rankPeers = (
  snapshots: readonly ScoreSnapshot[]
): ScoreSnapshot[] => {
  const copy = [...snapshots];
  copy.sort((a, b) => {
    if (b.bestScore !== a.bestScore) {
      return b.bestScore - a.bestScore;
    }
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.displayName.localeCompare(b.displayName, 'ja');
  });
  return copy;
};

export type ProductivityAverage = {
  average: number | null;
  respondents: number;
};

export const averageProductivityScore = (
  snapshots: readonly ScoreSnapshot[]
): ProductivityAverage => {
  const scores: number[] = [];
  for (const snapshot of snapshots) {
    if (snapshot.productivityScore !== null) {
      scores.push(snapshot.productivityScore);
    }
  }
  if (scores.length === 0) {
    return { average: null, respondents: 0 };
  }
  const total = scores.reduce((sum, value) => sum + value, 0);
  return {
    average: Math.round((total / scores.length) * 10) / 10,
    respondents: scores.length,
  };
};

export const tallyReasons = (
  snapshots: readonly ScoreSnapshot[]
): ReasonTally[] => {
  const counts = new Map<BoredomReasonPreset, number>();
  for (const snapshot of snapshots) {
    for (const preset of snapshot.reasons) {
      counts.set(preset, (counts.get(preset) ?? 0) + 1);
    }
  }
  const entries: ReasonTally[] = [];
  for (const [preset, count] of counts) {
    entries.push({ preset, count });
  }
  entries.sort((a, b) => {
    if (b.count !== a.count) {
      return b.count - a.count;
    }
    return a.preset.localeCompare(b.preset, 'ja');
  });
  return entries;
};
