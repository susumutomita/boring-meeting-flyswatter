import { describe, expect, it } from 'bun:test';
import {
  type ActiveGameSeed,
  type Fly,
  advanceMeeting,
  boredomThresholdSeconds,
  counterThresholdTicks,
  createInitialMeetingState,
  gameDurationSeconds,
  maxPenalties,
  moveFlies,
  openingGraceTicks,
  registerActivity,
  selectFlyInSwatReach,
  selectMeetingMetrics,
  selectSwattingFeedback,
  startMeeting,
  swatFly,
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

  it('放置した標的は反撃してペナルティを増やすべき', () => {
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

    expect(nextState.currentGame?.penalties).toBe(1);
    expect(nextState.currentGame?.flies[0]?.charge).toBe(0);
    expect(nextState.lastActivityLabel).toBe('ハエが反撃した');
  });

  it('同時に複数が溜まっても反撃は連鎖させないべき', () => {
    const state = {
      ...startMeeting(),
      phase: 'swatting' as const,
      currentGame: {
        ...createGameFixture(),
        atSecond: boredomThresholdSeconds,
        flies: [
          {
            ...createFlyFixture(606),
            charge: counterThresholdTicks - 1,
          },
          {
            ...createFlyFixture(707),
            charge: counterThresholdTicks - 1,
          },
        ],
      },
    };

    const nextState = moveFlies(state);
    const afterCooldownState = moveFlies(nextState);

    expect(nextState.currentGame?.penalties).toBe(1);
    expect(nextState.currentGame?.flies.every((fly) => fly.charge === 0)).toBe(
      true
    );
    expect(afterCooldownState.currentGame?.penalties).toBe(1);
  });

  it('残機を使い切るまでは介入を続けるべき', () => {
    const state = {
      ...startMeeting(),
      phase: 'swatting' as const,
      currentGame: {
        ...createGameFixture(),
        atSecond: boredomThresholdSeconds,
        penalties: maxPenalties - 2,
        flies: [
          {
            ...createFlyFixture(808),
            charge: counterThresholdTicks - 1,
          },
        ],
      },
    };

    const nextState = moveFlies(state);

    expect(nextState.phase).toBe('swatting');
    expect(nextState.currentGame?.penalties).toBe(maxPenalties - 1);
  });

  it('介入中のフィードバックで説明中と危険度を読めるべき', () => {
    const briefingFeedback = selectSwattingFeedback({
      ...createGameFixture(),
      graceTicks: openingGraceTicks,
    });
    const urgentFeedback = selectSwattingFeedback({
      ...createGameFixture(),
      graceTicks: 0,
      flies: [
        {
          ...createFlyFixture(909),
          charge: Math.ceil(counterThresholdTicks * 0.8),
        },
      ],
    });

    expect(briefingFeedback.isBriefing).toBe(true);
    expect(briefingFeedback.pressurePercent).toBe(0);
    expect(urgentFeedback.isBriefing).toBe(false);
    expect(urgentFeedback.dangerCount).toBe(1);
    expect(urgentFeedback.pressurePercent).toBeGreaterThanOrEqual(80);
  });
});
