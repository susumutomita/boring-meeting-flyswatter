import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react';
import type { SwatTarget, SwatterPose } from '../hooks/useSwatter';
import {
  type ActiveGame,
  type SwattingFeedback,
  counterThresholdTicks,
  formatClock,
  maxPenalties,
  targetScore,
} from '../lib/meeting';

type SwatterArenaProps = {
  game: ActiveGame | null;
  feedback: SwattingFeedback | null;
  swatter: SwatterPose;
  knockedFlyIds: Set<number>;
  idleLabel: string;
  idleValue: string | number;
  onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerMove: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerEnter: () => void;
  onPointerLeave: () => void;
  onTargetClick: (target: SwatTarget) => void;
  onTreatClick: (point: { x: number; y: number }) => void;
  treatBoostPopup: { id: number; x: number; y: number } | null;
};

export const SwatterArena = ({
  game,
  feedback,
  swatter,
  knockedFlyIds,
  idleLabel,
  idleValue,
  onPointerDown,
  onPointerMove,
  onPointerEnter,
  onPointerLeave,
  onTargetClick,
  onTreatClick,
  treatBoostPopup,
}: SwatterArenaProps) => {
  const score = game?.score ?? 0;
  const remainingSeconds = game?.remainingSeconds ?? 0;
  const lives = game ? maxPenalties - game.penalties : maxPenalties;
  const treat = game?.treat ?? null;
  const isBoosted = (game?.multiplierTicksRemaining ?? 0) > 0;

  return (
    <article className="panel arena-panel game-panel">
      <div className="game-scorebar">
        <div className="score-pill">
          <span>SCORE</span>
          <strong>
            {score}/{targetScore}
          </strong>
        </div>
        <div className="score-pill">
          <span>TIME</span>
          <strong>
            {game ? formatClock(remainingSeconds) : formatClock(0)}
          </strong>
        </div>
        <div className="score-pill">
          <span>LIFE</span>
          <strong>{lives}</strong>
        </div>
      </div>

      <div
        className={`arena ${game ? 'arena-active' : ''} ${
          feedback?.isBriefing ? 'is-briefing' : ''
        }`}
        style={
          {
            '--arena-pressure': `${feedback ? feedback.pressurePercent : 0}%`,
          } as CSSProperties
        }
      >
        {game ? (
          <>
            <div className="arena-score" aria-hidden="true">
              {game.score}
            </div>
            {isBoosted ? (
              <div className="arena-boost-badge" aria-live="polite">
                ×2 BOOST
              </div>
            ) : null}
            <div
              aria-label="ハエの反撃ゲージ"
              aria-valuemax={100}
              aria-valuemin={0}
              aria-valuenow={feedback?.pressurePercent ?? 0}
              className="arena-pressure"
              role="progressbar"
              tabIndex={0}
            >
              <span className="arena-pressure-label">反撃</span>
              <span className="arena-pressure-bar" />
            </div>

            <div
              className="fly-zone"
              data-no-activity-capture="true"
              onPointerDown={onPointerDown}
              onPointerEnter={onPointerEnter}
              onPointerLeave={onPointerLeave}
              onPointerMove={onPointerMove}
            >
              {game.flies
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
                      onTargetClick({
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
                        '--fly-threat': `${fly.charge / counterThresholdTicks}`,
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
              {treat ? (
                <button
                  aria-label="フラペチーノを叩いて 2 倍ブースト"
                  className="treat-target"
                  key={treat.id}
                  onClick={(event) => {
                    event.stopPropagation();
                    onTreatClick({ x: treat.x, y: treat.y });
                  }}
                  onPointerDown={(event) => event.stopPropagation()}
                  style={
                    {
                      '--treat-x': `${treat.x}%`,
                      '--treat-y': `${treat.y}%`,
                      '--treat-bob': treat.bobSeed.toFixed(3),
                    } as CSSProperties
                  }
                  type="button"
                >
                  <span className="treat-cream" />
                  <span className="treat-cup" />
                  <span className="treat-straw" />
                  <span className="treat-face" aria-hidden="true">
                    ◕‿◕
                  </span>
                </button>
              ) : null}
              {treatBoostPopup ? (
                <div
                  aria-hidden="true"
                  className="treat-boost-popup"
                  key={treatBoostPopup.id}
                  style={
                    {
                      '--popup-x': `${treatBoostPopup.x}%`,
                      '--popup-y': `${treatBoostPopup.y}%`,
                    } as CSSProperties
                  }
                >
                  <span className="treat-boost-popup-headline">×2!</span>
                  <span className="treat-boost-popup-sub">BOOST 発動</span>
                  <span className="treat-boost-popup-sparkle treat-boost-popup-sparkle-a">
                    ✦
                  </span>
                  <span className="treat-boost-popup-sparkle treat-boost-popup-sparkle-b">
                    ✦
                  </span>
                  <span className="treat-boost-popup-sparkle treat-boost-popup-sparkle-c">
                    ✦
                  </span>
                </div>
              ) : null}
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
            <span>{idleLabel}</span>
            <strong>{idleValue}</strong>
          </div>
        )}
      </div>
    </article>
  );
};
