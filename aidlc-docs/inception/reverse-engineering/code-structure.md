# Code Structure

## Repository Layout

```text
.
├── README.md
├── CLAUDE.md
├── Plan.md
├── Makefile
├── package.json
├── packages/
│   └── frontend/
│       ├── package.json
│       ├── vite.config.ts
│       ├── src/
│       │   ├── App.tsx
│       │   ├── app.css
│       │   ├── components/
│       │   ├── hooks/
│       │   └── lib/
│       └── dist/
└── docs/
    ├── specs/
    ├── images/
    └── adr/
```

## Source Ownership

| Area | Files | Responsibility |
| --- | --- | --- |
| App Orchestration | `App.tsx` | Wires state, hooks, sharing, PiP, notification, and views. |
| Game UI | `components/SwatterArena.tsx`, `app.css` | Renders targets, score, swatter, animations, and idle state. |
| Recap UI | `components/MeetingSummary.tsx`, `ReasonPicker.tsx`, `ReasonAggregate.tsx` | Captures reason and productivity feedback. |
| Room UI | `RoomConnect.tsx`, `ScoreLeaderboard.tsx` | Handles room form and peer ranking display. |
| Browser Hooks | `hooks/` | Encapsulate activity, microphone, PiP, notification, ticks, WebRTC, and swatter interaction. |
| Domain Logic | `lib/meeting.ts` | Meeting phase transitions, game rules, scoring, metrics, and formatting. |
| Utility Logic | `lib/audio.ts`, `lib/scoreShare.ts`, `lib/i18n.ts`, `lib/meetingTips.ts`, `lib/quotes.ts`, `lib/sponsoredItems.ts` | Pure utilities with tests. |

## Build System

- Root workspace uses Bun workspaces.
- Frontend package uses Vite.
- TypeScript runs with `tsc --noEmit`.
- Biome runs at repository root.
- Tests run with `bun test`.

## Test Structure

Tests live beside pure logic in `packages/frontend/src/lib/*.test.ts`. Current tests focus on:

- Meeting state transitions.
- Game scoring and target behavior.
- Audio sample classification.
- Score sharing aggregation.
- i18n utilities.
- Meeting tips and quotes.
- Sponsored item selection.

## Notable Technical Debt

- `packages/frontend/src/lib/meeting.ts` contains several gameplay responsibilities in one module.
- `useTabAudioActivity.ts` remains in the codebase even though README says tab audio capture was removed.
- `Plan.md` contains completed entries for alarm and stun behavior that are not present in current code.
- ADR directory exists but has no accepted ADR files.
