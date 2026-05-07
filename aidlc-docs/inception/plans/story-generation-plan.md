# Story Generation Plan

## Goal

Generate user stories that express the MVP's value in reviewer-readable language and map each story to existing implementation units.

## Inputs

- `README.md` product pitch and feature table.
- Existing React components and hooks under `packages/frontend/src`.
- Existing pure domain logic under `packages/frontend/src/lib`.
- Existing test files under `packages/frontend/src/lib/*.test.ts`.

## Story Format

Each story uses the format:

`As a <persona>, I want <capability>, so that <outcome>.`

Each story includes acceptance criteria that can be observed in the current MVP or verified with existing tests.

## Questions and Answers

### Question 1

Should stories describe only implemented MVP behavior or include roadmap ideas?

[Answer]: Only implemented MVP behavior. Roadmap ideas can be documented as out of scope or future work.

### Question 2

Should privacy be treated as a dedicated story?

[Answer]: Yes. Privacy is part of the product promise because the app avoids accounts, recording, and free-text PII.
