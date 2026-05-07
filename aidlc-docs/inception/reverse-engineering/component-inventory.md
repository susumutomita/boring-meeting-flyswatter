# Component Inventory

## Application Components

| Component | Type | Responsibility |
| --- | --- | --- |
| `App` | Orchestrator | Owns top-level meeting state and wires hooks to views. |
| `SwatterArena` | Presentation and interaction surface | Displays swatting board, flies, treat, bee, swatter, and score/time HUD. |
| `MeetingSummary` | Presentation and form surface | Displays recap, room sharing controls, reasons, productivity score, and rankings. |
| `PipMeter` | Presentation | Displays compact audio/activity status in Picture-in-Picture. |
| `RoomConnect` | Form component | Captures room code and display name. |
| `ScoreLeaderboard` | Presentation | Ranks shared peers by best score and current score. |
| `ReasonPicker` | Form component | Presents fixed boredom reason presets. |
| `ReasonAggregate` | Presentation | Displays reason tally across peers. |
| `MeetingHud` | Presentation | Existing HUD component retained in source inventory. |

## Hook Components

| Hook | Responsibility |
| --- | --- |
| `useActivityTracking` | Converts user activity events into meeting activity labels. |
| `useBoredomNotification` | Requests notification permission and sends boredom notification when needed. |
| `useDocumentPip` | Opens and manages Document Picture-in-Picture window. |
| `useMeetingTick` | Runs one-second meeting tick and 90 ms swatting tick. |
| `useMicrophoneActivity` | Acquires microphone stream and delegates detection. |
| `useStreamSpeechDetector` | Converts audio stream into speech activity events. |
| `useScoreShare` | Creates host or client PeerJS connection and synchronizes snapshots. |
| `useSwatter` | Tracks swatter pose, hit selection, knockdown effects, and pointer/keyboard swats. |
| `useTabAudioActivity` | Legacy tab audio capture hook currently unused by the app. |

## Library Components

| Module | Responsibility |
| --- | --- |
| `meeting.ts` | Meeting phases, game state, scoring, targets, metrics, and formatting. |
| `audio.ts` | RMS decibel and speech sample classification. |
| `scoreShare.ts` | Room code sanitization, peer ranking, productivity averaging, and reason tallying. |
| `i18n.ts` | Language selection and text translation. |
| `meetingTips.ts` | Deterministic meeting tip selection. |
| `quotes.ts` | Deterministic meeting quote selection. |
| `sponsoredItems.ts` | Bonus item selection and lookup. |

## Test Components

| Test File | Covered Area |
| --- | --- |
| `meeting.test.ts` | Meeting and swatting rules. |
| `audio.test.ts` | Audio sample classification. |
| `scoreShare.test.ts` | Room, ranking, productivity, and reason aggregation. |
| `i18n.test.ts` | Translation utilities. |
| `meetingTips.test.ts` | Meeting tips. |
| `quotes.test.ts` | Quotes. |
| `sponsoredItems.test.ts` | Sponsored item selection. |
