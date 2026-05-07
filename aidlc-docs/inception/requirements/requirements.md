# Requirements

## Intent

Boring Meeting Flyswatter helps teams notice the first boredom point in a meeting by monitoring local silence and inactivity, launching a short playful swatting intervention, and collecting structured recap signals without accounts, recording, or free-text personal data.

## Problem Statement

Meetings often become unproductive gradually. Participants may notice the silence or loss of attention, but the moment is rarely captured. Without a lightweight signal, teams cannot easily discuss why the meeting lost energy or improve the next meeting.

## Success Criteria

- A participant can start a meeting in the browser.
- The app detects 60 seconds of local silence and inactivity.
- The app records only the first boredom second for the meeting.
- A 15-second swatting game starts after user confirmation.
- The participant can score points by hitting game targets.
- The meeting can end and show a recap.
- The participant can select a preset boredom reason.
- The participant can enter a 1 to 10 productivity score.
- Peers in the same room can share score and recap signals.
- The app can be submitted and reviewed as a static MVP.

## Functional Requirements

| ID | Requirement | Priority | Current Status |
| --- | --- | --- | --- |
| FR-01 | Start and end a meeting session. | Must | Implemented |
| FR-02 | Track meeting seconds and inactive seconds. | Must | Implemented |
| FR-03 | Reset inactivity on local keyboard, pointer, focus, input, visibility, or speech activity. | Must | Implemented |
| FR-04 | Trigger swatting once after 60 seconds of inactivity. | Must | Implemented |
| FR-05 | Record `firstBoredomSecond`. | Must | Implemented |
| FR-06 | Present an armed swatting overlay before the 15-second round begins. | Should | Implemented |
| FR-07 | Render moving fly targets worth +1. | Must | Implemented |
| FR-08 | Render a treat bonus that doubles current score. | Should | Implemented |
| FR-09 | Render a golden bee bonus worth +10. | Should | Implemented |
| FR-10 | Return to monitoring when the swatting timer ends. | Must | Implemented |
| FR-11 | Prevent a second boredom-triggered swatting round in the same meeting. | Must | Implemented |
| FR-12 | Show a completed meeting summary. | Must | Implemented |
| FR-13 | Allow exactly one preset boredom reason selection. | Must | Implemented |
| FR-14 | Allow productivity score from 1 to 10 only after completion. | Must | Implemented |
| FR-15 | Share peer score snapshots by room code. | Should | Implemented |
| FR-16 | Persist local language, room, display name, and peer ID. | Should | Implemented |
| FR-17 | Provide JA, EN, ES, and ZH UI language switching. | Should | Implemented |
| FR-18 | Show browser notification when swatting starts off-tab. | Could | Implemented |
| FR-19 | Show Document Picture-in-Picture meter when supported. | Could | Implemented |

## Non-Functional Requirements

| ID | Requirement | Priority | Current Status |
| --- | --- | --- | --- |
| NFR-01 | Run without a custom backend. | Must | Implemented |
| NFR-02 | Avoid recording, transcription, or free-text PII. | Must | Implemented |
| NFR-03 | Keep core rules unit-testable as pure functions. | Must | Implemented |
| NFR-04 | Pass lint, typecheck, test, and build before submission. | Must | Implemented |
| NFR-05 | Deploy as a static site. | Must | Implemented |
| NFR-06 | Provide accessible labels on interactive targets. | Should | Partially implemented |
| NFR-07 | Support browsers without Document Picture-in-Picture by falling back to in-tab display. | Should | Implemented |
| NFR-08 | Maintain 100% coverage. | Should | Not currently met |

## Constraints

- The MVP must stay browser-only for the hackathon submission.
- No account system is required.
- No backend persistence is required.
- No free-text boredom reason should be collected.
- PeerJS public broker is acceptable for MVP room discovery.
- The existing implementation uses Bun and Vite.

## Out of Scope

- Self-hosted Hono signaling server.
- Persistent meeting history.
- Camera presence detection.
- OS-level desktop meeting app audio capture.
- Production-grade monitoring.
- Enterprise authentication.
