# User Stories

## Story 1. Start Meeting Monitoring

As a meeting participant, I want to start monitoring from a browser tab, so that I can capture meeting boredom without installing anything.

### Acceptance Criteria

- The user can start a meeting from the main screen.
- The app enters monitoring phase.
- Meeting seconds start increasing.
- Activity and microphone detection run while the meeting is active.

## Story 2. Detect the First Boredom Point

As a meeting facilitator, I want the app to detect the first silence and inactivity threshold, so that the meeting has a concrete boredom timestamp.

### Acceptance Criteria

- Inactivity increases while no activity is detected.
- Activity resets inactivity while monitoring.
- At 60 inactive seconds, the app enters swatting phase.
- `firstBoredomSecond` is recorded.
- The swatting trigger happens only once per meeting.

## Story 3. Play the Swatting Intervention

As a participant, I want a short game after boredom is detected, so that the intervention feels playful rather than punitive.

### Acceptance Criteria

- A 15-second swatting round is available after the armed overlay.
- Flies move in the arena.
- Hitting a fly adds score.
- The treat bonus doubles current score.
- The golden bee adds its reward when clicked.
- The round ends and returns to monitoring.

## Story 4. Review Meeting Recap

As a facilitator, I want to end the meeting and view a recap, so that I can discuss why the meeting lost energy.

### Acceptance Criteria

- Ending the meeting enters completed phase.
- The summary shows score-related recap.
- The user can select one boredom reason preset.
- Selecting the same preset again clears it.
- The user can set productivity score from 1 to 10.

## Story 5. Share Recap with Room Peers

As a participant, I want to join a room and share score signals, so that the group can see aggregate feedback.

### Acceptance Criteria

- Room code is normalized.
- Empty display name falls back to guest.
- The local user appears in the peer list.
- Peer snapshots update as scores or recap values change.
- Reason tallies and productivity averages are computed from peer snapshots.

## Story 6. Preserve Privacy

As a privacy-conscious user, I want the app to avoid recording or free-text feedback, so that I can use it during real meetings.

### Acceptance Criteria

- Microphone input is analyzed locally as signal level only.
- No audio content is stored.
- No free-text boredom reason field exists.
- Room sharing sends structured snapshots only.

## Story 7. Submit the Hackathon MVP

As a hackathon reviewer, I want to see AI-DLC Inception artifacts, so that I can verify the project has clear intent, design, and unit decomposition.

### Acceptance Criteria

- `aidlc-docs/` exists.
- `aidlc-docs/aidlc-state.md` marks Inception completed.
- Requirements, design, and units are documented.
- The documents acknowledge that the MVP existed before this Inception documentation pass.
