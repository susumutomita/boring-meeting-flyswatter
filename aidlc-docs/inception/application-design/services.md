# Services

This MVP has no backend services. Service boundaries are implemented as frontend hooks and pure modules.

## Logical Services

| Service | Implementation | Responsibility |
| --- | --- | --- |
| Meeting State Service | `lib/meeting.ts` | Owns deterministic meeting and game rules. |
| Activity Detection Service | `useActivityTracking` | Converts local UI events into activity. |
| Speech Detection Service | `useMicrophoneActivity`, `useStreamSpeechDetector`, `lib/audio.ts` | Converts microphone levels into speech activity. |
| Swatter Interaction Service | `useSwatter` | Converts pointer and keyboard input into hit attempts and visual effects. |
| Score Sharing Service | `useScoreShare`, `lib/scoreShare.ts` | Synchronizes peer snapshots through PeerJS. |
| Notification Service | `useBoredomNotification` | Sends off-tab boredom notification. |
| PiP Service | `useDocumentPip` | Creates detached meter window when supported. |
| Localization Service | `lib/i18n.ts` | Provides language-specific UI strings. |

## Service Boundaries

- Services report events to `App`; `App` applies state reducers.
- Pure services do not touch browser APIs.
- Browser services clean up their listeners, streams, intervals, or connections.
- Sharing service sends only `ScoreSnapshot` data, not raw meeting content.

## Future Backend Services

| Future Service | Purpose | Current Status |
| --- | --- | --- |
| Hono Signaling Server | Replace public PeerJS broker with controlled signaling. | Roadmap |
| Meeting History Store | Persist local or backend trend data. | Roadmap |
| Operations Monitoring | Track demo health and deployment signals. | Out of scope |
