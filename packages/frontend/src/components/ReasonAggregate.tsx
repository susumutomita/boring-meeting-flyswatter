import type { CSSProperties } from 'react';
import {
  type ReasonTally,
  type ScoreSnapshot,
  tallyReasons,
} from '../lib/scoreShare';

type ReasonAggregateProps = {
  peers: ScoreSnapshot[];
};

export const ReasonAggregate = ({ peers }: ReasonAggregateProps) => {
  const tally: ReasonTally[] = tallyReasons(peers);
  const respondents = peers.filter((peer) => peer.reasons.length > 0).length;
  const peakCount = tally[0]?.count ?? 0;

  return (
    <section aria-label="ルームの不満ランキング" className="reason-aggregate">
      <header className="reason-aggregate-head">
        <span className="reason-aggregate-eyebrow">ルームの不満</span>
        <small>{respondents} 人が回答</small>
      </header>

      {tally.length === 0 ? (
        <p className="reason-aggregate-empty">回答待ち</p>
      ) : (
        <ol className="reason-aggregate-list">
          {tally.map((row, index) => {
            const ratio =
              peakCount === 0 ? 0 : Math.round((row.count / peakCount) * 100);
            return (
              <li className="reason-aggregate-row" key={row.preset}>
                <span className="reason-aggregate-rank">{index + 1}</span>
                <span className="reason-aggregate-label">{row.preset}</span>
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
                    style={
                      { '--reason-bar-width': `${ratio}%` } as CSSProperties
                    }
                  />
                </span>
                <span className="reason-aggregate-count">{row.count}</span>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
};
