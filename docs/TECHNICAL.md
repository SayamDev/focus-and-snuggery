# Technical notes

Focus & Snuggery is a static React/TypeScript app built with Vite, Tailwind, Dexie, Zod and vite-plugin-pwa. The release destination is [GitHub Pages](https://sayamdev.github.io/focus-and-snuggery/). The [README](../README.md) introduces the product; these notes describe implementation and limits.

## Run and publish

Use Node 22.12+ and npm. From the repository root:

```sh
npm ci
npm run dev
npm run test
npx playwright install chromium
npm run test:e2e
npm run build
npm run preview
```

Publish `dist/` to a static HTTPS host. Relative Vite asset paths and hash navigation support the GitHub Pages repository subpath. No backend, paid API, environment variables or application secrets are required. A deployment URL is the selected destination, not evidence that publishing has completed.

## Storage and state

Dexie retains the original `focusnest` database identity so the brand change preserves saved tasks, check-ins and preferences. Zod validates data and complete v1 JSON backups, including task title, integer 2–15 minute estimate and effort. Imports reject duplicate IDs and oversized files. Preferences added later receive schema defaults.

The optional `displayName` is stored in this browser, has a 48-character limit and is editable in Settings. New users see a skippable native welcome dialog; already onboarded older records receive a compatible welcome-version default. Escape/Skip setup dismiss it; Start with a brain dump opens the composer. Settings → Show introduction replays it. Modal focus containment and restoration accompany native `showModal()` behavior.

Tasks and preferences persist; the current brain-dump draft, undo history and focus rounds belong to the open tab. Export before clearing browser data or deleting records. JSON backups contain private information and are not encrypted. Local data does not sync across devices or origins.

Core offline use requires an initial successful production load and installed service worker. Development mode is not an offline installation. Browser cache eviction may remove optional resources. Refresh/update and browser installation behavior vary by platform; background alerts and wake lock are best effort.

## Suggestions and focus

Deterministic rules remain the default. Recognized activities and concrete action wording become editable suggestions; unclear fragments remain separate for clarification and are retained in the draft after recognized steps are saved. Enter finds/reviews steps, Shift+Enter inserts a newline, and Save steps opens What’s next. No generated step becomes a task without review. Crisis patterns gate generation; they can miss wording or produce false positives and are not counselling or diagnosis.

Optional WebLLM loads Qwen2.5 0.5B on explicit activation, requires WebGPU and substantial download/memory resources, and validates output with retry/fallback. Download hosts receive network metadata; task inference runs locally. Session activation and cache availability are distinct. Actual WebLLM inference remains unverified.

Flexible timing uses the task estimate. Gentle is 10 minutes focus/3 rest; Pomodoro is 25/5 with 15 minutes rest after four focus rounds. Every phase waits for explicit start. Completing a task does not discard an active rhythm, and finishing a round does not complete a task. Timers reconcile elapsed time on return from background suspension. Thought parking saves a short Later task while preserving the current timer.

## Speech input and output

Kokoro read-aloud and Whisper dictation are separate optional workers. Neither downloads or starts recording/speaking automatically. Typed input and private speech text are processed locally; downloading public resources contacts Hugging Face and may use jsDelivr runtime files.

- **Kokoro output:** `kokoro-js`, q8 WASM and `onnx-community/Kokoro-82M-v1.0-ONNX`. Setup is approximately 115 MB including model, styles and runtime. Emma/George are British styles; Heart is American. Pace is selectable. Load in welcome or Settings, then press a read button. Stop/navigation cancel playback; long reviews use sequential chunks. Saved-model/style removal leaves shared runtime caches.
- **Whisper input:** `onnx-community/whisper-tiny.en`, q8 WASM, approximately 40 MB plus runtime. Explicit setup keeps the microphone off. Start recording requests permission; recordings are bounded to 30 seconds in English, decoded/resampled locally, then transcribed in a worker. Review/edit the transcript before Add to note. Cancel/discard and permission-specific errors are provided. Application code does not upload recordings.
- **Device output:** selects installed local English speech voices; availability and sound vary by device.

A fresh page requires explicit initialization even when resources are cached. Download hosts receive ordinary request metadata; browser quotas and eviction may require another download. Physical microphone, accent/noise tolerance and low-end/mobile performance need further testing.

## Structure and controls

`src/features/{braindump,next,checkin,calm,settings,voice,dictation}` owns feature UI and workers; `src/services` handles parsing, ordering, AI, storage and persistence; `src/types.ts` holds validation schemas. Shared `src/components/Select.tsx` preserves native select behavior with an inset decorative caret and forced-colors fallback. The toolkit return action uses one left arrow. [Design guidance](../DESIGN.md) and [asset provenance](../ASSETS.md) describe the retained visual system and original generated welcome artwork.

## Verification and known limits

The release run passed **36 unit tests and 21 browser flows**; logs are in unit results (`evidence/release-unit.log`, retained locally) and browser results (`evidence/release-browser.log`, retained locally). Responsive evidence (`evidence/release-ui.json`, retained locally) records 20 main-route captures with no horizontal overflow, including 320px/high-contrast and largest-text configurations. Those records do not report a fresh axe audit. The final reviewer marked the artwork text contrast, mobile action clearance and matching documentation fixes resolved.

Dictation evidence (`evidence/dictation-real.json`, retained locally) records actual Whisper inference using generated speech through Chromium’s simulated microphone, followed by transcript review, note insertion and task splitting. Natural-voice evidence (`evidence/natural-voice-real.json`, retained locally) records Kokoro synthesis/playback, Stop, offline reload/speech and model/style removal. Welcome-voice evidence (`evidence/welcome-voice-real.json`, retained locally) additionally verifies real voice loading, synthesis and Stop while the dialog stays open.

These are browser-pipeline results, not human listening assessments, physical microphone validation, measured Core Web Vitals, mobile installation proof or WCAG certification. Actual VoiceOver/NVDA and neurodivergent participant testing remain outstanding. See [accessibility evidence](../ACCESSIBILITY.md) and [release roadmap](../ROADMAP.md).

The speech dependency tree has six moderate advisories in its Node-only `onnxruntime-node`/proxy logging chain; the browser WASM worker does not use that chain. Sharp is overridden to patched 0.35.5. Browser tests do not erase dependency audit findings or approve a Node inference deployment. See [third-party notices](../THIRD_PARTY_NOTICES.md) for component/model licence boundaries.
