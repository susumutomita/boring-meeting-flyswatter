# Components

## Frontend Components

| Component | Responsibility | Inputs | Outputs |
| --- | --- | --- | --- |
| `App` | Coordinates state, hooks, and screen selection. | Browser events, hooks, local storage. | Rendered app shell and state transitions. |
| `SwatterArena` | Renders game board and target controls. | `ActiveGame`, swatter pose, callbacks. | Pointer and button events. |
| `MeetingSummary` | Renders recap and sharing area. | `MeetingState`, peer data, form values. | Reason, productivity, room, and display name updates. |
| `PipMeter` | Renders detached compact meter. | Audio capture status and labels. | Toast click event. |
| `RoomConnect` | Renders room join form. | Room code, display name, status. | Join, leave, and field updates. |
| `ScoreLeaderboard` | Renders ranked peers. | Peer snapshots and self peer ID. | Read-only ranking. |
| `ReasonPicker` | Renders preset reason buttons. | Selected reasons and callback. | Preset toggle events. |
| `ReasonAggregate` | Renders reason tally. | Peer snapshots. | Read-only aggregate. |

## Hook Components

| Hook | Responsibility | Side Effects |
| --- | --- | --- |
| `useMeetingTick` | Runs timers and calls current tick handlers through refs. | `setInterval`. |
| `useActivityTracking` | Converts DOM activity into labels. | Window and document event listeners. |
| `useMicrophoneActivity` | Acquires microphone stream. | `getUserMedia`. |
| `useStreamSpeechDetector` | Samples audio and emits speech events. | Web Audio, animation frame, stream cleanup. |
| `useSwatter` | Manages pointer pose, keyboard swats, hit effects, and delayed visual effects. | Pointer capture and timeouts. |
| `useScoreShare` | Manages PeerJS host/client lifecycle. | PeerJS connections and data sends. |
| `useDocumentPip` | Opens and closes detached meter window. | Document Picture-in-Picture. |
| `useBoredomNotification` | Requests permission and sends notification. | Browser Notification API. |

## Library Components

| Module | Responsibility | Test Coverage |
| --- | --- | --- |
| `meeting.ts` | Meeting and swatting state machine. | Yes |
| `audio.ts` | Audio signal classification. | Yes |
| `scoreShare.ts` | Room and aggregate utilities. | Yes |
| `i18n.ts` | Translation utilities. | Yes |
| `meetingTips.ts` | Meeting tips. | Yes |
| `quotes.ts` | Quotes. | Yes |
| `sponsoredItems.ts` | Bonus item catalog. | Yes |
