import { useState } from 'react';
import { MeetingHud } from './components/MeetingHud';
import { MeetingSummary } from './components/MeetingSummary';
import { SwatterArena } from './components/SwatterArena';
import { useActivityTracking } from './hooks/useActivityTracking';
import { useMeetingTick } from './hooks/useMeetingTick';
import { useSwatter } from './hooks/useSwatter';
import {
  advanceMeeting,
  boredomThresholdSeconds,
  createGameSeed,
  createInitialMeetingState,
  endMeeting,
  getBoredomGauge,
  moveFlies,
  registerActivity,
  selectMeetingMetrics,
  selectSwattingFeedback,
  startMeeting,
  swatFly,
} from './lib/meeting';

const activityLabels = ['発言', 'メモ', '議題'] as const;

const phaseStatusLabel: Record<string, string> = {
  idle: '待機',
  monitoring: '監視中',
  swatting: '介入中',
  completed: '終了',
};

const App = () => {
  const [state, setState] = useState(createInitialMeetingState);

  const isRunning = state.phase === 'monitoring' || state.phase === 'swatting';
  const isSwatting = state.phase === 'swatting';
  const isCompleted = state.phase === 'completed';
  const isIdle = state.phase === 'idle';
  const flies = state.currentGame?.flies ?? [];

  useMeetingTick({
    isRunning,
    isSwatting,
    onSecondTick: () =>
      setState((current) => advanceMeeting(current, createGameSeed)),
    onFlyTick: () => setState((current) => moveFlies(current)),
  });

  useActivityTracking({
    enabled: isRunning,
    onActivity: (label) =>
      setState((current) => registerActivity(current, label)),
  });

  const {
    swatter,
    knockedFlyIds,
    handlePointerMove,
    handlePointerDown,
    handlePointerEnter,
    handlePointerLeave,
    handleKeyboardSwat,
  } = useSwatter({
    isActive: state.currentGame !== null,
    flies,
    onSwatFly: (flyId) => setState((current) => swatFly(current, flyId)),
  });

  const metrics = selectMeetingMetrics(state);
  const boredomGauge = getBoredomGauge(state);
  const swattingFeedback = state.currentGame
    ? selectSwattingFeedback(state.currentGame)
    : null;
  const idleCountdown = Math.max(
    0,
    boredomThresholdSeconds - state.inactiveSeconds
  );

  const primaryButton = isIdle
    ? {
        label: 'ミーティング開始',
        onClick: () => setState(startMeeting()),
        primary: true,
      }
    : isCompleted
      ? {
          label: 'もう一度',
          onClick: () => setState(createInitialMeetingState()),
          primary: true,
        }
      : {
          label: 'ミーティング終了',
          onClick: () => setState((current) => endMeeting(current)),
          primary: false,
        };

  return (
    <div className="shell simple-shell">
      <main className="game-board">
        <header className="game-topbar">
          <div className="brand-lockup" aria-label="Boring Meeting Flyswatter">
            <span className="brand-mark">BMF</span>
            <span className="game-status">
              {phaseStatusLabel[state.phase] ?? '待機'}
            </span>
          </div>

          <div className="top-actions" data-no-activity-capture="true">
            <button
              className={`action ${primaryButton.primary ? 'action-primary' : ''}`}
              onClick={primaryButton.onClick}
              type="button"
            >
              {primaryButton.label}
            </button>
          </div>
        </header>

        <section className="play-grid simple-play-grid">
          {isCompleted ? (
            <MeetingSummary
              state={state}
              onRestart={() => setState(createInitialMeetingState())}
            />
          ) : (
            <SwatterArena
              game={state.currentGame}
              feedback={swattingFeedback}
              swatter={swatter}
              knockedFlyIds={knockedFlyIds}
              idleLabel={isIdle ? 'READY' : '監視中'}
              idleValue={isIdle ? 'START' : idleCountdown}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerEnter={handlePointerEnter}
              onPointerLeave={handlePointerLeave}
              onTargetClick={handleKeyboardSwat}
            />
          )}

          <MeetingHud
            boredomGauge={boredomGauge}
            metrics={metrics}
            activityLabels={activityLabels}
            onActivity={(label) =>
              setState((current) => registerActivity(current, label))
            }
          />
        </section>
      </main>
    </div>
  );
};

export default App;
