import {
  type MeetingState,
  formatClock,
  formatPercent,
  selectMeetingMetrics,
  targetScore,
} from '../lib/meeting';

type MeetingSummaryProps = {
  state: MeetingState;
  onRestart: () => void;
};

export const MeetingSummary = ({ state, onRestart }: MeetingSummaryProps) => {
  const metrics = selectMeetingMetrics(state);
  const totalDuration = state.endedAtSecond ?? state.meetingSeconds;
  const firstBoredomLabel = metrics.firstBoredomSecond
    ? formatClock(metrics.firstBoredomSecond)
    : '退屈ポイント未到達';
  const game = state.completedEvents[0] ?? null;
  const swatScoreLabel = game ? `${game.swats}/${targetScore}` : '介入なし';
  const swatPenaltyLabel = game ? `${game.penalties} 回反撃` : '介入なし';

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
          <dt>退屈率</dt>
          <dd>{formatPercent(metrics.boredomRate)}</dd>
        </div>
        <div className="meeting-summary-row">
          <dt>ハエ叩き結果</dt>
          <dd>{swatScoreLabel}</dd>
        </div>
        <div className="meeting-summary-row">
          <dt>反撃を受けた回数</dt>
          <dd>{swatPenaltyLabel}</dd>
        </div>
      </dl>

      {state.boredomReasons.length > 0 ? (
        <section className="meeting-summary-reasons">
          <h3>退屈の理由</h3>
          <ul>
            {state.boredomReasons.map((preset) => (
              <li className="meeting-summary-reason" key={preset}>
                {preset}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="meeting-summary-actions">
        <button
          className="action action-primary"
          onClick={onRestart}
          type="button"
        >
          もう一度
        </button>
      </div>
    </article>
  );
};
