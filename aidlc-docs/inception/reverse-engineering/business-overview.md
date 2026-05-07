# Business Overview

## Product Summary

Boring Meeting Flyswatter is a browser-only meeting companion that detects a first boredom point from silence and inactivity, launches a short fly-swatting game, and asks participants why the meeting became boring. The product turns an otherwise invisible meeting-quality signal into a small shared artifact.

## Business Intent

Meetings often lose energy before anyone says so. The product records that first drop in attention without blaming a person, then converts the moment into a playful intervention and recap. The goal is to make meeting improvement visible, lightweight, and privacy-preserving.

## Primary Value Proposition

- Capture the first boredom moment once per meeting.
- Avoid recording content or identifying sensitive participant comments.
- Make the signal memorable through a 15-second game.
- Share aggregate recap signals with peers in the same room.
- Demonstrate a complete hackathon MVP in a static browser deployment.

## Domain Vocabulary

| Term | Meaning |
| --- | --- |
| Meeting | A local browser session in which inactivity and speech are monitored. |
| Boredom Point | The first time the meeting reaches 60 seconds of silence and inactivity. |
| Swatting Round | A 15-second mini-game triggered by the boredom point. |
| Fly | A normal target worth +1 score. |
| Treat | A bonus item that multiplies current score by 2. |
| Golden Bee | A moving bonus target worth +10 in the current implementation. |
| Reason Preset | A fixed boredom reason tag selected after the meeting. |
| Productivity Score | A 1 to 10 subjective score shared after the meeting. |
| Room | A PeerJS-mediated WebRTC group for score and recap sharing. |

## Current MVP Scope

- Browser-only frontend.
- Local activity and microphone detection.
- One boredom event per meeting.
- Swatting game with flies, treat, and golden bee.
- Recap with reasons and productivity score.
- PeerJS room sharing.
- Document Picture-in-Picture support where available.
- GitHub Pages deployment.

## Explicit Non-Goals

- Recording or transcribing meeting audio.
- Free-text reason collection.
- Account system.
- Persistent backend storage.
- Self-hosted signaling server.
- OS-level system audio capture for desktop meeting apps.
