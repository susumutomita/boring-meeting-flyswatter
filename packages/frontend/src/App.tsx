import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MeetingSummary } from './components/MeetingSummary';
import { PipMeter } from './components/PipMeter';
import { SwatterArena } from './components/SwatterArena';
import { useActivityTracking } from './hooks/useActivityTracking';
import { useBoredomNotification } from './hooks/useBoredomNotification';
import { useDocumentPip } from './hooks/useDocumentPip';
import { useMeetingTick } from './hooks/useMeetingTick';
import { useMicrophoneActivity } from './hooks/useMicrophoneActivity';
import { useScoreShare } from './hooks/useScoreShare';
import { useSecretCommand } from './hooks/useSecretCommand';
import { useSwatter } from './hooks/useSwatter';
import {
  type Language,
  cycleLanguage,
  detectInitialLanguage,
  languageShortLabel,
  translate,
} from './lib/i18n';
import {
  advanceMeeting,
  createGameSeed,
  createInitialMeetingState,
  endMeeting,
  gameDurationSeconds,
  moveFlies,
  registerActivity,
  selectSwattingFeedback,
  setProductivityScore,
  startMeeting,
  startSwattingGame,
  swatBee,
  swatFly,
  swatTreat,
  toggleBoredomReason,
  triggerPracticeSwatting,
} from './lib/meeting';
import { pickMeetingTip } from './lib/meetingTips';
import {
  type ScoreSnapshot,
  sanitizeDisplayName,
  sanitizeRoomCode,
} from './lib/scoreShare';

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

const App = () => {
  const [state, setState] = useState(createInitialMeetingState);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [roomCodeInput, setRoomCodeInput] = useState(() =>
    readPersisted('bmf:room-code', '')
  );
  const [displayNameInput, setDisplayNameInput] = useState(() =>
    readPersisted('bmf:display-name', '')
  );
  const [isShareJoined, setIsShareJoined] = useState(false);
  const [bestScore, setBestScore] = useState(0);
  const [tipSeed] = useState(() => Date.now());
  const [language, setLanguage] = useState<Language>(() =>
    detectInitialLanguage(
      typeof navigator === 'undefined' ? undefined : navigator.language,
      readPersisted('bmf:language', '') || null
    )
  );

  useEffect(() => {
    writePersisted('bmf:language', language);
  }, [language]);

  const t = (
    key: Parameters<typeof translate>[1],
    params?: Parameters<typeof translate>[2]
  ) => translate(language, key, params);

  const isSwatArmed = state.currentGame?.armed === true;
  const meetingTip = pickMeetingTip(tipSeed);
  const [showPracticeToast, setShowPracticeToast] = useState(false);
  const [treatBoostPopup, setTreatBoostPopup] = useState<{
    id: number;
    x: number;
    y: number;
  } | null>(null);
  const [beeBoostPopup, setBeeBoostPopup] = useState<{
    id: number;
    x: number;
    y: number;
  } | null>(null);
  const treatPopupIdRef = useRef(0);
  const beePopupIdRef = useRef(0);
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

  useBoredomNotification({
    enabled: isRunning,
    isSwatting,
    title: translate(language, 'notification_title'),
    body: translate(language, 'notification_body'),
  });

  const handleSpeech = () =>
    setState((current) => registerActivity(current, '発話を検知'));
  const handleAudioError = (error: Error) => {
    setAudioError(error.message);
  };

  const micAudio = useMicrophoneActivity({
    enabled: isRunning && !audioError,
    onSpeech: handleSpeech,
    onError: handleAudioError,
  });

  const isCapturing = micAudio.isCapturing;
  const levelDb = micAudio.levelDb;

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
    treat: state.currentGame?.treat ?? null,
    bee: state.currentGame?.bee ?? null,
    onSwatFly: (flyId) => setState((current) => swatFly(current, flyId)),
    onSwatTreat: (point) => {
      treatPopupIdRef.current += 1;
      const popupId = treatPopupIdRef.current;
      setTreatBoostPopup({ id: popupId, x: point.x, y: point.y });
      setState((current) => swatTreat(current));
      window.setTimeout(() => {
        setTreatBoostPopup((current) =>
          current && current.id === popupId ? null : current
        );
      }, 1100);
    },
    onSwatBee: (point) => {
      beePopupIdRef.current += 1;
      const popupId = beePopupIdRef.current;
      setBeeBoostPopup({ id: popupId, x: point.x, y: point.y });
      setState((current) => swatBee(current));
      window.setTimeout(() => {
        setBeeBoostPopup((current) =>
          current && current.id === popupId ? null : current
        );
      }, 1100);
    },
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
      productivityScore: state.productivityScore,
    }),
    [
      selfPeerId,
      sanitizedDisplayName,
      state.currentGame?.score,
      state.phase,
      bestScore,
      state.boredomReasons,
      state.swattingStartedAt,
      state.productivityScore,
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

  const swattingFeedback = state.currentGame
    ? selectSwattingFeedback(state.currentGame)
    : null;

  const pipEnabled = isRunning;
  const { pipWindow, isSupported: pipSupported } = useDocumentPip({
    enabled: pipEnabled,
  });

  useEffect(() => {
    if (!isRunning) {
      setAudioError(null);
    }
  }, [isRunning]);

  useSecretCommand({
    enabled: !isCompleted,
    onTrigger: () => {
      if (
        typeof window !== 'undefined' &&
        'speechSynthesis' in window &&
        typeof window.SpeechSynthesisUtterance !== 'undefined'
      ) {
        const utter = new window.SpeechSynthesisUtterance('カカロット！');
        utter.lang = 'ja-JP';
        utter.rate = 0.85;
        utter.pitch = 0.4;
        utter.volume = 1;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utter);
      }
      setShowPracticeToast(true);
      window.setTimeout(() => setShowPracticeToast(false), 2600);
      setState((current) => triggerPracticeSwatting(current));
    },
  });

  const primaryButton = isIdle
    ? {
        label: t('start_meeting'),
        onClick: () => setState(startMeeting()),
        primary: true,
      }
    : isCompleted
      ? null
      : {
          label: t('end_meeting'),
          onClick: () => setState((current) => endMeeting(current)),
          primary: false,
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
        labels={{
          tracking: t('pip_tracking'),
          idle: t('pip_idle'),
          volume: t('pip_volume'),
          toast: t('pip_toast'),
          toastSub: t('pip_toast_sub'),
        }}
      />
    ) : null;

  return (
    <div className="shell simple-shell">
      <main className="game-board">
        <header className="game-topbar">
          <div className="top-actions" data-no-activity-capture="true">
            <button
              aria-label={t('language_picker_label')}
              className="action language-picker"
              onClick={() => setLanguage((current) => cycleLanguage(current))}
              title={t('language_picker_label')}
              type="button"
            >
              {languageShortLabel[language]}
            </button>
            {primaryButton ? (
              <button
                className={`action ${primaryButton.primary ? 'action-primary' : ''}`}
                onClick={primaryButton.onClick}
                type="button"
              >
                {primaryButton.label}
              </button>
            ) : null}
          </div>
        </header>

        {showPracticeToast ? (
          <output className="practice-mode-toast" aria-live="polite">
            <span className="practice-mode-toast-shout">カカロット！</span>
          </output>
        ) : null}

        {audioError ? (
          <div className="audio-error">
            <output>{audioError}</output>
            <div className="audio-error-actions">
              <button
                className="action"
                onClick={() => setAudioError(null)}
                type="button"
              >
                {t('audio_error_close')}
              </button>
            </div>
          </div>
        ) : null}

        {!pipSupported && isRunning ? (
          <output className="pip-hint">{t('pip_not_supported')}</output>
        ) : null}

        <section className="play-stage">
          {isCompleted ? (
            <MeetingSummary
              state={state}
              roomCodeInput={roomCodeInput}
              displayNameInput={displayNameInput}
              isShareJoined={isShareJoined}
              shareStatus={shareStatus}
              sharedPeers={sharedPeers}
              participantCount={participantCount}
              selfPeerId={selfPeerId}
              onRoomCodeChange={setRoomCodeInput}
              onDisplayNameChange={setDisplayNameInput}
              onJoinShare={() => setIsShareJoined(true)}
              onLeaveShare={() => setIsShareJoined(false)}
              onTogglePreset={(preset) =>
                setState((current) => toggleBoredomReason(current, preset))
              }
              onProductivityChange={(score) =>
                setState((current) => setProductivityScore(current, score))
              }
            />
          ) : (
            <>
              <SwatterArena
                game={state.currentGame}
                feedback={swattingFeedback}
                swatter={swatter}
                knockedFlyIds={knockedFlyIds}
                idleLabel={
                  isIdle
                    ? t('idle_click_top_right')
                    : state.boredomGameTriggered
                      ? t('idle_boredom_detected')
                      : t('idle_tip_label')
                }
                idleValue={
                  isIdle ? (
                    t('idle_start')
                  ) : state.boredomGameTriggered ? (
                    t('idle_end_to_review')
                  ) : (
                    <span className="meeting-tip">
                      <span className="meeting-tip-practice">
                        {meetingTip.practice}
                      </span>
                      <span className="meeting-tip-body">
                        {meetingTip.body}
                      </span>
                      <span className="meeting-tip-source">
                        {t('meeting_tip_source')}: {meetingTip.source}
                      </span>
                    </span>
                  )
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
                onBeeClick={(point) => {
                  beePopupIdRef.current += 1;
                  const popupId = beePopupIdRef.current;
                  setBeeBoostPopup({ id: popupId, x: point.x, y: point.y });
                  setState((current) => swatBee(current));
                  window.setTimeout(() => {
                    setBeeBoostPopup((current) =>
                      current && current.id === popupId ? null : current
                    );
                  }, 1100);
                }}
                treatBoostPopup={treatBoostPopup}
                beeBoostPopup={beeBoostPopup}
              />

              {isSwatArmed ? (
                <div className="swat-armed-overlay">
                  <div className="swat-armed-card">
                    <span className="swat-armed-eyebrow">
                      {t('armed_eyebrow')}
                    </span>
                    <h2 className="swat-armed-title">{t('armed_title')}</h2>
                    <p className="swat-armed-body">
                      {t('armed_body_template', {
                        seconds: gameDurationSeconds,
                      })}
                    </p>
                    <button
                      className="action action-primary swat-armed-action"
                      onClick={() =>
                        setState((current) => startSwattingGame(current))
                      }
                      type="button"
                    >
                      {t('armed_action')}
                    </button>
                  </div>
                </div>
              ) : null}
            </>
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
