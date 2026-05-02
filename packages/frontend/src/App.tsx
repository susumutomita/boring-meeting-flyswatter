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

const activityButtons = ['発言した', 'メモを取った', 'アジェンダを切り替えた'];
const swatImpactDelayMs = 90;
const swatRecoverDelayMs = 260;
const splatLifetimeMs = 680;

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

type SwatterPose = ArenaPoint & {
  rotation: number;
  swingKey: number;
  isTracking: boolean;
  isSwinging: boolean;
  impact: SwatImpact | null;
  splats: FlySplat[];
};

const initialSwatterPose: SwatterPose = {
  x: 52,
  y: 58,
  rotation: -8,
  swingKey: 0,
  isTracking: false,
  isSwinging: false,
  impact: null,
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

  const triggerSwatAt = (point: ArenaPoint, targetFlyId: number | null) => {
    nextEffectIdRef.current += 1;
    const effectId = nextEffectIdRef.current;
    const splatRotation = -22 + (effectId % 6) * 8;

    setSwatter((current) => ({
      ...current,
      ...point,
      swingKey: effectId,
      isTracking: true,
      isSwinging: true,
      impact: {
        ...point,
        id: effectId,
      },
    }));

    scheduleSwatterTimeout(() => {
      if (targetFlyId === null) {
        return;
      }

      setState((current) => swatFly(current, targetFlyId));
      setSwatter((current) => ({
        ...current,
        splats: [
          ...current.splats.slice(-7),
          {
            ...point,
            id: effectId,
            rotation: splatRotation,
          },
        ],
      }));

      scheduleSwatterTimeout(() => {
        setSwatter((current) => ({
          ...current,
          splats: current.splats.filter((splat) => splat.id !== effectId),
        }));
      }, splatLifetimeMs);
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
      rotation: Math.max(-14, Math.min(12, -7 + horizontalMotion * 1.15)),
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
    const targetFlyId = selectFlyInSwatReach(state.currentGame.flies, point, {
      width: rect.width,
      height: rect.height,
    });

    triggerSwatAt(point, targetFlyId);
  };

  const handleKeyboardSwat = (flyId: number, point: ArenaPoint) => {
    triggerSwatAt(point, flyId);
  };

  return (
    <div className="shell">
      <div className="ambient ambient-left" />
      <div className="ambient ambient-right" />

      <main className="board">
        <section className="hero panel">
          <div className="eyebrow">Meeting Boredom Meter / Hackathon Demo</div>
          <p className="hero-kicker">会議の退屈さを、行動に変える。</p>
          <h1>ハエが出る会議は、何かが足りないです。</h1>
          <p className="hero-copy">
            会議の空白時間を退屈の兆候として捉え、しきい値に達した瞬間だけ
            ミニゲームが立ち上がります。ふざけて見えるのに、会議のテンポや密度を
            見直すきっかけになる。その境界を狙った、会議 UX の実験機です。
          </p>

          <div className="hero-actions" data-no-activity-capture="true">
            <button
              className="action action-primary"
              onClick={() => setState(startMeeting())}
              type="button"
            >
              {state.phase === 'idle' ? '会議を開始' : 'もう一度デモする'}
            </button>
            <button
              className="action"
              onClick={() => setState(createInitialMeetingState())}
              type="button"
            >
              リセット
            </button>
          </div>
        </section>

        <section className="play-grid">
          <article className="panel live-panel">
            <div className="panel-header">
              <span>Live Meter</span>
              <span>{formatClock(state.meetingSeconds)}</span>
            </div>

            <div className="meter-wrap">
              <div className="meter-labels">
                <span>静かな時間</span>
                <span>{Math.round(boredomGauge)}%</span>
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

            <div className="status-strip">
              <div>
                <span className="status-label">状態</span>
                <strong>
                  {state.phase === 'idle'
                    ? '待機中'
                    : state.phase === 'monitoring'
                      ? '会議を監視中'
                      : '退屈を検知して介入中'}
                </strong>
              </div>
              <div>
                <span className="status-label">直近の反応</span>
                <strong>{state.lastActivityLabel}</strong>
              </div>
              <div>
                <span className="status-label">検知できるもの</span>
                <strong>
                  キー入力 / ポインター / フォーカス復帰 / タブ復帰
                </strong>
              </div>
            </div>

            <div className="activity-dock" data-no-activity-capture="true">
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
          </article>

          <article className="panel arena-panel">
            <div className="panel-header">
              <span>Flyswatter Intervention</span>
              <span>
                {state.currentGame
                  ? `残り ${formatClock(state.currentGame.remainingSeconds)} / 目標 ${targetScore} / 残機 ${
                      maxPenalties - state.currentGame.penalties
                    }`
                  : '待機'}
              </span>
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
                  <div className="arena-copy">
                    <p>{swattingFeedback?.detail}</p>
                    <strong>{state.currentGame.score} pts</strong>
                    <div className="arena-feedback">
                      <span className="feedback-headline">
                        {swattingFeedback?.headline}
                      </span>
                      <span>
                        残り {formatClock(state.currentGame.remainingSeconds)}
                      </span>
                      <span>圧 {swattingFeedback?.pressurePercent ?? 0}%</span>
                      <span>危険 {swattingFeedback?.dangerCount ?? 0}</span>
                    </div>
                    <div
                      aria-label="反撃圧"
                      aria-valuemax={100}
                      aria-valuemin={0}
                      aria-valuenow={swattingFeedback?.pressurePercent ?? 0}
                      className="pressure-meter"
                      role="progressbar"
                      tabIndex={0}
                    >
                      <span />
                    </div>
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
                    {state.currentGame.flies.map((fly) => (
                      <button
                        aria-label="ハエを叩く"
                        className={`fly-target ${
                          fly.charge / counterThresholdTicks >= 0.72
                            ? 'is-danger'
                            : ''
                        }`}
                        key={fly.id}
                        onClick={(event) => {
                          if (event.detail === 0) {
                            handleKeyboardSwat(fly.id, {
                              x: fly.x,
                              y: fly.y,
                            });
                          }
                        }}
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
                      } ${swatter.isSwinging ? 'is-swinging' : ''}`}
                      key={swatter.swingKey}
                      style={
                        {
                          '--swatter-x': `${swatter.x}%`,
                          '--swatter-y': `${swatter.y}%`,
                          '--swatter-rotate': `${swatter.rotation}deg`,
                        } as CSSProperties
                      }
                    >
                      <span className="swatter-head" />
                      <span className="swatter-handle" />
                    </span>
                  </div>
                </>
              ) : (
                <div className="arena-idle">
                  <p>今は会議に空白がありません。</p>
                  <strong>
                    無操作が {boredomThresholdSeconds}{' '}
                    秒続くと、ハエが現れます。
                  </strong>
                </div>
              )}
            </div>
          </article>
        </section>

        <section className="metrics-grid">
          <article className="metric-card">
            <span>退屈イベント</span>
            <strong>{metrics.boredomEvents}</strong>
          </article>
          <article className="metric-card">
            <span>初回発生まで</span>
            <strong>
              {metrics.firstBoredomSecond
                ? formatClock(metrics.firstBoredomSecond)
                : '--:--'}
            </strong>
          </article>
          <article className="metric-card">
            <span>平均ハエ叩き数</span>
            <strong>{metrics.averageSwatsPerEvent.toFixed(1)}</strong>
          </article>
          <article className="metric-card">
            <span>退屈率</span>
            <strong>{formatPercent(metrics.boredomRate)}</strong>
          </article>
        </section>

        <section className="notes panel">
          <div>
            <div className="eyebrow">Why It Works</div>
            <h2>退屈は感想ではなく、行動として観測できる。</h2>
          </div>
          <div className="note-grid">
            <p>
              人を評価するためではなく、会議の設計を見直すためのセンサーとして使う。
            </p>
            <p>
              退屈が発生するまでの時間、発生回数、介入のされ方をまとめて読むことで、
              会議の密度を見直せます。
            </p>
            <p>
              ミニゲームに逃がすことで、ただの監視 UI
              ではなく、少し笑える改善材料へ変換します。
            </p>
          </div>
        </section>
      </main>
    </div>
  );
};

export default App;
