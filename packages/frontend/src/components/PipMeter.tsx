type PipMeterProps = {
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
  isCapturing,
  speechLevelDb,
  showToast,
  onToastClick,
}: PipMeterProps) => (
  <div className="pip-shell">
    <header className="pip-head">
      <span className="pip-mark">BMF</span>
      <span className={`pip-status ${isCapturing ? 'is-on' : ''}`}>
        {isCapturing ? '観測中' : '待機'}
      </span>
    </header>

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
