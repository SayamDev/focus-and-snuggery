# Voice and rhythm extension review

## Scope and visual compatibility

This is an ordinary extension of the chosen 12ui candidate B sage-and-ivory world. `DESIGN.md`, `.impeccable/design.json` and `.impeccable/direction.md` remain the incumbent authority and were preserved. New panels, fields, disclosure controls and labelled speech actions reuse semantic colors, existing type, rounded controls, focus outlines and responsive wrapping. No new imagery, Lottie or visual-world exploration was needed.

The focus screen now separates the current task from session controls: rhythm and phase information accompany the existing functional ring, and task actions form a separate group. The extension-specific mobile ring is 168px with 2.25rem digits to keep rhythm controls reachable. This is a local layout adjustment to the baseline component, not a replacement identity. Voice fields stack below 700px; explanatory details use native disclosure controls with a 48px minimum summary height. Written content remains available when speech is unused.

## Implemented behavior

- Optional Kokoro speech runs in a worker using q8 WASM. Emma/George provide British styles and Heart an American style; pace choices are 0.8, 1 and 1.15. Users explicitly load the resource and start reading. Progress, cancellation, failure messages, Stop and saved-model/style removal are available. Navigation and speech-setting changes stop playback; long reviews use consecutive chunks.
- Model/styles come from Hugging Face, runtime files from the app or jsDelivr. Private reading text is synthesized locally. Initial downloads have network metadata and resource costs. Cached loading remains explicit after reload, and browser eviction can require another download. Removal clears Kokoro model/styles, leaving shared runtime files. Device read-aloud uses installed local English voices; dictation keeps its distinct consent notice.
- Flexible timing retains the task estimate. Gentle uses 10 minutes focus/3 rest; Pomodoro uses 25/5, with 15 minutes rest after four focus rounds. Every phase waits for the user to start. Pause, extend and reset remain available; a round does not complete a task automatically. Active rhythms survive task completion, while session rounds reset on reload.
- Starter prompts help begin a brain dump. Thought capture saves to Later, preserves the current task and timer, and retains crisis gating and session undo. Older backups receive defaults for added preferences.

## Evidence checked

30 unit tests and 15 browser flows passed in the completion run, covering rhythm timing, voice failure/cancellation, long review playback, older backups, task capture and keyboard controls.

`evidence/natural-voice-real.json` records actual synthesis/playback starting, Stop, offline reload with cached speech and complete Kokoro model/style removal passing without browser errors. Download requests identify Hugging Face resources and jsDelivr WASM. This is distinct from mocked controller tests.

`evidence/upgrade-ui-report.json` records 19 clean states: focus, brain dump and voice settings in light/dark at 1440px/1035px/390px, plus dark mobile rest. Those states have no axe violations or horizontal overflow, and the report records no browser errors. The requested 1035px capture is included. Baseline production evidence remains in `report.json`, `extra-report.json` and `offline-report.json`.

README.md records six moderate advisories in the Node-only transitive inference/proxy chain and the patched Sharp override. Browser synthesis evidence does not erase dependency audit findings or approve a Node inference deployment.

## Remaining review

Human listening quality and accent/pace preference, low-end/mobile load and playback performance, actual VoiceOver/NVDA use and testing with neurodivergent participants remain unverified. Optional WebLLM/WebGPU task inference remains unverified; successful Kokoro WASM synthesis does not cover it. Microphone-provider privacy/device behavior, mobile install, background alerts and measured Core Web Vitals also need device or human validation. There is no WCAG certification or claim of medical benefit.

Final independent review: ship at reviewed code scope. Both material voice findings and the mobile Undo label were resolved. `evidence/upgrade-ui-confirmation.json` records the targeted screenshot confirmations; finite CSS transitions are disabled for static capture so the accelerated timer clock does not leave a misleading navigation highlight. The current user preview has the natural voice downloaded and initialized in Settings.
