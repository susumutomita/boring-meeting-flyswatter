import type { CSSProperties } from 'react';
import {
  type MeetingMetrics,
  formatClock,
  formatPercent,
} from '../lib/meeting';

type MeetingHudProps = {
  boredomGauge: number;
  metrics: MeetingMetrics;
  activityLabels: readonly string[];
  onActivity: (label: string) => void;
};

export const MeetingHud = ({
  boredomGauge,
  metrics,
  activityLabels,
  onActivity,
}: MeetingHudProps) => (
  <aside className="panel live-panel compact-panel">
    <div className="compact-meter">
      <div className="compact-meter-head">
        <span>退屈</span>
        <strong>{Math.round(boredomGauge)}%</strong>
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

    <div className="activity-pad" data-no-activity-capture="true">
      {activityLabels.map((label) => (
        <button
          className="activity-chip"
          key={label}
          onClick={() => onActivity(label)}
          type="button"
        >
          {label}
        </button>
      ))}
    </div>

    <div className="side-stats">
      <div className="stat-tile">
        <span>回数</span>
        <strong>{metrics.boredomEvents}</strong>
      </div>
      <div className="stat-tile">
        <span>初回</span>
        <strong>
          {metrics.firstBoredomSecond
            ? formatClock(metrics.firstBoredomSecond)
            : '--:--'}
        </strong>
      </div>
      <div className="stat-tile">
        <span>平均</span>
        <strong>{metrics.averageSwatsPerEvent.toFixed(1)}</strong>
      </div>
      <div className="stat-tile">
        <span>率</span>
        <strong>{formatPercent(metrics.boredomRate)}</strong>
      </div>
    </div>
  </aside>
);
