# API Documentation

## External Public HTTP APIs

The MVP does not expose a backend HTTP API. It is a static browser application built with Vite and deployed through GitHub Pages.

## Browser APIs Used

| API | Usage | File |
| --- | --- | --- |
| `navigator.mediaDevices.getUserMedia` | Acquires local microphone audio for speech detection. | `hooks/useMicrophoneActivity.ts` |
| Web Audio `AudioContext` and `AnalyserNode` | Computes RMS decibel samples from microphone stream. | `hooks/useStreamSpeechDetector.ts`, `lib/audio.ts` |
| Window activity events | Detects keyboard, pointer, focus, input, and visibility activity. | `hooks/useActivityTracking.ts` |
| Notification API | Alerts users when swatting starts while another tab is active. | `hooks/useBoredomNotification.ts` |
| Document Picture-in-Picture API | Opens a small meter window on Chromium-based browsers. | `hooks/useDocumentPip.ts` |
| `localStorage` | Persists language, room code, display name, and self peer ID. | `App.tsx` |
| WebRTC Data Channel through PeerJS | Shares score snapshots with peers in the same room. | `hooks/useScoreShare.ts` |

## Internal Domain API

The main internal API is the pure meeting state module.

| Function | Purpose |
| --- | --- |
| `createInitialMeetingState` | Creates idle state. |
| `startMeeting` | Enters monitoring phase. |
| `advanceMeeting` | Advances meeting seconds and triggers swatting at the boredom threshold. |
| `registerActivity` | Resets inactivity while monitoring. |
| `startSwattingGame` | Disarms the swatting intro overlay and starts the round timer. |
| `moveFlies` | Advances target movement and spawn timers during swatting. |
| `swatFly` | Adds +1 and replaces a fly. |
| `swatTreat` | Consumes the treat and doubles current score. |
| `swatBee` | Consumes the golden bee and adds the bee reward. |
| `endMeeting` | Moves to completed phase. |
| `selectMeetingMetrics` | Computes recap metrics. |
| `toggleBoredomReason` | Stores one selected reason preset. |
| `setProductivityScore` | Stores a clamped 1 to 10 productivity score after completion. |

## Shared Score Message Model

Room sharing uses PeerJS data messages:

| Message | Payload | Purpose |
| --- | --- | --- |
| `announce` | `ScoreSnapshot` | Add or update a peer snapshot. |
| `leave` | `peerId` | Remove a peer from the roster. |
| `roster` | `ScoreSnapshot[]` | Send current peer list from host to newly connected peer. |

## Data Constraints

- Room codes are normalized to lowercase alphanumeric and hyphen.
- Display names are trimmed, whitespace-normalized, and limited to 24 characters.
- Reasons are selected from presets only.
- Productivity score is clamped from 1 to 10.
