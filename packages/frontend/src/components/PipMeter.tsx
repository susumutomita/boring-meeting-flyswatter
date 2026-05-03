import type { CSSProperties } from 'react';

type PipMeterProps = {
  boredomGauge: number;
  isCapturing: boolean;
  speechLevelDb: number;
  showToast: boolean;
  onToastClick: () => void;
};

const formatDecibels = (decibels: number): string => {
  if (!Number.isFinite(decibels)) {
    return '--';
  }
  return `${Math.round(decibels)} dB`;
};

export const PipMeter = ({
  boredomGauge,
  isCapturing,
  speechLevelDb,
  showToast,
  onToastClick,
}: PipMeterProps) => (
  <div className="pip-shell">
    <header className="pip-head">
      <span className="pip-mark">BMF</span>
      <span className={`pip-status ${isCapturing ? 'is-on' : ''}`}>
        {isCapturing ? '監視中' : '待機'}
      </span>
    </header>

    <div className="pip-row">
      <span className="pip-label">退屈</span>
      <strong>{Math.round(boredomGauge)}%</strong>
    </div>
    <div
      aria-label="退屈度"
      aria-valuemax={100}
      aria-valuemin={0}
      aria-valuenow={Math.round(boredomGauge)}
      className="pip-meter"
      role="progressbar"
      tabIndex={0}
    >
      <div
        className="pip-meter-fill"
        style={{ '--pip-meter-width': `${boredomGauge}%` } as CSSProperties}
      />
    </div>

    <div className="pip-row pip-row-tight">
      <span className="pip-label">音量</span>
      <span className="pip-mono">{formatDecibels(speechLevelDb)}</span>
    </div>

    {showToast ? (
      <button className="pip-toast" onClick={onToastClick} type="button">
        退屈してる？
        <small>クリックで叩きにいく</small>
      </button>
    ) : null}
  </div>
);
