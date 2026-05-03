import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { MeetingHud } from './components/MeetingHud';
import { MeetingSummary } from './components/MeetingSummary';
import { PipMeter } from './components/PipMeter';
import { SwatterArena } from './components/SwatterArena';
import { useActivityTracking } from './hooks/useActivityTracking';
import { useDocumentPip } from './hooks/useDocumentPip';
import { useMeetingTick } from './hooks/useMeetingTick';
import { useSwatter } from './hooks/useSwatter';
import { useTabAudioActivity } from './hooks/useTabAudioActivity';
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
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);

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

  const { isCapturing, levelDb } = useTabAudioActivity({
    enabled: audioEnabled && isRunning,
    onSpeech: () =>
      setState((current) => registerActivity(current, '発話を検知')),
    onError: (error) => {
      setAudioError(error.message);
      setAudioEnabled(false);
    },
    onCaptureEnd: () => {
      setAudioEnabled(false);
    },
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

  const pipEnabled = isRunning;
  const { pipWindow, isSupported: pipSupported } = useDocumentPip({
    enabled: pipEnabled,
  });

  useEffect(() => {
    if (!audioEnabled) {
      return;
    }
    setAudioError(null);
  }, [audioEnabled]);

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

  const audioToggleLabel = audioEnabled
    ? '音声共有を停止'
    : 'ミーティング音声を共有';

  const handleToastClick = () => {
    window.focus();
  };

  const pipNode =
    pipWindow && isRunning ? (
      <PipMeter
        boredomGauge={boredomGauge}
        isCapturing={isCapturing}
        speechLevelDb={levelDb}
        showToast={isSwatting}
        onToastClick={handleToastClick}
      />
    ) : null;

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
            {isRunning ? (
              <button
                className={`action ${audioEnabled ? 'action-primary' : ''}`}
                onClick={() => setAudioEnabled((current) => !current)}
                type="button"
              >
                {audioToggleLabel}
              </button>
            ) : null}
            <button
              className={`action ${primaryButton.primary ? 'action-primary' : ''}`}
              onClick={primaryButton.onClick}
              type="button"
            >
              {primaryButton.label}
            </button>
          </div>
        </header>

        {audioError ? (
          <output className="audio-error">{audioError}</output>
        ) : null}

        {!pipSupported && isRunning ? (
          <output className="pip-hint">
            このブラウザは PiP 非対応です。会議画面と並べてご利用ください。
          </output>
        ) : null}

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
              idleLabel={
                isIdle
                  ? '右上のボタンから'
                  : state.boredomGameTriggered
                    ? '退屈ポイント検知済み'
                    : '退屈到達まで'
              }
              idleValue={
                isIdle
                  ? 'ミーティング開始'
                  : state.boredomGameTriggered
                    ? '終了で振り返り'
                    : `${idleCountdown}s`
              }
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerEnter={handlePointerEnter}
              onPointerLeave={handlePointerLeave}
              onTargetClick={handleKeyboardSwat}
            />
          )}

          {isCompleted ? null : (
            <MeetingHud
              boredomGauge={boredomGauge}
              metrics={metrics}
              activityLabels={activityLabels}
              onActivity={(label) =>
                setState((current) => registerActivity(current, label))
              }
            />
          )}
        </section>
      </main>

      {pipWindow && pipNode
        ? createPortal(pipNode, pipWindow.document.body)
        : null}
    </div>
  );
};

export default App;
