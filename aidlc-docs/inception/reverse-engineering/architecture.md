# Architecture

## System Context

```mermaid
flowchart LR
    User[Meeting Participant] --> Browser[Browser App]
    Browser --> Mic[Microphone API]
    Browser --> Activity[Window Activity Events]
    Browser --> Pip[Document Picture-in-Picture API]
    Browser --> Notification[Browser Notification API]
    Browser --> PeerJS[PeerJS Broker]
    PeerJS --> Peer[Other Browser Peer]
    Browser <-. WebRTC Data Channel .-> Peer
    Pages[GitHub Pages] --> Browser
```

## Runtime Architecture

```mermaid
flowchart TD
    App[App.tsx] --> MeetingLib[lib/meeting.ts]
    App --> ActivityHook[useActivityTracking]
    App --> MicHook[useMicrophoneActivity]
    MicHook --> StreamDetector[useStreamSpeechDetector]
    StreamDetector --> AudioLib[lib/audio.ts]
    App --> TickHook[useMeetingTick]
    TickHook --> MeetingLib
    App --> SwatterHook[useSwatter]
    SwatterHook --> MeetingLib
    App --> ShareHook[useScoreShare]
    ShareHook --> ScoreShareLib[lib/scoreShare.ts]
    App --> Arena[SwatterArena]
    App --> Summary[MeetingSummary]
```

## State Flow

```mermaid
stateDiagram-v2
    [*] --> idle
    idle --> monitoring: startMeeting
    monitoring --> swatting: 60 seconds inactive
    swatting --> monitoring: round timer reaches zero
    monitoring --> completed: endMeeting
    swatting --> completed: endMeeting
    completed --> idle: new session
```

## Key Architectural Decisions

| Decision | Rationale |
| --- | --- |
| Browser-only MVP | Removes account, backend, and deployment overhead for hackathon submission. |
| Pure meeting state functions | Allows core behavior to be tested with Bun without browser rendering. |
| Hooks for browser APIs | Keeps microphone, notification, activity, and WebRTC side effects outside pure logic. |
| PeerJS room sharing | Provides lightweight room discovery without building a signaling server. |
| Preset reason tags | Avoids PII and keeps recap data structured. |
| GitHub Pages | Static deployment matches browser-only architecture. |

## Architecture Risks

- PeerJS public broker introduces dependency on external availability and metadata exposure.
- Browser APIs vary by browser, especially Document Picture-in-Picture.
- Microphone permission denial creates a degraded experience.
- `meeting.ts` is growing and should be split before more mechanics are added.
