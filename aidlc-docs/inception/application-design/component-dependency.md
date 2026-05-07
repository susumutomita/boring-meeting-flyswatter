# Component Dependency Matrix

## Dependency Matrix

| From | To | Dependency Type | Rationale |
| --- | --- | --- | --- |
| `App` | `lib/meeting.ts` | Direct import | Top-level reducer calls drive meeting state. |
| `App` | `useMeetingTick` | Hook | Schedules meeting and game ticks. |
| `App` | `useActivityTracking` | Hook | Receives local activity. |
| `App` | `useMicrophoneActivity` | Hook | Receives speech activity and audio status. |
| `App` | `useSwatter` | Hook | Receives swat events and swatter pose. |
| `App` | `useScoreShare` | Hook | Receives peer snapshots and sharing status. |
| `App` | `useDocumentPip` | Hook | Renders PiP meter portal. |
| `App` | `useBoredomNotification` | Hook | Sends off-tab alert. |
| `SwatterArena` | `lib/meeting.ts` types and `formatClock` | Type and utility import | Displays active game and timer. |
| `MeetingSummary` | `lib/scoreShare.ts` | Utility import | Aggregates reasons and productivity scores. |
| `ScoreLeaderboard` | `lib/scoreShare.ts` | Utility import | Ranks peers. |
| `useSwatter` | `lib/meeting.ts` | Utility import | Selects fly within swat reach. |
| `useMicrophoneActivity` | `useStreamSpeechDetector` | Hook composition | Reuses stream speech detector for microphone stream. |
| `useStreamSpeechDetector` | `lib/audio.ts` | Utility import | Classifies audio samples. |
| `useScoreShare` | `peerjs` | Runtime dependency | Creates PeerJS host and client connections. |

## Communication Patterns

- Parent-to-child props for UI rendering.
- Callback props for user events.
- Reducer-style pure function calls for domain state changes.
- React refs for stable hook callbacks.
- PeerJS messages for cross-browser room sharing.

## Coupling Assessment

The highest coupling is between `App`, `meeting.ts`, and the swatting components. This is acceptable for the MVP but should be reduced if more gameplay mechanics are added.
