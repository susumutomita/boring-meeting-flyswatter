import { type ChangeEvent, useEffect, useState } from 'react';
import {
  type BoredomReason,
  type BoredomReasonPreset,
  boredomReasonPresets,
  noteFreeTextLimit,
} from '../lib/meeting';

type ReasonPickerProps = {
  reasons: BoredomReason[];
  onTogglePreset: (preset: BoredomReasonPreset) => void;
  onNoteChange: (note: string) => void;
};

const isPresetSelected = (
  reasons: BoredomReason[],
  preset: BoredomReasonPreset
): boolean =>
  reasons.some(
    (reason) => reason.kind === 'preset' && reason.preset === preset
  );

const findNote = (reasons: BoredomReason[]): string => {
  const note = reasons.find((reason) => reason.kind === 'note');
  return note && note.kind === 'note' ? note.note : '';
};

export const ReasonPicker = ({
  reasons,
  onTogglePreset,
  onNoteChange,
}: ReasonPickerProps) => {
  const [draftNote, setDraftNote] = useState(() => findNote(reasons));

  useEffect(() => {
    setDraftNote(findNote(reasons));
  }, [reasons]);

  const handleNoteChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const next = event.target.value;
    setDraftNote(next);
    onNoteChange(next);
  };

  return (
    <section
      aria-label="退屈の理由"
      className="reason-picker"
      data-no-activity-capture="true"
    >
      <header className="reason-picker-head">
        <span className="reason-picker-eyebrow">なぜ退屈？</span>
        <small>当てはまるものをタップ</small>
      </header>
      <div className="reason-picker-tags">
        {boredomReasonPresets.map((preset) => {
          const selected = isPresetSelected(reasons, preset);
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
      <label className="reason-picker-note">
        <span>その他</span>
        <textarea
          maxLength={noteFreeTextLimit}
          onChange={handleNoteChange}
          placeholder="ひと言で残す"
          rows={2}
          value={draftNote}
        />
      </label>
    </section>
  );
};
