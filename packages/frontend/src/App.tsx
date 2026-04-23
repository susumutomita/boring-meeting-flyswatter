import { type CSSProperties, useEffect, useState } from 'react';
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
  selectMeetingMetrics,
  startMeeting,
  swatFly,
  targetScore,
} from './lib/meeting';

const activityButtons = ['発言した', 'メモを取った', 'アジェンダを切り替えた'];

const App = () => {
  const [state, setState] = useState(createInitialMeetingState);

  const metrics = selectMeetingMetrics(state);
  const boredomGauge = getBoredomGauge(state);
  const isRunning = state.phase !== 'idle';

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
            無操作と無発話の空白を退屈度として検知し、しきい値に達した瞬間だけ
            ハエ叩きが起動します。笑えるのに、会議改善の指標として読める。
            そのギリギリを狙った、会議 UX の実験機です。
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
              <span>Bubble Pop Intervention</span>
              <span>
                {state.currentGame
                  ? `目標 ${targetScore} / 残機 ${
                      maxPenalties - state.currentGame.penalties
                    }`
                  : '待機'}
              </span>
            </div>

            <div className="arena">
              {state.currentGame ? (
                <>
                  <div className="arena-copy">
                    <p>
                      退屈を検知。高速で浮くシャボン玉を割って、会議の空気を起こしてください。
                    </p>
                    <strong>{state.currentGame.score} pts</strong>
                    <span className="arena-subscore">
                      score {state.currentGame.score} / damage{' '}
                      {state.currentGame.penalties}
                      {' / '}charge{' '}
                      {Math.round(
                        (state.currentGame.flies.reduce(
                          (sum, fly) => sum + fly.charge,
                          0
                        ) /
                          (state.currentGame.flies.length *
                            counterThresholdTicks)) *
                          100
                      )}
                      %
                    </span>
                  </div>

                  <div className="bubble-zone" data-no-activity-capture="true">
                    {state.currentGame.flies.map((fly) => (
                      <button
                        aria-label="シャボン玉を割る"
                        className="bubble"
                        key={fly.id}
                        onClick={() =>
                          setState((current) => swatFly(current, fly.id))
                        }
                        style={
                          {
                            '--fly-x': `${fly.x}%`,
                            '--fly-y': `${fly.y}%`,
                            '--fly-size': `${fly.size}px`,
                            '--fly-rotate': `${fly.rotation}deg`,
                            '--fly-hue': `${fly.hue}deg`,
                            '--bubble-threat': `${
                              fly.charge / counterThresholdTicks
                            }`,
                          } as CSSProperties
                        }
                        type="button"
                      />
                    ))}
                  </div>
                </>
              ) : (
                <div className="arena-idle">
                  <p>今は会議に空白がありません。</p>
                  <strong>
                    無操作が {boredomThresholdSeconds}{' '}
                    秒続くと、シャボン玉が現れます。
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
