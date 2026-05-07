# Technology Stack

## Runtime and Package Management

| Technology | Role |
| --- | --- |
| Bun | Runtime, package manager, workspace runner, and test runner. |
| Bun Workspaces | Root project coordinates packages under `packages/*`. |

## Frontend

| Technology | Role |
| --- | --- |
| Vite | Development server and production bundler. |
| React 18 | UI framework. |
| TypeScript | Static typing. |
| CSS | Custom visual design and game animations. |

## Browser Capabilities

| Capability | Role |
| --- | --- |
| Web Audio API | Converts microphone samples into speech detection signal. |
| MediaDevices API | Requests local microphone permission. |
| Document Picture-in-Picture | Optional detached boredom meter. |
| Notification API | Optional off-tab alert. |
| WebRTC Data Channel | Peer score and recap synchronization. |
| Local Storage | Persists lightweight local preferences. |

## Networking

| Technology | Role |
| --- | --- |
| PeerJS | Room discovery and WebRTC connection abstraction. |
| PeerJS public broker | Current MVP signaling dependency. |

## Quality Tooling

| Tool | Role |
| --- | --- |
| Biome | Lint and format. |
| TypeScript compiler | Typecheck with `tsc --noEmit`. |
| Bun test | BDD-style unit tests. |
| textlint | Japanese README quality gate. |
| GitHub Actions | CI and GitHub Pages deployment. |
| safe-chain | CI dependency install safety. |

## Deployment

| Target | Role |
| --- | --- |
| GitHub Pages | Static hosting for the Vite build output. |

## Stack Fit

The stack fits the MVP because the product promise is browser-first, accountless, and privacy-preserving. A backend would add operational burden before the product proves the interaction model.
