import { type BoredomReasonPreset, boredomReasonPresets } from '../lib/meeting';

type ReasonPickerProps = {
  reasons: BoredomReasonPreset[];
  onTogglePreset: (preset: BoredomReasonPreset) => void;
};

export const ReasonPicker = ({
  reasons,
  onTogglePreset,
}: ReasonPickerProps) => (
  <section
    aria-label="退屈の理由"
    className="reason-picker"
    data-no-activity-capture="true"
  >
    <header className="reason-picker-head">
      <span className="reason-picker-eyebrow">なぜ退屈？</span>
      <small>もっとも当てはまるものを 1 つだけ選ぶ</small>
    </header>
    <div className="reason-picker-tags">
      {boredomReasonPresets.map((preset) => {
        const selected = reasons.includes(preset);
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
);
