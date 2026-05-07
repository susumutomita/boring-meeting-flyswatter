import { useState } from 'react';
import type { ScoreShareStatus } from '../hooks/useScoreShare';
import {
  type BoredomReasonPreset,
  type MeetingState,
  boredomReasonPresets,
  formatClock,
  productivityScoreMax,
  productivityScoreMin,
  selectMeetingMetrics,
  swatTier,
  swatTierLabel,
} from '../lib/meeting';
import { selectQuote } from '../lib/quotes';
import {
  type ScoreSnapshot,
  averageProductivityScore,
  tallyReasons,
} from '../lib/scoreShare';

type MeetingSummaryProps = {
  state: MeetingState;
  roomCodeInput: string;
  displayNameInput: string;
  isShareJoined: boolean;
  shareStatus: ScoreShareStatus;
  sharedPeers: ScoreSnapshot[];
  participantCount: number;
  selfPeerId: string;
  onRoomCodeChange: (value: string) => void;
  onDisplayNameChange: (value: string) => void;
  onJoinShare: () => void;
  onLeaveShare: () => void;
  onTogglePreset: (preset: BoredomReasonPreset) => void;
  onProductivityChange: (score: number) => void;
};

const formatWallClock = (timestamp: number): string =>
  new Date(timestamp).toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

export const MeetingSummary = ({
  state,
  roomCodeInput,
  displayNameInput,
  isShareJoined,
  shareStatus,
  sharedPeers,
  participantCount,
  selfPeerId,
  onRoomCodeChange,
  onDisplayNameChange,
  onJoinShare,
  onLeaveShare,
  onTogglePreset,
  onProductivityChange,
}: MeetingSummaryProps) => {
  const [isShareOpen, setIsShareOpen] = useState(false);
  const metrics = selectMeetingMetrics(state);
  const totalDuration = state.endedAtSecond ?? state.meetingSeconds;
  const firstBoredomLabel = metrics.firstBoredomSecond
    ? formatClock(metrics.firstBoredomSecond)
    : '退屈ポイント未到達';
  const game = state.completedEvents[0] ?? null;
  const swatScoreLabel = game ? `${game.swats} 点` : '介入なし';
  const swatScoreTier = game ? swatTier(game.swats) : null;
  const tally = tallyReasons(sharedPeers);
  const peakCount = tally[0]?.count ?? 0;
  const productivityAverage = averageProductivityScore(sharedPeers);
  const respondents = sharedPeers.filter(
    (peer) => peer.reasons.length > 0
  ).length;
  const selectedReason = state.boredomReasons[0] ?? null;
  const canEditReason = state.boredomGameTriggered;

  return (
    <article className="panel meeting-summary">
      <header className="meeting-summary-head">
        <span className="meeting-summary-eyebrow">ミーティング振り返り</span>
        <h2 className="meeting-summary-title">
          {firstBoredomLabel === '退屈ポイント未到達'
            ? 'この会議は退屈になりませんでした'
            : '初めて退屈になった時刻'}
        </h2>
        {firstBoredomLabel !== '退屈ポイント未到達' ? (
          <strong className="meeting-summary-time">{firstBoredomLabel}</strong>
        ) : null}
      </header>

      <dl className="meeting-summary-grid">
        <div className="meeting-summary-row">
          <dt>ミーティング長</dt>
          <dd>{formatClock(totalDuration)}</dd>
        </div>
        <div className="meeting-summary-row">
          <dt>合計沈黙</dt>
          <dd>{formatClock(state.totalInactiveSeconds)}</dd>
        </div>
        <div className="meeting-summary-row">
          <dt>ハエ叩き</dt>
          <dd>
            {swatScoreLabel}
            {swatScoreTier ? (
              <span className={`tier-badge tier-${swatScoreTier}`}>
                {swatTierLabel[swatScoreTier]}
              </span>
            ) : null}
          </dd>
        </div>
      </dl>

      <section className="meeting-summary-productivity">
        <header className="meeting-summary-productivity-head">
          <h3>主観評価</h3>
          <strong>
            {state.productivityScore ?? '—'}
            <small>/ {productivityScoreMax}</small>
          </strong>
        </header>
        <p className="meeting-summary-productivity-hint">
          この会議は自分にとってどれくらい生産的だった？ つまみを動かして 1 〜
          10 で残す。
        </p>
        <input
          aria-label="生産性スコア"
          className="meeting-summary-productivity-slider"
          max={productivityScoreMax}
          min={productivityScoreMin}
          onChange={(event) => onProductivityChange(Number(event.target.value))}
          step={1}
          type="range"
          value={state.productivityScore ?? Math.ceil(productivityScoreMax / 2)}
        />
        <div className="meeting-summary-productivity-scale">
          <span>そうじゃない</span>
          <span>めっちゃ生産性高い</span>
        </div>
      </section>

      {canEditReason ? (
        <section className="meeting-summary-reasons">
          <h3>退屈の理由</h3>
          <p className="meeting-summary-reasons-hint">
            会議を振り返って 1 つだけ選ぶ。
          </p>
          <div className="reason-picker-tags">
            {boredomReasonPresets.map((preset) => {
              const selected = selectedReason === preset;
              return (
                <button
                  aria-pressed={selected}
                  className={`reason-tag ${selected ? 'is-selected' : ''}`}
                  key={preset}
                  onClick={() => onTogglePreset(preset)}
                  type="button"
                >
                  {preset}
                </button>
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="meeting-summary-share">
        <header className="meeting-summary-share-head">
          <h3>仲間と共有する</h3>
          {!isShareOpen ? (
            <button
              className="action"
              onClick={() => setIsShareOpen(true)}
              type="button"
            >
              ルームで共有
            </button>
          ) : null}
        </header>

        {isShareOpen ? (
          <div className="meeting-summary-share-body">
            {!isShareJoined ? (
              <div className="meeting-summary-share-form">
                <label className="room-connect-field">
                  <span>ルーム</span>
                  <input
                    onChange={(event) => onRoomCodeChange(event.target.value)}
                    placeholder="design-meeting-2026"
                    type="text"
                    value={roomCodeInput}
                  />
                </label>
                <label className="room-connect-field">
                  <span>名前</span>
                  <input
                    onChange={(event) =>
                      onDisplayNameChange(event.target.value)
                    }
                    placeholder="ゲスト"
                    type="text"
                    value={displayNameInput}
                  />
                </label>
                <button
                  className="action action-primary"
                  disabled={roomCodeInput.trim().length === 0}
                  onClick={onJoinShare}
                  type="button"
                >
                  参加
                </button>
              </div>
            ) : (
              <div className="meeting-summary-share-status">
                <span>
                  ルーム <strong>{roomCodeInput || '未設定'}</strong> に
                  {shareStatus === 'host' ? 'ホスト' : '参加'}中 (
                  {participantCount} 人 )
                </span>
                <button className="action" onClick={onLeaveShare} type="button">
                  退出
                </button>
              </div>
            )}

            {isShareJoined && productivityAverage.average !== null ? (
              <div className="meeting-summary-productivity-average">
                <span className="meeting-summary-productivity-average-label">
                  全員の主観平均
                </span>
                <span className="meeting-summary-productivity-average-value">
                  {productivityAverage.average}
                  <small>/ {productivityScoreMax}</small>
                </span>
                <span className="meeting-summary-productivity-average-meta">
                  {productivityAverage.respondents} 人回答
                </span>
              </div>
            ) : null}

            {isShareJoined && sharedPeers.length > 0 ? (
              <ol className="meeting-summary-roster">
                {sharedPeers.map((peer) => {
                  const isSelf = peer.peerId === selfPeerId;
                  return (
                    <li
                      className={`meeting-summary-roster-row ${
                        isSelf ? 'is-self' : ''
                      }`}
                      key={peer.peerId}
                    >
                      <span className="meeting-summary-roster-name">
                        {peer.displayName}
                        {isSelf ? <small>あなた</small> : null}
                      </span>
                      <span className="meeting-summary-roster-time">
                        {peer.swattingStartedAt
                          ? formatWallClock(peer.swattingStartedAt)
                          : '--:--:--'}
                      </span>
                      <span className="meeting-summary-roster-score">
                        <small>ハエ叩き</small>
                        {peer.bestScore} 点
                      </span>
                      <span className="meeting-summary-roster-reason">
                        {peer.reasons[0] ?? '—'}
                      </span>
                      <span className="meeting-summary-roster-productivity">
                        <small>主観</small>
                        {peer.productivityScore ?? '—'}
                      </span>
                    </li>
                  );
                })}
              </ol>
            ) : null}

            {isShareJoined && tally.length > 0 ? (
              <ol className="reason-aggregate-list">
                {tally.map((row, index) => {
                  const ratio =
                    peakCount === 0
                      ? 0
                      : Math.round((row.count / peakCount) * 100);
                  return (
                    <li className="reason-aggregate-row" key={row.preset}>
                      <span className="reason-aggregate-rank">{index + 1}</span>
                      <span className="reason-aggregate-label">
                        {row.preset}
                      </span>
                      <span
                        aria-valuemax={peakCount}
                        aria-valuemin={0}
                        aria-valuenow={row.count}
                        className="reason-aggregate-bar"
                        role="progressbar"
                        tabIndex={0}
                      >
                        <span
                          className="reason-aggregate-bar-fill"
                          style={{
                            width: `${ratio}%`,
                          }}
                        />
                      </span>
                      <span className="reason-aggregate-count">
                        {row.count}
                      </span>
                    </li>
                  );
                })}
              </ol>
            ) : null}

            {isShareJoined && respondents === 0 ? (
              <p className="meeting-summary-share-hint">
                他の参加者が理由を選ぶと集計が表示されます。
              </p>
            ) : null}
          </div>
        ) : null}
      </section>

      <blockquote className="meeting-summary-quote">
        <p>{selectQuote(totalDuration + state.totalInactiveSeconds).body}</p>
        <cite>
          — {selectQuote(totalDuration + state.totalInactiveSeconds).author}
        </cite>
      </blockquote>
    </article>
  );
};
