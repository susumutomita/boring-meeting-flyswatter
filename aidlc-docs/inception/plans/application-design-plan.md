# Application Design Plan

## Goal

Document the design that supports the completed MVP and make the relationship between product idea, browser APIs, game loop, and room sharing explicit.

## Design Areas

| Area | Decision |
| --- | --- |
| Runtime | Bun workspace with a Vite frontend package. |
| UI Framework | React 18 with local component state and hooks. |
| Domain Logic | Pure TypeScript functions in `packages/frontend/src/lib`. |
| Meeting Detection | Window activity listeners and microphone RMS analysis. |
| Game Loop | React state plus one-second meeting ticks and 90 ms swatting ticks. |
| Sharing | PeerJS data connections over WebRTC. |
| Deployment | Static build deployed to GitHub Pages. |

## Questions and Answers

### Question 1

Is a backend required for the MVP?

[Answer]: No. The MVP intentionally runs in the browser. PeerJS uses a public broker for discovery, but score sharing happens through WebRTC data connections.

### Question 2

Where should core rules live?

[Answer]: Core meeting and game rules live in `packages/frontend/src/lib/meeting.ts` so they can be tested without rendering the UI.

### Question 3

How should privacy constraints shape the design?

[Answer]: The app stores only local preferences and shares preset reasons, score, phase, and productivity score. It does not record audio or allow free-text boredom reasons.

## Completion Criteria

- [x] Application design document created.
- [x] Component inventory created.
- [x] Service and hook responsibilities documented.
- [x] Dependency matrix created.
- [x] Units of work generated.
