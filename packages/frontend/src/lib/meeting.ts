import { pickSponsoredItem } from './sponsoredItems';

export const boredomThresholdSeconds = 60;
export const gameDurationSeconds = 20;
export const flyCount = 6;
export const counterThresholdTicks = 36;
export const targetScore = 10;
export const maxPenalties = 5;
export const openingGraceTicks = 28;
export const treatSpawnTicks = 33;
export const treatBoostMultiplier = 2;

export const productivityScoreMin = 1;
export const productivityScoreMax = 10;

export const boredomReasonPresets = [
  '議題が逸れた',
  '一方通行',
  '結論が出ない',
  '前提が共有されてない',
  '自分に関係ない',
  'テンポが遅い',
  '時間が長い',
  '実は退屈ではなかった',
] as const;

export type BoredomReasonPreset = (typeof boredomReasonPresets)[number];

export type MeetingPhase = 'idle' | 'monitoring' | 'swatting' | 'completed';

export type Fly = {
  id: number;
  x: number;
  y: number;
  size: number;
  rotation: number;
  hue: number;
  velocityX: number;
  velocityY: number;
  charge: number;
};

export type CompletedBoredomEvent = {
  id: number;
  atSecond: number;
  swats: number;
  penalties: number;
  durationSeconds: number;
};

export type Treat = {
  id: number;
  itemId: string;
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  bobSeed: number;
  age: number;
};

export type ActiveGameSeed = {
  eventId: number;
  durationSeconds: number;
  remainingSeconds: number;
  score: number;
  penalties: number;
  graceTicks: number;
  flies: Fly[];
  treat: Treat | null;
  treatSpawnTicksRemaining: number;
  treatConsumed: boolean;
};

export type ActiveGame = ActiveGameSeed & {
  atSecond: number;
};

export type MeetingState = {
  phase: MeetingPhase;
  meetingSeconds: number;
  inactiveSeconds: number;
  totalInactiveSeconds: number;
  completedEvents: CompletedBoredomEvent[];
  currentGame: ActiveGame | null;
  firstBoredomSecond: number | null;
  swattingStartedAt: number | null;
  lastActivityLabel: string;
  boredomGameTriggered: boolean;
  endedAtSecond: number | null;
  boredomReasons: BoredomReasonPreset[];
  productivityScore: number | null;
};

export type MeetingMetrics = {
  boredomEvents: number;
  firstBoredomSecond: number | null;
  averageSwatsPerEvent: number;
  boredomRate: number;
  totalSwats: number;
};

export type SwattingFeedback = {
  headline: string;
  detail: string;
  pressurePercent: number;
  dangerCount: number;
  isBriefing: boolean;
};

export type SwatPoint = {
  x: number;
  y: number;
};

export type SwatFieldSize = {
  width: number;
  height: number;
};

let flyId = 0;
let eventId = 0;
let treatId = 0;
const defaultSwatReachPixels = 96;
const dangerChargeRatio = 0.72;
const flyBounds = {
  minX: 8,
  maxX: 92,
  minY: 16,
  maxY: 80,
};
const treatBounds = {
  minX: 14,
  maxX: 86,
  minY: 22,
  maxY: 70,
};

const nextFlyId = () => {
  flyId += 1;
  return flyId;
};

const nextEventId = () => {
  eventId += 1;
  return eventId;
};

const nextTreatId = () => {
  treatId += 1;
  return treatId;
};

export const createFly = (random = Math.random): Fly => {
  const speed = 0.9 + random() * 1.7;
  const angle = random() * Math.PI * 2;

  return {
    id: nextFlyId(),
    x: 12 + Math.round(random() * 76),
    y: 18 + Math.round(random() * 56),
    size: 14 + Math.round(random() * 6),
    rotation: -18 + Math.round(random() * 36),
    hue: 194 + Math.round(random() * 22),
    velocityX: Math.cos(angle) * speed,
    velocityY: Math.sin(angle) * speed,
    charge: Math.floor(random() * 4),
  };
};

export const createFlyField = (count = flyCount, random = Math.random): Fly[] =>
  Array.from({ length: count }, () => createFly(random));

export const createTreat = (
  random = Math.random,
  itemId = 'frappuccino'
): Treat => {
  const angle = random() * Math.PI * 2;
  const speed = 0.22 + random() * 0.28;

  return {
    id: nextTreatId(),
    itemId,
    x: 28 + Math.round(random() * 44),
    y: 32 + Math.round(random() * 28),
    velocityX: Math.cos(angle) * speed,
    velocityY: Math.sin(angle) * speed,
    bobSeed: random() * Math.PI * 2,
    age: 0,
  };
};

export const createGameSeed = (): ActiveGameSeed => ({
  eventId: nextEventId(),
  durationSeconds: gameDurationSeconds,
  remainingSeconds: gameDurationSeconds,
  score: 0,
  penalties: 0,
  graceTicks: openingGraceTicks,
  flies: createFlyField(),
  treat: null,
  treatSpawnTicksRemaining: treatSpawnTicks,
  treatConsumed: false,
});

export const createInitialMeetingState = (): MeetingState => ({
  phase: 'idle',
  meetingSeconds: 0,
  inactiveSeconds: 0,
  totalInactiveSeconds: 0,
  completedEvents: [],
  currentGame: null,
  firstBoredomSecond: null,
  swattingStartedAt: null,
  lastActivityLabel: '待機中',
  boredomGameTriggered: false,
  endedAtSecond: null,
  boredomReasons: [],
  productivityScore: null,
});

export const startMeeting = (): MeetingState => ({
  ...createInitialMeetingState(),
  phase: 'monitoring',
  lastActivityLabel: '会議を開始',
});

export const toggleBoredomReason = (
  state: MeetingState,
  preset: BoredomReasonPreset
): MeetingState => {
  if (!state.boredomGameTriggered) {
    return state;
  }
  const isSelected = state.boredomReasons.includes(preset);
  if (isSelected) {
    return {
      ...state,
      boredomReasons: [],
    };
  }
  return {
    ...state,
    boredomReasons: [preset],
  };
};

export const setProductivityScore = (
  state: MeetingState,
  rawScore: number
): MeetingState => {
  if (state.phase !== 'completed') {
    return state;
  }
  if (!Number.isFinite(rawScore)) {
    return state;
  }
  const clamped = Math.min(
    productivityScoreMax,
    Math.max(productivityScoreMin, Math.round(rawScore))
  );
  return { ...state, productivityScore: clamped };
};

export const endMeeting = (state: MeetingState): MeetingState => {
  if (state.phase === 'idle' || state.phase === 'completed') {
    return state;
  }

  return {
    ...state,
    phase: 'completed',
    currentGame: null,
    inactiveSeconds: 0,
    endedAtSecond: state.meetingSeconds,
    lastActivityLabel: 'ミーティングを終了',
  };
};

const settleCurrentGame = (
  state: MeetingState,
  currentGame: ActiveGame,
  label: string
): MeetingState => ({
  ...state,
  phase: 'monitoring',
  inactiveSeconds: 0,
  currentGame: null,
  completedEvents: [
    ...state.completedEvents,
    {
      id: currentGame.eventId,
      atSecond: currentGame.atSecond,
      swats: currentGame.score,
      penalties: currentGame.penalties,
      durationSeconds: currentGame.durationSeconds,
    },
  ],
  lastActivityLabel: label,
});

export const registerActivity = (
  state: MeetingState,
  label: string
): MeetingState => {
  if (state.phase !== 'monitoring') {
    return state;
  }

  return {
    ...state,
    inactiveSeconds: 0,
    lastActivityLabel: label,
  };
};

export const advanceMeeting = (
  state: MeetingState,
  createGame = createGameSeed
): MeetingState => {
  if (state.phase === 'idle' || state.phase === 'completed') {
    return state;
  }

  const nextMeetingSeconds = state.meetingSeconds + 1;

  if (state.currentGame) {
    const nextRemainingSeconds = state.currentGame.remainingSeconds - 1;
    const totalInactiveSeconds = state.totalInactiveSeconds + 1;

    if (nextRemainingSeconds <= 0) {
      return settleCurrentGame(
        {
          ...state,
          meetingSeconds: nextMeetingSeconds,
          totalInactiveSeconds,
        },
        {
          ...state.currentGame,
          remainingSeconds: 0,
        },
        '時間切れで会議に復帰'
      );
    }

    return {
      ...state,
      meetingSeconds: nextMeetingSeconds,
      totalInactiveSeconds,
      currentGame: {
        ...state.currentGame,
        remainingSeconds: nextRemainingSeconds,
      },
    };
  }

  const nextInactiveSeconds = state.inactiveSeconds + 1;
  const totalInactiveSeconds = state.totalInactiveSeconds + 1;

  if (
    nextInactiveSeconds >= boredomThresholdSeconds &&
    !state.boredomGameTriggered
  ) {
    const game = createGame();
    const atSecond = nextMeetingSeconds;

    return {
      ...state,
      phase: 'swatting',
      meetingSeconds: nextMeetingSeconds,
      inactiveSeconds: nextInactiveSeconds,
      totalInactiveSeconds,
      currentGame: {
        ...game,
        atSecond,
      },
      firstBoredomSecond: state.firstBoredomSecond ?? atSecond,
      swattingStartedAt: state.swattingStartedAt ?? Date.now(),
      lastActivityLabel: '退屈を検知',
      boredomGameTriggered: true,
    };
  }

  return {
    ...state,
    meetingSeconds: nextMeetingSeconds,
    inactiveSeconds: nextInactiveSeconds,
    totalInactiveSeconds,
  };
};

export const swatFly = (
  state: MeetingState,
  targetFlyId: number,
  createReplacementFly = createFly
): MeetingState => {
  if (!state.currentGame) {
    return state;
  }

  const flyIndex = state.currentGame.flies.findIndex(
    (fly) => fly.id === targetFlyId
  );

  if (flyIndex === -1) {
    return state;
  }

  const flies = [...state.currentGame.flies];
  flies[flyIndex] = createReplacementFly();
  const currentGame = {
    ...state.currentGame,
    score: state.currentGame.score + 1,
    flies,
  };

  if (currentGame.score >= targetScore) {
    return settleCurrentGame(state, currentGame, 'ノルマ達成で会議に復帰');
  }

  return {
    ...state,
    currentGame,
    lastActivityLabel: 'ハエを叩いた',
  };
};

export const swatTreat = (state: MeetingState): MeetingState => {
  if (
    !state.currentGame ||
    !state.currentGame.treat ||
    state.currentGame.treatConsumed
  ) {
    return state;
  }

  const doubledScore = state.currentGame.score * treatBoostMultiplier;
  const currentGame = {
    ...state.currentGame,
    treat: null,
    treatConsumed: true,
    score: doubledScore,
  };

  if (doubledScore >= targetScore) {
    return settleCurrentGame(
      state,
      currentGame,
      'ボーナスでノルマ達成し会議に復帰'
    );
  }

  return {
    ...state,
    currentGame,
    lastActivityLabel: `ボーナスで現スコアが ×${treatBoostMultiplier}`,
  };
};

export const selectFlyInSwatReach = (
  flies: Fly[],
  point: SwatPoint,
  fieldSize: SwatFieldSize,
  swatReachPixels = defaultSwatReachPixels
): number | null => {
  if (fieldSize.width <= 0 || fieldSize.height <= 0) {
    return null;
  }

  const selected = flies.reduce<{ id: number | null; distance: number }>(
    (current, fly) => {
      const distance = Math.hypot(
        ((fly.x - point.x) / 100) * fieldSize.width,
        ((fly.y - point.y) / 100) * fieldSize.height
      );
      const reachableDistance = fly.size / 2 + swatReachPixels;

      if (distance > reachableDistance || distance >= current.distance) {
        return current;
      }

      return {
        id: fly.id,
        distance,
      };
    },
    { id: null, distance: Number.POSITIVE_INFINITY }
  );

  return selected.id;
};

export const moveFlies = (state: MeetingState): MeetingState => {
  if (!state.currentGame) {
    return state;
  }

  const isBriefing = state.currentGame.graceTicks > 0;
  const graceTicks = Math.max(0, state.currentGame.graceTicks - 1);
  const flies = state.currentGame.flies.map((fly) => {
    let nextX = fly.x + fly.velocityX;
    let nextY = fly.y + fly.velocityY;
    let nextVelocityX = fly.velocityX;
    let nextVelocityY = fly.velocityY;
    const nextCharge = isBriefing ? fly.charge : fly.charge + 1;

    if (nextX <= flyBounds.minX || nextX >= flyBounds.maxX) {
      nextVelocityX *= -1;
      nextX = Math.min(flyBounds.maxX, Math.max(flyBounds.minX, nextX));
    }

    if (nextY <= flyBounds.minY || nextY >= flyBounds.maxY) {
      nextVelocityY *= -1;
      nextY = Math.min(flyBounds.maxY, Math.max(flyBounds.minY, nextY));
    }

    return {
      ...fly,
      x: nextX,
      y: nextY,
      velocityX: nextVelocityX,
      velocityY: nextVelocityY,
      rotation: Math.max(-22, Math.min(22, nextVelocityX * 10)),
      charge: nextCharge,
    };
  });

  const counterIndex = isBriefing
    ? -1
    : flies.reduce<number>((selectedIndex, fly, index) => {
        if (fly.charge < counterThresholdTicks) {
          return selectedIndex;
        }

        if (selectedIndex === -1 || fly.charge > flies[selectedIndex]?.charge) {
          return index;
        }

        return selectedIndex;
      }, -1);

  let penalties = state.currentGame.penalties;
  let triggeredCounter = false;
  let activeFlies = flies;

  if (counterIndex >= 0) {
    penalties += 1;
    triggeredCounter = true;
    activeFlies = flies.map((fly, index) =>
      index === counterIndex
        ? {
            ...fly,
            charge: 0,
            velocityX: fly.velocityX * -1,
            velocityY: fly.velocityY * -1,
          }
        : {
            ...fly,
            charge: 0,
          }
    );
  }

  const nextSpawnRemaining = Math.max(
    0,
    state.currentGame.treatSpawnTicksRemaining - 1
  );
  const shouldSpawnTreat =
    state.currentGame.treat === null &&
    !state.currentGame.treatConsumed &&
    nextSpawnRemaining === 0;
  let nextTreat: Treat | null = state.currentGame.treat;

  if (shouldSpawnTreat) {
    const sponsored = pickSponsoredItem();
    nextTreat = createTreat(Math.random, sponsored.id);
  } else if (nextTreat) {
    let treatX = nextTreat.x + nextTreat.velocityX;
    let treatY = nextTreat.y + nextTreat.velocityY;
    let treatVx = nextTreat.velocityX;
    let treatVy = nextTreat.velocityY;
    if (treatX <= treatBounds.minX || treatX >= treatBounds.maxX) {
      treatVx *= -1;
      treatX = Math.min(treatBounds.maxX, Math.max(treatBounds.minX, treatX));
    }
    if (treatY <= treatBounds.minY || treatY >= treatBounds.maxY) {
      treatVy *= -1;
      treatY = Math.min(treatBounds.maxY, Math.max(treatBounds.minY, treatY));
    }
    nextTreat = {
      ...nextTreat,
      x: treatX,
      y: treatY,
      velocityX: treatVx,
      velocityY: treatVy,
      age: nextTreat.age + 1,
    };
  }

  const currentGame = {
    ...state.currentGame,
    flies: activeFlies,
    penalties,
    graceTicks,
    treat: nextTreat,
    treatSpawnTicksRemaining: nextSpawnRemaining,
  };

  if (currentGame.penalties >= maxPenalties) {
    return settleCurrentGame(state, currentGame, '反撃を受け切って会議に復帰');
  }

  return {
    ...state,
    currentGame,
    lastActivityLabel: isBriefing
      ? 'ハエ叩きの説明中'
      : triggeredCounter
        ? 'ハエが反撃した'
        : shouldSpawnTreat
          ? 'ボーナスが現れた'
          : state.lastActivityLabel,
  };
};

export const selectSwattingFeedback = (
  game: ActiveGameSeed
): SwattingFeedback => {
  const isBriefing = game.graceTicks > 0;
  const maxCharge = game.flies.reduce(
    (currentMax, fly) => Math.max(currentMax, fly.charge),
    0
  );
  const pressurePercent = isBriefing
    ? 0
    : Math.min(100, Math.round((maxCharge / counterThresholdTicks) * 100));
  const dangerCount = isBriefing
    ? 0
    : game.flies.filter(
        (fly) => fly.charge >= counterThresholdTicks * dangerChargeRatio
      ).length;

  if (isBriefing) {
    return {
      headline: '説明中',
      detail: 'まずはハエの動きを確認。ポインターを動かして狙いを合わせる。',
      pressurePercent,
      dangerCount,
      isBriefing,
    };
  }

  if (dangerCount > 0) {
    return {
      headline: '反撃寸前',
      detail: '赤く強く光るハエから先に叩いて、会議の空気を守る。',
      pressurePercent,
      dangerCount,
      isBriefing,
    };
  }

  if (game.remainingSeconds <= 5) {
    return {
      headline: '締めの一振り',
      detail: '残り時間わずか。拾えるハエを叩いてテンポを戻す。',
      pressurePercent,
      dangerCount,
      isBriefing,
    };
  }

  return {
    headline: '空気を起こす',
    detail: '逃げ回るハエを叩いて、停滞した会議のテンポを戻す。',
    pressurePercent,
    dangerCount,
    isBriefing,
  };
};

export const getBoredomGauge = (state: MeetingState): number => {
  if (state.phase === 'swatting') {
    return 100;
  }

  return Math.min(100, (state.inactiveSeconds / boredomThresholdSeconds) * 100);
};

export const selectMeetingMetrics = (state: MeetingState): MeetingMetrics => {
  const completedSwats = state.completedEvents.reduce(
    (sum, event) => sum + event.swats,
    0
  );
  const activeSwats = state.currentGame?.score ?? 0;
  const boredomEvents =
    state.completedEvents.length + (state.currentGame ? 1 : 0);
  const totalSwats = completedSwats + activeSwats;

  return {
    boredomEvents,
    firstBoredomSecond: state.firstBoredomSecond,
    averageSwatsPerEvent: boredomEvents === 0 ? 0 : totalSwats / boredomEvents,
    boredomRate:
      state.meetingSeconds === 0
        ? 0
        : state.totalInactiveSeconds / state.meetingSeconds,
    totalSwats,
  };
};

export const formatClock = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${String(minutes).padStart(2, '0')}:${String(
    remainingSeconds
  ).padStart(2, '0')}`;
};

export const formatPercent = (value: number): string =>
  `${Math.round(value * 100)}%`;
