export type ScoreSnapshot = {
  peerId: string;
  displayName: string;
  score: number;
  bestScore: number;
  phase: 'idle' | 'monitoring' | 'swatting' | 'completed';
  updatedAt: number;
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
