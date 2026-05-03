import { useState } from 'react';
import { MeetingHud } from './components/MeetingHud';
import { SwatterArena } from './components/SwatterArena';
import { useActivityTracking } from './hooks/useActivityTracking';
import { useMeetingTick } from './hooks/useMeetingTick';
import { useSwatter } from './hooks/useSwatter';
import {
  advanceMeeting,
  boredomThresholdSeconds,
  createGameSeed,
  createInitialMeetingState,
  getBoredomGauge,
  moveFlies,
  registerActivity,
  selectMeetingMetrics,
  selectSwattingFeedback,
  startMeeting,
  swatFly,
} from './lib/meeting';

const activityLabels = ['発言', 'メモ', '議題'] as const;

const App = () => {
  const [state, setState] = useState(createInitialMeetingState);

  const isRunning = state.phase !== 'idle';
  const isSwatting = state.phase === 'swatting';
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
          <SwatterArena
            game={state.currentGame}
            feedback={swattingFeedback}
            swatter={swatter}
            knockedFlyIds={knockedFlyIds}
            idleLabel={state.phase === 'idle' ? 'READY' : 'WAIT'}
            idleValue={state.phase === 'idle' ? 'START' : idleCountdown}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerEnter={handlePointerEnter}
            onPointerLeave={handlePointerLeave}
            onTargetClick={handleKeyboardSwat}
          />

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
