import {
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  advanceMeeting,
  boredomThresholdSeconds,
  counterThresholdTicks,
  createGameSeed,
  createInitialMeetingState,
  formatClock,
  formatPercent,
  getBoredomGauge,
  maxPenalties,
  moveFlies,
  registerActivity,
  selectFlyInSwatReach,
  selectMeetingMetrics,
  selectSwattingFeedback,
  startMeeting,
  swatFly,
  targetScore,
} from './lib/meeting';

const activityButtons = ['発言', 'メモ', '議題'];
const swatImpactDelayMs = 70;
const knockdownLifetimeMs = 620;
const swatRecoverDelayMs = 190;
const splatLifetimeMs = 420;

type ArenaPoint = {
  x: number;
  y: number;
};

type SwatImpact = ArenaPoint & {
  id: number;
};

type FlySplat = SwatImpact & {
  rotation: number;
};

type KnockedFly = SwatImpact & {
  drift: number;
  flyId: number;
  rotation: number;
};

type SwatTarget = ArenaPoint & {
  flyId: number;
};

type SwatterPose = ArenaPoint & {
  rotation: number;
  swingKey: number;
  isTracking: boolean;
  isSwinging: boolean;
  impact: SwatImpact | null;
  knockdowns: KnockedFly[];
  splats: FlySplat[];
};

const initialSwatterPose: SwatterPose = {
  x: 52,
  y: 58,
  rotation: 0,
  swingKey: 0,
  isTracking: false,
  isSwinging: false,
  impact: null,
  knockdowns: [],
  splats: [],
};

const clampPercent = (value: number) => Math.min(100, Math.max(0, value));

const getArenaPoint = (
  rect: DOMRect,
  clientX: number,
  clientY: number
): ArenaPoint => ({
  x: clampPercent(((clientX - rect.left) / rect.width) * 100),
  y: clampPercent(((clientY - rect.top) / rect.height) * 100),
});

const App = () => {
  const [state, setState] = useState(createInitialMeetingState);
  const [swatter, setSwatter] = useState(initialSwatterPose);
  const flyZoneRef = useRef<HTMLDivElement | null>(null);
  const lastPointerRef = useRef<ArenaPoint | null>(null);
  const scheduledTimeoutsRef = useRef<number[]>([]);
  const nextEffectIdRef = useRef(0);

  const metrics = selectMeetingMetrics(state);
  const boredomGauge = getBoredomGauge(state);
  const isRunning = state.phase !== 'idle';
  const swattingFeedback = state.currentGame
    ? selectSwattingFeedback(state.currentGame)
    : null;
  const gameScore = state.currentGame?.score ?? 0;
  const gameTime = state.currentGame
    ? formatClock(state.currentGame.remainingSeconds)
    : formatClock(0);
  const gameLives = state.currentGame
    ? maxPenalties - state.currentGame.penalties
    : maxPenalties;
  const idleCountdown = Math.max(
    0,
    boredomThresholdSeconds - state.inactiveSeconds
  );
  const knockedFlyIds = new Set(
    swatter.knockdowns.map((knockdown) => knockdown.flyId)
  );

  const scheduleSwatterTimeout = (callback: () => void, delay: number) => {
    const timeoutId = window.setTimeout(() => {
      callback();
      scheduledTimeoutsRef.current = scheduledTimeoutsRef.current.filter(
        (scheduledTimeoutId) => scheduledTimeoutId !== timeoutId
      );
    }, delay);

    scheduledTimeoutsRef.current.push(timeoutId);
  };

  useEffect(() => {
    if (!isRunning) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setState((current) => advanceMeeting(current, createGameSeed));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isRunning]);

  useEffect(() => {
    if (state.phase !== 'swatting') {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setState((current) => moveFlies(current));
    }, 90);

    return () => window.clearInterval(timer);
  }, [state.phase]);

  useEffect(() => {
    if (!isRunning) {
      return undefined;
    }

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.repeat) {
        return;
      }

      setState((current) => registerActivity(current, 'キーボード入力'));
    };

    const handlePointerdown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;

      if (target?.closest('[data-no-activity-capture="true"]')) {
        return;
      }

      setState((current) => registerActivity(current, 'ポインター操作'));
    };

    const handleInput = () => {
      setState((current) => registerActivity(current, '入力を検知'));
    };

    const handleFocus = () => {
      setState((current) => registerActivity(current, 'ページに戻った'));
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setState((current) => registerActivity(current, 'タブに戻った'));
      }
    };

    window.addEventListener('keydown', handleKeydown);
    window.addEventListener('pointerdown', handlePointerdown);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('input', handleInput, true);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('keydown', handleKeydown);
      window.removeEventListener('pointerdown', handlePointerdown);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('input', handleInput, true);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isRunning]);

  useEffect(
    () => () => {
      for (const timeoutId of scheduledTimeoutsRef.current) {
        window.clearTimeout(timeoutId);
      }
    },
    []
  );

  useEffect(() => {
    if (state.phase === 'swatting') {
      return;
    }

    lastPointerRef.current = null;
    setSwatter((current) => ({
      ...initialSwatterPose,
      x: current.x,
      y: current.y,
    }));
  }, [state.phase]);

  const triggerSwatAt = (point: ArenaPoint, target: SwatTarget | null) => {
    nextEffectIdRef.current += 1;
    const effectId = nextEffectIdRef.current;
    const effectPoint = target ?? point;
    const effectRotation = -18 + (effectId % 5) * 9;

    setSwatter((current) => ({
      ...current,
      ...point,
      swingKey: effectId,
      isTracking: true,
      isSwinging: true,
      impact: {
        ...effectPoint,
        id: effectId,
      },
    }));

    scheduleSwatterTimeout(() => {
      if (target === null) {
        return;
      }

      setSwatter((current) => ({
        ...current,
        knockdowns: [
          ...current.knockdowns.slice(-5),
          {
            ...target,
            drift: effectId % 2 === 0 ? -18 : 18,
            flyId: target.flyId,
            id: effectId,
            rotation: effectRotation,
          },
        ],
      }));

      scheduleSwatterTimeout(() => {
        setState((current) => swatFly(current, target.flyId));
        setSwatter((current) => ({
          ...current,
          knockdowns: current.knockdowns.filter(
            (knockdown) => knockdown.id !== effectId
          ),
          splats: [
            ...current.splats.slice(-7),
            {
              ...target,
              id: effectId,
              rotation: effectRotation,
              y: Math.min(94, target.y + 22),
            },
          ],
        }));

        scheduleSwatterTimeout(() => {
          setSwatter((current) => ({
            ...current,
            splats: current.splats.filter((splat) => splat.id !== effectId),
          }));
        }, splatLifetimeMs);
      }, knockdownLifetimeMs);

      scheduleSwatterTimeout(() => {
        setSwatter((current) => ({
          ...current,
          knockdowns: current.knockdowns.filter(
            (knockdown) => knockdown.id !== effectId
          ),
        }));
      }, knockdownLifetimeMs + splatLifetimeMs);
    }, swatImpactDelayMs);

    scheduleSwatterTimeout(() => {
      setSwatter((current) => ({
        ...current,
        isSwinging: false,
        impact: current.impact?.id === effectId ? null : current.impact,
      }));
    }, swatRecoverDelayMs);
  };

  const handleSwatterPointerMove = (
    event: ReactPointerEvent<HTMLDivElement>
  ) => {
    if (!state.currentGame) {
      return;
    }

    const point = getArenaPoint(
      event.currentTarget.getBoundingClientRect(),
      event.clientX,
      event.clientY
    );
    const previousPoint = lastPointerRef.current;
    const horizontalMotion = previousPoint ? point.x - previousPoint.x : 0;
    lastPointerRef.current = point;

    setSwatter((current) => ({
      ...current,
      ...point,
      rotation: Math.max(-5, Math.min(5, horizontalMotion * 0.45)),
      isTracking: true,
    }));
  };

  const handleSwatterPointerDown = (
    event: ReactPointerEvent<HTMLDivElement>
  ) => {
    if (!state.currentGame) {
      return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);

    const rect = event.currentTarget.getBoundingClientRect();
    const point = getArenaPoint(rect, event.clientX, event.clientY);
    const availableFlies = state.currentGame.flies.filter(
      (fly) => !knockedFlyIds.has(fly.id)
    );
    const targetFlyId = selectFlyInSwatReach(availableFlies, point, {
      width: rect.width,
      height: rect.height,
    });
    const targetFly =
      availableFlies.find((fly) => fly.id === targetFlyId) ?? null;

    triggerSwatAt(
      point,
      targetFly
        ? {
            flyId: targetFly.id,
            x: targetFly.x,
            y: targetFly.y,
          }
        : null
    );
  };

  const handleKeyboardSwat = (target: SwatTarget) => {
    triggerSwatAt(target, target);
  };

  return (
    <div className="shell simple-shell">
      <main className="game-board">
        <header className="game-topbar">
          <div className="brand-lockup" aria-label="Boring Meeting Flyswatter">
            <span className="brand-mark">BMF</span>
            <span className="game-status">
              {state.phase === 'idle'
                ? 'READY'
                : state.phase === 'monitoring'
                  ? 'WAIT'
                  : 'SWAT'}
            </span>
          </div>

          <div className="top-actions" data-no-activity-capture="true">
            <button
              className="action action-primary"
              onClick={() => setState(startMeeting())}
              type="button"
            >
              START
            </button>
            <button
              className="action"
              onClick={() => setState(createInitialMeetingState())}
              type="button"
            >
              RESET
            </button>
          </div>
        </header>

        <section className="play-grid simple-play-grid">
          <article className="panel arena-panel game-panel">
            <div className="game-scorebar">
              <div className="score-pill">
                <span>SCORE</span>
                <strong>
                  {gameScore}/{targetScore}
                </strong>
              </div>
              <div className="score-pill">
                <span>TIME</span>
                <strong>{gameTime}</strong>
              </div>
              <div className="score-pill">
                <span>LIFE</span>
                <strong>{gameLives}</strong>
              </div>
            </div>

            <div
              className={`arena ${state.currentGame ? 'arena-active' : ''} ${
                swattingFeedback?.isBriefing ? 'is-briefing' : ''
              }`}
              style={
                {
                  '--arena-pressure': `${
                    swattingFeedback ? swattingFeedback.pressurePercent : 0
                  }%`,
                } as CSSProperties
              }
            >
              {state.currentGame ? (
                <>
                  <div className="arena-score" aria-hidden="true">
                    {state.currentGame.score}
                  </div>
                  <div
                    aria-label="反撃圧"
                    aria-valuemax={100}
                    aria-valuemin={0}
                    aria-valuenow={swattingFeedback?.pressurePercent ?? 0}
                    className="arena-pressure"
                    role="progressbar"
                    tabIndex={0}
                  >
                    <span />
                  </div>

                  <div
                    className="fly-zone"
                    data-no-activity-capture="true"
                    onPointerDown={handleSwatterPointerDown}
                    onPointerEnter={() =>
                      setSwatter((current) => ({
                        ...current,
                        isTracking: true,
                      }))
                    }
                    onPointerLeave={() => {
                      lastPointerRef.current = null;
                      setSwatter((current) => ({
                        ...current,
                        isTracking: current.isSwinging,
                      }));
                    }}
                    onPointerMove={handleSwatterPointerMove}
                    ref={flyZoneRef}
                  >
                    {state.currentGame.flies
                      .filter((fly) => !knockedFlyIds.has(fly.id))
                      .map((fly) => (
                        <button
                          aria-label="ハエを叩く"
                          className={`fly-target ${
                            fly.charge / counterThresholdTicks >= 0.72
                              ? 'is-danger'
                              : ''
                          }`}
                          key={fly.id}
                          onClick={(event) => {
                            event.stopPropagation();
                            handleKeyboardSwat({
                              flyId: fly.id,
                              x: fly.x,
                              y: fly.y,
                            });
                          }}
                          onPointerDown={(event) => event.stopPropagation()}
                          style={
                            {
                              '--fly-x': `${fly.x}%`,
                              '--fly-y': `${fly.y}%`,
                              '--fly-size': `${fly.size}px`,
                              '--fly-rotate': `${fly.rotation}deg`,
                              '--fly-hue': `${fly.hue}deg`,
                              '--fly-threat': `${
                                fly.charge / counterThresholdTicks
                              }`,
                              '--fly-scale': `${
                                1 + (fly.charge / counterThresholdTicks) * 0.18
                              }`,
                            } as CSSProperties
                          }
                          type="button"
                        >
                          <span className="fly-wing fly-wing-left" />
                          <span className="fly-wing fly-wing-right" />
                          <span className="fly-body" />
                          <span className="fly-head" />
                        </button>
                      ))}
                    {swatter.knockdowns.map((knockdown) => (
                      <span
                        aria-hidden="true"
                        className="fly-knockdown"
                        key={knockdown.id}
                        style={
                          {
                            '--knock-drift': `${knockdown.drift}px`,
                            '--knock-rotate': `${knockdown.rotation}deg`,
                            '--knock-x': `${knockdown.x}%`,
                            '--knock-y': `${knockdown.y}%`,
                          } as CSSProperties
                        }
                      >
                        <span className="fly-wing fly-wing-left" />
                        <span className="fly-wing fly-wing-right" />
                        <span className="fly-body" />
                        <span className="fly-head" />
                      </span>
                    ))}
                    {swatter.splats.map((splat) => (
                      <span
                        aria-hidden="true"
                        className="fly-splat"
                        key={splat.id}
                        style={
                          {
                            '--splat-x': `${splat.x}%`,
                            '--splat-y': `${splat.y}%`,
                            '--splat-rotate': `${splat.rotation}deg`,
                          } as CSSProperties
                        }
                      />
                    ))}
                    {swatter.impact ? (
                      <span
                        aria-hidden="true"
                        className="swat-impact"
                        key={swatter.impact.id}
                        style={
                          {
                            '--impact-x': `${swatter.impact.x}%`,
                            '--impact-y': `${swatter.impact.y}%`,
                          } as CSSProperties
                        }
                      />
                    ) : null}
                    <span
                      aria-hidden="true"
                      className={`fly-swatter ${
                        swatter.isTracking ? 'is-tracking' : ''
                      }`}
                      style={
                        {
                          '--swatter-x': `${swatter.x}%`,
                          '--swatter-y': `${swatter.y}%`,
                          '--swatter-rotate': `${swatter.rotation}deg`,
                        } as CSSProperties
                      }
                    >
                      <span
                        className={`fly-swatter-anim ${
                          swatter.isSwinging ? 'is-swinging' : ''
                        }`}
                        key={swatter.swingKey}
                      >
                        <span className="swatter-head" />
                        <span className="swatter-handle" />
                        <span className="swatter-hand" />
                      </span>
                    </span>
                  </div>
                </>
              ) : (
                <div className="arena-idle">
                  <span>{state.phase === 'idle' ? 'READY' : 'WAIT'}</span>
                  <strong>
                    {state.phase === 'idle' ? 'START' : idleCountdown}
                  </strong>
                </div>
              )}
            </div>
          </article>

          <aside className="panel live-panel compact-panel">
            <div className="compact-meter">
              <div className="compact-meter-head">
                <span>退屈</span>
                <strong>{Math.round(boredomGauge)}%</strong>
              </div>
              <div
                aria-label="退屈度メーター"
                aria-valuemax={100}
                aria-valuemin={0}
                aria-valuenow={Math.round(boredomGauge)}
                className="meter"
                role="progressbar"
                tabIndex={0}
              >
                <div
                  className="meter-fill"
                  style={
                    {
                      '--meter-width': `${boredomGauge}%`,
                    } as CSSProperties
                  }
                />
              </div>
            </div>

            <div className="activity-pad" data-no-activity-capture="true">
              {activityButtons.map((label) => (
                <button
                  className="activity-chip"
                  key={label}
                  onClick={() =>
                    setState((current) => registerActivity(current, label))
                  }
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="side-stats">
              <div className="stat-tile">
                <span>回数</span>
                <strong>{metrics.boredomEvents}</strong>
              </div>
              <div className="stat-tile">
                <span>初回</span>
                <strong>
                  {metrics.firstBoredomSecond
                    ? formatClock(metrics.firstBoredomSecond)
                    : '--:--'}
                </strong>
              </div>
              <div className="stat-tile">
                <span>平均</span>
                <strong>{metrics.averageSwatsPerEvent.toFixed(1)}</strong>
              </div>
              <div className="stat-tile">
                <span>率</span>
                <strong>{formatPercent(metrics.boredomRate)}</strong>
              </div>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
};

export default App;
