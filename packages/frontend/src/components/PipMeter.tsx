import { audioLevelToPercent, speechThresholdDb } from '../lib/audio';

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

const VU_SEGMENT_COUNT = 12;
const VU_SEGMENTS = Array.from({ length: VU_SEGMENT_COUNT }, (_, index) => ({
  threshold: ((index + 1) / VU_SEGMENT_COUNT) * 100,
  zone: index < 7 ? 'low' : index < 10 ? 'mid' : 'high',
}));

export const PipMeter = ({
  isCapturing,
  speechLevelDb,
  showToast,
  onToastClick,
  labels,
}: PipMeterProps) => {
  const levelPercent = audioLevelToPercent(speechLevelDb);
  const isSpeaking =
    isCapturing &&
    Number.isFinite(speechLevelDb) &&
    speechLevelDb > speechThresholdDb;

  return (
    <div className="pip-shell">
      <header className="pip-head">
        <span className="pip-mark">BMF</span>
        <span className={`pip-status ${isCapturing ? 'is-on' : ''}`}>
          {isCapturing ? labels.tracking : labels.idle}
        </span>
      </header>

      <div className="pip-row pip-row-tight">
        <span className="pip-label">{labels.volume}</span>
        <div
          className={`pip-vumeter ${isSpeaking ? 'is-speaking' : ''}`}
          role="meter"
          aria-label={labels.volume}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(levelPercent)}
        >
          {VU_SEGMENTS.map((segment, index) => (
            <span
              key={segment.threshold}
              className={`pip-vumeter-seg pip-vumeter-${segment.zone} ${
                levelPercent >= segment.threshold ? 'is-on' : ''
              }`}
              data-index={index}
            />
          ))}
        </div>
      </div>

      {showToast ? (
        <button className="pip-toast" onClick={onToastClick} type="button">
          {labels.toast}
          <small>{labels.toastSub}</small>
        </button>
      ) : null}
    </div>
  );
};
