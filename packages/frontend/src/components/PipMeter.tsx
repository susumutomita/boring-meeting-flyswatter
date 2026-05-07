type PipMeterProps = {
  isCapturing: boolean;
  speechLevelDb: number;
  showToast: boolean;
  onToastClick: () => void;
  labels: {
    tracking: string;
    idle: string;
    volume: string;
    toast: string;
    toastSub: string;
  };
};

const formatDecibels = (decibels: number): string => {
  if (!Number.isFinite(decibels)) {
    return '--';
  }
  return `${Math.round(decibels)} dB`;
};

export const PipMeter = ({
  isCapturing,
  speechLevelDb,
  showToast,
  onToastClick,
  labels,
}: PipMeterProps) => (
  <div className="pip-shell">
    <header className="pip-head">
      <span className="pip-mark">BMF</span>
      <span className={`pip-status ${isCapturing ? 'is-on' : ''}`}>
        {isCapturing ? labels.tracking : labels.idle}
      </span>
    </header>

    <div className="pip-row pip-row-tight">
      <span className="pip-label">{labels.volume}</span>
      <span className="pip-mono">{formatDecibels(speechLevelDb)}</span>
    </div>

    {showToast ? (
      <button className="pip-toast" onClick={onToastClick} type="button">
        {labels.toast}
        <small>{labels.toastSub}</small>
      </button>
    ) : null}
  </div>
);
