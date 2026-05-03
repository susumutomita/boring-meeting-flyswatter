import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MeetingHud } from './components/MeetingHud';
import { MeetingSummary } from './components/MeetingSummary';
import { PipMeter } from './components/PipMeter';
import { ReasonAggregate } from './components/ReasonAggregate';
import { ReasonPicker } from './components/ReasonPicker';
import { RoomConnect } from './components/RoomConnect';
import { ScoreLeaderboard } from './components/ScoreLeaderboard';
import { SwatterArena } from './components/SwatterArena';
import { useActivityTracking } from './hooks/useActivityTracking';
import { useDocumentPip } from './hooks/useDocumentPip';
import { useMeetingTick } from './hooks/useMeetingTick';
import { useMicrophoneActivity } from './hooks/useMicrophoneActivity';
import { useScoreShare } from './hooks/useScoreShare';
import { useSwatter } from './hooks/useSwatter';
import { useTabAudioActivity } from './hooks/useTabAudioActivity';
import {
  advanceMeeting,
  createGameSeed,
  createInitialMeetingState,
  endMeeting,
  moveFlies,
  registerActivity,
  selectMeetingMetrics,
  selectSwattingFeedback,
  startMeeting,
  swatFly,
  swatTreat,
  toggleBoredomReason,
} from './lib/meeting';
import {
  type ScoreSnapshot,
  sanitizeDisplayName,
  sanitizeRoomCode,
} from './lib/scoreShare';

const phaseStatusLabel: Record<string, string> = {
  idle: '待機',
  monitoring: '進行中',
  swatting: 'ハエ叩き中',
  completed: '終了',
};

const readPersisted = (key: string, fallback: string): string => {
  if (typeof window === 'undefined') {
    return fallback;
  }
  try {
    return window.localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
};

const writePersisted = (key: string, value: string) => {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // ignore storage failures (private mode, quota)
  }
};

const ensureSelfPeerId = (): string => {
  const persisted = readPersisted('bmf:self-peer-id', '');
  if (persisted.length > 0) {
    return persisted;
  }
  const generated =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `peer-${Math.random().toString(36).slice(2, 10)}`;
  writePersisted('bmf:self-peer-id', generated);
  return generated;
};

type AudioSource = 'off' | 'tab' | 'mic';

const App = () => {
  const [state, setState] = useState(createInitialMeetingState);
  const [audioSource, setAudioSource] = useState<AudioSource>('off');
  const [audioError, setAudioError] = useState<string | null>(null);
  const [roomCodeInput, setRoomCodeInput] = useState(() =>
    readPersisted('bmf:room-code', '')
  );
  const [displayNameInput, setDisplayNameInput] = useState(() =>
    readPersisted('bmf:display-name', '')
  );
  const [isShareJoined, setIsShareJoined] = useState(false);
  const [bestScore, setBestScore] = useState(0);
  const [treatBoostPopup, setTreatBoostPopup] = useState<{
    id: number;
    x: number;
    y: number;
  } | null>(null);
  const treatPopupIdRef = useRef(0);
  const selfPeerId = useMemo(ensureSelfPeerId, []);

  const sanitizedRoomCode = sanitizeRoomCode(roomCodeInput);
  const sanitizedDisplayName = sanitizeDisplayName(displayNameInput);

  useEffect(() => {
    writePersisted('bmf:room-code', roomCodeInput);
  }, [roomCodeInput]);

  useEffect(() => {
    writePersisted('bmf:display-name', displayNameInput);
  }, [displayNameInput]);

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

  const handleSpeech = () =>
    setState((current) => registerActivity(current, '発話を検知'));
  const handleAudioError = (error: Error) => {
    setAudioError(error.message);
    setAudioSource('off');
  };
  const handleCaptureEnd = () => {
    setAudioSource('off');
  };

  const tabAudio = useTabAudioActivity({
    enabled: audioSource === 'tab' && isRunning,
    onSpeech: handleSpeech,
    onError: handleAudioError,
    onCaptureEnd: handleCaptureEnd,
  });
  const micAudio = useMicrophoneActivity({
    enabled: audioSource === 'mic' && isRunning,
    onSpeech: handleSpeech,
    onError: handleAudioError,
    onCaptureEnd: handleCaptureEnd,
  });

  const isCapturing =
    audioSource === 'tab' ? tabAudio.isCapturing : micAudio.isCapturing;
  const levelDb =
    audioSource === 'tab'
      ? tabAudio.levelDb
      : audioSource === 'mic'
        ? micAudio.levelDb
        : Number.NEGATIVE_INFINITY;

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

  useEffect(() => {
    const currentScore = state.currentGame?.score ?? 0;
    if (currentScore > bestScore) {
      setBestScore(currentScore);
    }
    if (state.phase === 'completed') {
      const completed = state.completedEvents[0];
      if (completed && completed.swats > bestScore) {
        setBestScore(completed.swats);
      }
    }
  }, [state, bestScore]);

  const localSnapshot = useMemo<ScoreSnapshot>(
    () => ({
      peerId: selfPeerId,
      displayName: sanitizedDisplayName,
      score: state.currentGame?.score ?? 0,
      bestScore,
      phase: state.phase,
      updatedAt: Date.now(),
      reasons: state.boredomReasons,
      swattingStartedAt: state.swattingStartedAt,
    }),
    [
      selfPeerId,
      sanitizedDisplayName,
      state.currentGame?.score,
      state.phase,
      bestScore,
      state.boredomReasons,
      state.swattingStartedAt,
    ]
  );

  const {
    peers: sharedPeers,
    status: shareStatus,
    participantCount,
  } = useScoreShare({
    enabled: isShareJoined,
    roomCode: sanitizedRoomCode,
    localSnapshot,
  });

  const metrics = selectMeetingMetrics(state);
  const swattingFeedback = state.currentGame
    ? selectSwattingFeedback(state.currentGame)
    : null;

  const pipEnabled = isRunning;
  const { pipWindow, isSupported: pipSupported } = useDocumentPip({
    enabled: pipEnabled,
  });

  useEffect(() => {
    if (audioSource === 'off') {
      return;
    }
    setAudioError(null);
  }, [audioSource]);

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

  const cycleAudioSource = () => {
    setAudioSource((current) => {
      if (current === 'off') return 'tab';
      if (current === 'tab') return 'mic';
      return 'off';
    });
  };

  const audioSourceLabel: Record<AudioSource, string> = {
    off: '音声検知 オフ',
    tab: 'タブ音声で検知',
    mic: 'マイクで検知',
  };

  const handleToastClick = () => {
    window.focus();
  };

  const pipNode =
    pipWindow && isRunning ? (
      <PipMeter
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
                className={`action ${audioSource !== 'off' ? 'action-primary' : ''}`}
                onClick={cycleAudioSource}
                title="クリックで切替: オフ → タブ音声 → マイク"
                type="button"
              >
                {audioSourceLabel[audioSource]}
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
          <div className="audio-error">
            <output>{audioError}</output>
            <div className="audio-error-actions">
              <button
                className="action"
                onClick={() => {
                  setAudioError(null);
                  setAudioSource('off');
                  window.requestAnimationFrame(() => setAudioSource('tab'));
                }}
                type="button"
              >
                タブ音声で再試行
              </button>
              <button
                className="action"
                onClick={() => {
                  setAudioError(null);
                  setAudioSource('mic');
                }}
                type="button"
              >
                マイク検知に切替
              </button>
              <button
                className="action"
                onClick={() => {
                  setAudioError(null);
                  setAudioSource('off');
                }}
                type="button"
              >
                閉じる
              </button>
            </div>
          </div>
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
                    : '会議を観測中'
              }
              idleValue={
                isIdle
                  ? 'ミーティング開始'
                  : state.boredomGameTriggered
                    ? '終了で振り返り'
                    : '沈黙を待機'
              }
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerEnter={handlePointerEnter}
              onPointerLeave={handlePointerLeave}
              onTargetClick={handleKeyboardSwat}
              onTreatClick={(point) => {
                treatPopupIdRef.current += 1;
                const popupId = treatPopupIdRef.current;
                setTreatBoostPopup({ id: popupId, x: point.x, y: point.y });
                setState((current) => swatTreat(current));
                window.setTimeout(() => {
                  setTreatBoostPopup((current) =>
                    current && current.id === popupId ? null : current
                  );
                }, 1100);
              }}
              treatBoostPopup={treatBoostPopup}
            />
          )}

          {isCompleted ? null : (
            <MeetingHud metrics={metrics}>
              {state.boredomGameTriggered ? (
                <ReasonPicker
                  reasons={state.boredomReasons}
                  onTogglePreset={(preset) =>
                    setState((current) => toggleBoredomReason(current, preset))
                  }
                />
              ) : null}

              <RoomConnect
                roomCode={roomCodeInput}
                displayName={displayNameInput}
                isJoined={isShareJoined}
                onRoomCodeChange={setRoomCodeInput}
                onDisplayNameChange={setDisplayNameInput}
                onJoin={() => setIsShareJoined(true)}
                onLeave={() => setIsShareJoined(false)}
              />

              {isShareJoined ? (
                <>
                  <ScoreLeaderboard
                    peers={sharedPeers}
                    selfPeerId={selfPeerId}
                    status={shareStatus}
                    roomCode={sanitizedRoomCode}
                    participantCount={participantCount}
                  />
                  <ReasonAggregate peers={sharedPeers} />
                </>
              ) : null}
            </MeetingHud>
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
