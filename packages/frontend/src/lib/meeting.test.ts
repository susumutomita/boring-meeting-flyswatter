import { describe, expect, it } from 'bun:test';
import {
  type ActiveGameSeed,
  type Fly,
  advanceMeeting,
  boredomThresholdSeconds,
  counterThresholdTicks,
  createFly,
  createInitialMeetingState,
  endMeeting,
  gameDurationSeconds,
  maxPenalties,
  moveFlies,
  openingGraceTicks,
  productivityScoreMax,
  productivityScoreMin,
  registerActivity,
  selectFlyInSwatReach,
  selectMeetingMetrics,
  selectSwattingFeedback,
  setProductivityScore,
  startMeeting,
  swatFly,
  swatTier,
  swatTreat,
  toggleBoredomReason,
  treatBoostMultiplier,
} from './meeting';

const createFlyFixture = (id: number): Fly => ({
  id,
  x: 20,
  y: 30,
  size: 52,
  rotation: 0,
  hue: 12,
  velocityX: 1.4,
  velocityY: 0.9,
  charge: 0,
});

const createGameFixture = (graceTicks = 0): ActiveGameSeed => ({
  eventId: 1,
  durationSeconds: gameDurationSeconds,
  remainingSeconds: gameDurationSeconds,
  score: 0,
  penalties: 0,
  graceTicks,
  flies: [createFlyFixture(101), createFlyFixture(202)],
  treat: null,
  treatSpawnTicksRemaining: 0,
  treatConsumed: false,
  armed: false,
});

describe('会議退屈度ロジック', () => {
  it('会議開始で監視状態へ入るべき', () => {
    const state = startMeeting();

    expect(state.phase).toBe('monitoring');
    expect(state.meetingSeconds).toBe(0);
    expect(state.lastActivityLabel).toBe('会議を開始');
  });

  it('アクティビティがあると無活動時間をリセットするべき', () => {
    let state = startMeeting();
    state = advanceMeeting(state);
    state = advanceMeeting(state);

    const nextState = registerActivity(state, '発言した');

    expect(nextState.inactiveSeconds).toBe(0);
    expect(nextState.lastActivityLabel).toBe('発言した');
  });

  it('しきい値に達するとハエ叩きゲームが始まるべき', () => {
    let state = startMeeting();

    for (let index = 0; index < boredomThresholdSeconds; index += 1) {
      state = advanceMeeting(state, () => createGameFixture(openingGraceTicks));
    }

    expect(state.phase).toBe('swatting');
    expect(state.currentGame?.flies).toHaveLength(2);
    expect(state.currentGame?.graceTicks).toBe(openingGraceTicks);
    expect(state.firstBoredomSecond).toBe(boredomThresholdSeconds);
  });

  it('生成されるハエは小さなドット絵サイズに収まるべき', () => {
    const fly = createFly(() => 1);

    expect(fly.size).toBeLessThanOrEqual(20);
  });

  it('開始直後の説明猶予では反撃チャージを進めないべき', () => {
    const state = {
      ...startMeeting(),
      phase: 'swatting' as const,
      currentGame: {
        ...createGameFixture(),
        atSecond: boredomThresholdSeconds,
        graceTicks: 2,
        flies: [
          {
            ...createFlyFixture(303),
            charge: counterThresholdTicks - 1,
          },
        ],
      },
    };

    const nextState = moveFlies(state);

    expect(nextState.currentGame?.graceTicks).toBe(1);
    expect(nextState.currentGame?.penalties).toBe(0);
    expect(nextState.currentGame?.flies[0]?.charge).toBe(
      counterThresholdTicks - 1
    );
    expect(nextState.lastActivityLabel).toBe('ハエ叩きの説明中');
  });

  it('ハエを叩くとスコアが増え置き換えられるべき', () => {
    let state = startMeeting();

    for (let index = 0; index < boredomThresholdSeconds; index += 1) {
      state = advanceMeeting(state, createGameFixture);
    }

    const targetFlyId = state.currentGame?.flies[0]?.id;

    if (!targetFlyId) {
      throw new Error('target fly not found');
    }

    const nextState = swatFly(state, targetFlyId, () => createFlyFixture(999));

    expect(nextState.currentGame?.score).toBe(1);
    expect(nextState.currentGame?.flies[0]?.id).toBe(999);
    expect(nextState.lastActivityLabel).toBe('ハエを叩いた');
  });

  it('スワッターの範囲内にいる最も近いハエを選ぶべき', () => {
    const targetFlyId = selectFlyInSwatReach(
      [
        { ...createFlyFixture(111), x: 43, y: 50, size: 36 },
        { ...createFlyFixture(222), x: 50, y: 51, size: 36 },
      ],
      { x: 50, y: 50 },
      { width: 500, height: 400 }
    );

    expect(targetFlyId).toBe(222);
  });

  it('スワッターの範囲外にいるハエは選ばないべき', () => {
    const targetFlyId = selectFlyInSwatReach(
      [{ ...createFlyFixture(333), x: 12, y: 18, size: 34 }],
      { x: 88, y: 80 },
      { width: 500, height: 400 }
    );

    expect(targetFlyId).toBeNull();
  });

  it('退屈イベントと退屈率を集計できるべき', () => {
    let state = createInitialMeetingState();

    state = startMeeting();
    for (let index = 0; index < boredomThresholdSeconds; index += 1) {
      state = advanceMeeting(state, createGameFixture);
    }
    state = swatFly(state, 101, () => createFlyFixture(303));

    const metrics = selectMeetingMetrics(state);

    expect(metrics.boredomEvents).toBe(1);
    expect(metrics.totalSwats).toBe(1);
    expect(metrics.firstBoredomSecond).toBe(boredomThresholdSeconds);
    expect(metrics.boredomRate).toBe(1);
  });

  it('ゲーム中は残り時間が 1 秒ずつ減り、0 になったら会議に復帰するべき', () => {
    const state = {
      ...startMeeting(),
      phase: 'swatting' as const,
      currentGame: {
        ...createGameFixture(),
        atSecond: boredomThresholdSeconds,
        remainingSeconds: 1,
      },
    };

    const nextState = advanceMeeting(state, createGameFixture);

    expect(nextState.phase).toBe('monitoring');
    expect(nextState.currentGame).toBeNull();
    expect(nextState.completedEvents).toHaveLength(1);
    expect(nextState.lastActivityLabel).toBe('時間切れで会議に復帰');
  });

  it('ゲーム中の標的は壁で跳ね返るべき', () => {
    const state = {
      ...startMeeting(),
      phase: 'swatting' as const,
      currentGame: {
        ...createGameFixture(),
        atSecond: boredomThresholdSeconds,
        flies: [
          {
            ...createFlyFixture(404),
            x: 92,
            y: 80,
            velocityX: 1.5,
            velocityY: 1.2,
          },
        ],
      },
    };

    const nextState = moveFlies(state);
    const movedFly = nextState.currentGame?.flies[0];

    expect(movedFly?.velocityX).toBeLessThan(0);
    expect(movedFly?.velocityY).toBeLessThan(0);
  });

  it('チャージが溜まってもハエは反撃せずペナルティも増えないべき', () => {
    const state = {
      ...startMeeting(),
      phase: 'swatting' as const,
      currentGame: {
        ...createGameFixture(),
        atSecond: boredomThresholdSeconds,
        flies: [
          {
            ...createFlyFixture(505),
            charge: counterThresholdTicks - 1,
          },
        ],
      },
    };

    const nextState = moveFlies(state);

    expect(nextState.currentGame?.penalties).toBe(0);
    expect(nextState.lastActivityLabel).not.toBe('ハエが反撃した');
  });

  it('ハエ叩きは 1 ミーティング 1 回しか発火しないべき', () => {
    let state = startMeeting();

    for (let index = 0; index < boredomThresholdSeconds; index += 1) {
      state = advanceMeeting(state, createGameFixture);
    }
    expect(state.phase).toBe('swatting');

    while (state.currentGame) {
      state = advanceMeeting(state, createGameFixture);
    }
    expect(state.phase).toBe('monitoring');
    expect(state.boredomGameTriggered).toBe(true);

    for (let index = 0; index < boredomThresholdSeconds + 2; index += 1) {
      state = advanceMeeting(state, createGameFixture);
    }

    expect(state.phase).toBe('monitoring');
    expect(state.currentGame).toBeNull();
    expect(state.completedEvents).toHaveLength(1);
  });

  it('退屈閾値到達時に絶対時刻 ( swattingStartedAt ) を記録するべき', () => {
    let state = startMeeting();
    expect(state.swattingStartedAt).toBeNull();

    for (let index = 0; index < boredomThresholdSeconds; index += 1) {
      state = advanceMeeting(state, createGameFixture);
    }

    expect(state.phase).toBe('swatting');
    expect(state.swattingStartedAt).not.toBeNull();
    expect(typeof state.swattingStartedAt).toBe('number');
  });

  it('スポーンタイマーが切れたタイミングでフラペチーノが現れるべき', () => {
    const state = {
      ...startMeeting(),
      phase: 'swatting' as const,
      currentGame: {
        ...createGameFixture(),
        atSecond: boredomThresholdSeconds,
        treatSpawnTicksRemaining: 1,
      },
    };

    const nextState = moveFlies(state);

    expect(nextState.currentGame?.treat).not.toBeNull();
    expect(nextState.currentGame?.treatSpawnTicksRemaining).toBe(0);
    expect(nextState.lastActivityLabel).toBe('ボーナスが現れた');
  });

  it('ボーナスを叩いた瞬間に現在スコアが 2 倍になりアイテムは消えるべき', () => {
    const state = {
      ...startMeeting(),
      phase: 'swatting' as const,
      currentGame: {
        ...createGameFixture(),
        atSecond: boredomThresholdSeconds,
        score: 3,
        treat: {
          id: 99,
          itemId: 'frappuccino',
          x: 50,
          y: 50,
          velocityX: 0.3,
          velocityY: 0.2,
          bobSeed: 0,
          age: 4,
        },
      },
    };

    const afterTreat = swatTreat(state);

    expect(afterTreat.currentGame?.treat).toBeNull();
    expect(afterTreat.currentGame?.treatConsumed).toBe(true);
    expect(afterTreat.currentGame?.score).toBe(3 * treatBoostMultiplier);
    expect(afterTreat.lastActivityLabel).toBe(
      `ボーナスで現スコアが ×${treatBoostMultiplier}`
    );
  });

  it('ボーナスは 1 ゲームに 1 度だけクリックでき、消費後は再出現しないべき', () => {
    const initialState = {
      ...startMeeting(),
      phase: 'swatting' as const,
      currentGame: {
        ...createGameFixture(),
        atSecond: boredomThresholdSeconds,
        score: 1,
        treat: {
          id: 99,
          itemId: 'frappuccino',
          x: 50,
          y: 50,
          velocityX: 0.3,
          velocityY: 0.2,
          bobSeed: 0,
          age: 4,
        },
        treatSpawnTicksRemaining: 0,
      },
    };

    const afterFirst = swatTreat(initialState);
    expect(afterFirst.currentGame?.treat).toBeNull();
    expect(afterFirst.currentGame?.treatConsumed).toBe(true);

    const afterSecondClick = swatTreat(afterFirst);
    expect(afterSecondClick.currentGame?.score).toBe(
      afterFirst.currentGame?.score
    );

    const afterTick = moveFlies(afterFirst);
    expect(afterTick.currentGame?.treat).toBeNull();
    expect(afterTick.currentGame?.treatConsumed).toBe(true);
  });

  it('ミーティング終了で完了フェーズに移り終了時刻を記録するべき', () => {
    let state = startMeeting();

    for (let index = 0; index < 5; index += 1) {
      state = advanceMeeting(state, createGameFixture);
    }

    const ended = endMeeting(state);

    expect(ended.phase).toBe('completed');
    expect(ended.endedAtSecond).toBe(state.meetingSeconds);
    expect(ended.lastActivityLabel).toBe('ミーティングを終了');
  });

  it('退屈の理由は発火後にしかタグ化できないべき', () => {
    const beforeTrigger = startMeeting();
    const afterToggle = toggleBoredomReason(beforeTrigger, '議題が逸れた');
    expect(afterToggle.boredomReasons).toHaveLength(0);

    let triggered = startMeeting();
    for (let index = 0; index < boredomThresholdSeconds; index += 1) {
      triggered = advanceMeeting(triggered, createGameFixture);
    }

    const tagged = toggleBoredomReason(triggered, '議題が逸れた');
    expect(tagged.boredomReasons).toEqual(['議題が逸れた']);
  });

  it('同じ理由をもう一度タップすると外れるべき', () => {
    let state = startMeeting();
    for (let index = 0; index < boredomThresholdSeconds; index += 1) {
      state = advanceMeeting(state, createGameFixture);
    }

    state = toggleBoredomReason(state, '一方通行');
    state = toggleBoredomReason(state, '一方通行');

    expect(state.boredomReasons).toHaveLength(0);
  });

  it('退屈の理由は 1 つだけ選べて、別の理由を押すと前の選択が外れるべき', () => {
    let state = startMeeting();
    for (let index = 0; index < boredomThresholdSeconds; index += 1) {
      state = advanceMeeting(state, createGameFixture);
    }

    state = toggleBoredomReason(state, '議題が逸れた');
    state = toggleBoredomReason(state, '一方通行');

    expect(state.boredomReasons).toEqual(['一方通行']);
  });

  it('ハエ叩きスコアの称号はしきい値で切り替わるべき', () => {
    expect(swatTier(0)).toBe('rookie');
    expect(swatTier(14)).toBe('rookie');
    expect(swatTier(15)).toBe('bronze');
    expect(swatTier(49)).toBe('bronze');
    expect(swatTier(50)).toBe('gold');
    expect(swatTier(99)).toBe('gold');
    expect(swatTier(100)).toBe('platinum');
    expect(swatTier(250)).toBe('platinum');
  });

  it('生産性スコアは完了フェーズでのみ 1 〜 10 にクランプされて反映されるべき', () => {
    let state = startMeeting();
    state = { ...state, phase: 'completed', endedAtSecond: 30 };

    const valid = setProductivityScore(state, 7);
    expect(valid.productivityScore).toBe(7);

    const tooHigh = setProductivityScore(state, 99);
    expect(tooHigh.productivityScore).toBe(productivityScoreMax);

    const tooLow = setProductivityScore(state, -3);
    expect(tooLow.productivityScore).toBe(productivityScoreMin);

    const fractional = setProductivityScore(state, 4.6);
    expect(fractional.productivityScore).toBe(5);
  });

  it('完了フェーズ以外で生産性スコアを設定しても無視されるべき', () => {
    const monitoring = startMeeting();
    const result = setProductivityScore(monitoring, 8);

    expect(result.productivityScore).toBeNull();
  });

  it('完了フェーズではアクティビティも経過秒も進めないべき', () => {
    const completed: ReturnType<typeof endMeeting> = endMeeting({
      ...startMeeting(),
      meetingSeconds: 10,
    });

    const advanced = advanceMeeting(completed, createGameFixture);
    const acted = registerActivity(completed, '発言した');

    expect(advanced).toEqual(completed);
    expect(acted).toEqual(completed);
  });

  it('介入中のフィードバックは説明中と通常で読み分けられるべき', () => {
    const briefingFeedback = selectSwattingFeedback({
      ...createGameFixture(),
      graceTicks: openingGraceTicks,
    });
    const playFeedback = selectSwattingFeedback({
      ...createGameFixture(),
      graceTicks: 0,
    });
    const closingFeedback = selectSwattingFeedback({
      ...createGameFixture(),
      graceTicks: 0,
      remainingSeconds: 3,
    });

    expect(briefingFeedback.isBriefing).toBe(true);
    expect(briefingFeedback.headline).toBe('説明中');
    expect(playFeedback.isBriefing).toBe(false);
    expect(playFeedback.headline).toBe('空気を起こす');
    expect(closingFeedback.headline).toBe('締めの一振り');
  });
});
