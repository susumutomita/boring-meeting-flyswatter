import { describe, expect, it } from 'bun:test';
import {
  type ActiveGameSeed,
  type Fly,
  advanceMeeting,
  boredomThresholdSeconds,
  counterThresholdTicks,
  createInitialMeetingState,
  moveFlies,
  registerActivity,
  selectMeetingMetrics,
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

const createGameFixture = (): ActiveGameSeed => ({
  eventId: 1,
  durationSeconds: 10,
  remainingSeconds: 10,
  score: 0,
  penalties: 0,
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
      state = advanceMeeting(state, createGameFixture);
    }

    expect(state.phase).toBe('swatting');
    expect(state.currentGame?.flies).toHaveLength(2);
    expect(state.firstBoredomSecond).toBe(boredomThresholdSeconds);
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
    expect(nextState.lastActivityLabel).toBe('シャボン玉を割った');
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

  it('ゲーム介入中に退屈率が下がらないべき', () => {
    let state = startMeeting();
    state = advanceMeeting(state);
    state = registerActivity(state, '発言した');

    for (let index = 0; index < boredomThresholdSeconds; index += 1) {
      state = advanceMeeting(state, createGameFixture);
    }

    const beforeMetrics = selectMeetingMetrics(state);
    const nextState = advanceMeeting(state, createGameFixture);
    const afterMetrics = selectMeetingMetrics(nextState);

    expect(afterMetrics.boredomRate).toBeGreaterThanOrEqual(
      beforeMetrics.boredomRate
    );
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
    expect(nextState.lastActivityLabel).toBe('シャボン玉が反撃した');
  });

  it('同時に複数が溜まっても反撃は 1 回だけに抑えるべき', () => {
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

    expect(nextState.currentGame?.penalties).toBe(1);
  });
});
