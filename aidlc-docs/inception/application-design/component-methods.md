# Component Methods

## Meeting State Methods

| Method | Input | Output | Purpose |
| --- | --- | --- | --- |
| `startMeeting` | None | `MeetingState` | Creates a monitoring state. |
| `advanceMeeting` | `MeetingState`, optional game factory | `MeetingState` | Advances timing and triggers boredom when needed. |
| `registerActivity` | `MeetingState`, label | `MeetingState` | Resets inactivity while monitoring. |
| `startSwattingGame` | `MeetingState` | `MeetingState` | Starts the armed swatting round. |
| `moveFlies` | `MeetingState` | `MeetingState` | Moves targets and updates spawn timers. |
| `swatFly` | `MeetingState`, fly ID, optional replacement factory | `MeetingState` | Scores and replaces a fly target. |
| `swatTreat` | `MeetingState` | `MeetingState` | Applies score multiplier and consumes treat. |
| `swatBee` | `MeetingState` | `MeetingState` | Scores and removes golden bee. |
| `endMeeting` | `MeetingState` | `MeetingState` | Completes the meeting. |
| `selectMeetingMetrics` | `MeetingState` | `MeetingMetrics` | Computes recap metrics. |

## Audio Methods

| Method | Input | Output | Purpose |
| --- | --- | --- | --- |
| `computeRmsDecibels` | `Float32Array` | `number` | Converts audio samples to decibel value. |
| `isSpeechSample` | Recent decibel samples | `boolean` | Determines whether sustained speech is present. |

## Score Sharing Methods

| Method | Input | Output | Purpose |
| --- | --- | --- | --- |
| `sanitizeRoomCode` | Raw string | String | Normalizes room code. |
| `sanitizeDisplayName` | Raw string | String | Normalizes display name or returns guest. |
| `buildHostPeerId` | Room code | String | Derives deterministic host peer ID. |
| `mergePeerScores` | Existing snapshots and incoming snapshot | Snapshot list | Upserts peer state. |
| `removePeerScore` | Existing snapshots and peer ID | Snapshot list | Removes disconnected peer. |
| `rankPeers` | Snapshots | Snapshot list | Sorts leaderboard. |
| `averageProductivityScore` | Snapshots | Average and respondent count | Aggregates subjective scores. |
| `tallyReasons` | Snapshots | Reason tally list | Aggregates selected reason presets. |

## Hook Callback Contracts

| Hook | Callback | Meaning |
| --- | --- | --- |
| `useActivityTracking` | `onActivity(label)` | Browser activity detected. |
| `useMicrophoneActivity` | `onSpeech()` | Local speech detected. |
| `useMicrophoneActivity` | `onError(error)` | Audio capture failed. |
| `useMeetingTick` | `onSecondTick()` | One meeting second elapsed. |
| `useMeetingTick` | `onFlyTick()` | Swatting tick elapsed. |
| `useSwatter` | `onSwatFly(flyId)` | Fly hit was selected. |
| `useSwatter` | `onSwatTreat(point)` | Treat hit was selected. |
