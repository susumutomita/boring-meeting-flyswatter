import type { ReactNode } from 'react';
import {
  type MeetingMetrics,
  formatClock,
  formatPercent,
} from '../lib/meeting';

type MeetingHudProps = {
  metrics: MeetingMetrics;
  children?: ReactNode;
};

export const MeetingHud = ({ metrics, children }: MeetingHudProps) => (
  <aside className="panel live-panel compact-panel">
    {children}

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
