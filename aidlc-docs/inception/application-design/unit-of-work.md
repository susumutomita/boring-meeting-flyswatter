# Units of Work

## U1. Meeting State Engine

### Responsibility

Own deterministic meeting lifecycle, boredom detection, game timers, target creation, score rules, reason selection, productivity score, and metrics.

### Primary Files

- `packages/frontend/src/lib/meeting.ts`.
- `packages/frontend/src/lib/meeting.test.ts`.

### Acceptance

- Meeting starts in monitoring phase.
- Activity resets inactivity.
- 60 seconds of inactivity triggers exactly one swatting event.
- Swatting round ends after timer reaches zero.
- Score, reasons, and productivity rules are tested.

## U2. Activity and Audio Detection

### Responsibility

Convert browser activity and microphone RMS levels into meeting activity events.

### Primary Files

- `hooks/useActivityTracking.ts`.
- `hooks/useMicrophoneActivity.ts`.
- `hooks/useStreamSpeechDetector.ts`.
- `lib/audio.ts`.
- `lib/audio.test.ts`.

### Acceptance

- Keyboard, pointer, focus, input, visibility, and speech activity can reset inactivity.
- Microphone denial is surfaced as an error.
- Audio classification is unit-tested.

## U3. Swatter Game Experience

### Responsibility

Render the game arena, moving targets, swatter pose, pointer and keyboard hit interactions, visual hit feedback, and target animations.

### Primary Files

- `components/SwatterArena.tsx`.
- `hooks/useSwatter.ts`.
- `app.css`.

### Acceptance

- Normal targets can be hit.
- Treat and bee targets are visible when active.
- Swatter follows pointer and supports keyboard target buttons.
- Visual hit effects do not block gameplay state.

## U4. Recap and Feedback

### Responsibility

Render completed meeting summary, collect reason preset and productivity score, and show aggregate recap values.

### Primary Files

- `components/MeetingSummary.tsx`.
- `components/ReasonPicker.tsx`.
- `components/ReasonAggregate.tsx`.
- `lib/scoreShare.ts`.
- `lib/scoreShare.test.ts`.

### Acceptance

- Reason selection is preset-only.
- Productivity score is clamped to 1 to 10.
- Aggregates are computed from peer snapshots.

## U5. Room Score Sharing

### Responsibility

Join or host a room, exchange score snapshots, update roster, and support leaderboard display.

### Primary Files

- `hooks/useScoreShare.ts`.
- `components/RoomConnect.tsx`.
- `components/ScoreLeaderboard.tsx`.
- `lib/scoreShare.ts`.

### Acceptance

- Room codes are sanitized.
- Peer snapshots are merged and removed.
- Host sends roster to new peers.
- Leaderboard ordering is deterministic.

## U6. Delivery and Quality

### Responsibility

Maintain build, lint, typecheck, tests, deployment, README, and AI-DLC documentation.

### Primary Files

- `Makefile`.
- `package.json`.
- `packages/frontend/package.json`.
- `.github/workflows/ci.yml`.
- `.github/workflows/pages.yml`.
- `README.md`.
- `Plan.md`.
- `aidlc-docs/`.

### Acceptance

- `make before-commit` passes.
- GitHub Pages build workflow exists.
- AI-DLC Inception artifacts are complete.
