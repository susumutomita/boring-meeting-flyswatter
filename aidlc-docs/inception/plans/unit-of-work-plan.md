# Unit of Work Plan

## Goal

Decompose the MVP into independently understandable units so reviewers can see that the creative idea is backed by coherent engineering boundaries.

## Decomposition Strategy

Units are derived from current source ownership:

- Pure domain logic.
- Browser input and audio detection.
- Swatting interaction.
- UI shell and summary views.
- WebRTC score sharing.
- Quality, delivery, and documentation.

## Proposed Units

| Unit | Type | Primary Files |
| --- | --- | --- |
| U1 Meeting State Engine | Domain logic | `src/lib/meeting.ts`, `src/lib/meeting.test.ts` |
| U2 Activity and Audio Detection | Browser integration | `src/hooks/useActivityTracking.ts`, `src/hooks/useMicrophoneActivity.ts`, `src/hooks/useStreamSpeechDetector.ts`, `src/lib/audio.ts` |
| U3 Swatter Game Experience | UI and interaction | `src/components/SwatterArena.tsx`, `src/hooks/useSwatter.ts`, `src/app.css` |
| U4 Recap and Feedback | UI and aggregation | `src/components/MeetingSummary.tsx`, `src/components/ReasonPicker.tsx`, `src/components/ReasonAggregate.tsx`, `src/lib/scoreShare.ts` |
| U5 Room Score Sharing | WebRTC integration | `src/hooks/useScoreShare.ts`, `src/components/RoomConnect.tsx`, `src/components/ScoreLeaderboard.tsx` |
| U6 Delivery and Quality | Tooling and docs | `package.json`, `Makefile`, `.github/workflows`, `README.md`, `Plan.md` |

## Approval Gate

The decomposition is accepted for Inception because it maps to existing files, existing tests, and observable product behavior.
