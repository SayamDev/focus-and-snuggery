# Accessibility evidence and limits

Focus & Snuggery targets WCAG 2.2 AA. This is an implementation target, not certification or a claim that automated checks establish suitability.

## Implemented support

- A native modal welcome dialog has a labelled title/description, initial heading focus, contained Tab/Shift+Tab navigation, Escape/Skip setup dismissal and focus restoration. Optional name and voice setup are skippable; Settings can replay the introduction. Existing onboarded users are not forced through it.
- Shared selects retain native select semantics and keyboard interaction, with a decorative inset caret. Forced-colors mode restores the browser arrow. The toolkit return action uses a single left arrow with its text label.
- Labelled native controls; navigation and pressed/expanded states; a skip link targeting `main-content`.
- Keyboard focus outline of 3px, normally offset by 4px; route changes focus the main region. Review, smaller-step and stuck panels receive focus. Validation uses visible alerts and focuses invalid fields where implemented.
- Controls generally have a minimum 48px height; grouped checkbox labels retain 48px hit areas.
- Light, dark, device, low-sensory and high-contrast choices; quiet mode hides decorative images. Lato or Atkinson Hyperlegible and 18/20/22px body text.
- Reduced motion follows both the OS preference and the app setting. Breathing starts by explicit action, supports pause/stop and retains written cues without animation.
- Read-aloud is user-triggered, with labelled voice/style/pace fields, preparation status, download cancellation and Stop reading. Tasks, reviewed steps and grounding prompts retain their written content. Device speech and optional locally generated Kokoro speech are separate from local Whisper dictation.
- Brain dump documents Enter to find/review steps and Shift+Enter for a newline, with a visible Find small steps button beside the textarea. Saving reviewed steps opens What’s next. Unclear fragments are retained for clarification rather than generated as generic tasks.
- Dictation uses explicit model loading and recording actions, permission/setup/transcription statuses, cancel/discard controls, and an editable transcript that receives focus. Adding a transcript returns focus to the note; it does not save tasks. Model setup leaves the microphone off, and recordings are bounded to 30 seconds.
- Brain-dump starters are labelled buttons. Thought capture focuses its field, reports validation errors and saves to Later without replacing the current task or timer.
- Optional focus/rest rhythms require an explicit start for each phase; the active phase uses text and underlining in addition to color. Finishing a task does not discard an active rhythm.
- Timer supports pause, extension and reset. Its accessible remaining-time label has live announcements off to avoid second-by-second interruptions. Status and errors use polite status or alert regions.
- Decorative illustrations use empty alt text. Core actions retain text labels. Onboarding can be skipped; grounding senses can be skipped.

## Recorded verification

- 36 unit tests and 21 browser flows passed in the release run, including welcome dismissal/focus containment, keyboard use and saved-name compatibility. See `evidence/release-unit.log` and `evidence/release-browser.log`.
- `evidence/release-ui.json`: 20 main-route responsive captures recorded no horizontal overflow across desktop/mobile, dark, largest text and 320px high-contrast configurations. These records report overflow only, not a new axe result. Welcome artwork contrast and the mobile action footer received final reviewer adjustments; their final visual recheck is separate from this report.
- `evidence/dictation-real.json`: generated speech through Chromium’s simulated microphone passed actual Whisper inference, transcript review, note insertion and task splitting. This does not verify a physical microphone, every accent or transcription accuracy in noisy environments.
- `evidence/welcome-voice-real.json`: the welcome dialog loaded the real natural-voice model, started synthesis, stopped playback and remained open.
- `evidence/report.json`: twenty page/theme/viewport combinations (five main pages, light/dark, 1440px/390px) recorded no axe violations or horizontal overflow, with no browser errors or failed requests. Smaller-step review was axe clean; larger-text/high-contrast mobile recorded no overflow.
- The same report records a 3px skip-link focus outline, `main-content` target and reduced-motion animation value `none`.
- `evidence/extra-report.json`: the earlier onboarding at desktop/mobile, editable review and crisis support recorded no axe violations.
- `evidence/offline-report.json`: production service-worker control, offline reload and offline splitting passed without browser errors. Production storage persistence was also checked during the browser run.

- `evidence/upgrade-ui-report.json`: 19 extension states recorded no axe violations or horizontal overflow and no browser errors: focus, brain dump and voice settings in light/dark at 1440px/1035px/390px, plus a dark mobile rest phase. This includes the requested 1035px capture.
- `evidence/natural-voice-real.json`: actual Kokoro synthesis and playback started, Stop passed, offline reload plus cached speech passed, and complete model/style cache removal passed, with no recorded browser errors. Shared runtime caches may remain after removal. This verifies functioning synthesis/playback, not human listening quality.

These results cover the tested states, browser and flows. They do not establish every interaction or assistive-technology combination.

## Remaining validation

Actual VoiceOver/NVDA use, optional WebLLM/WebGPU task inference, real-device microphone and permission behavior, mobile installation and measured Core Web Vitals have not been validated. Kokoro WASM speech was tested; that evidence does not verify WebLLM inference. Whisper inference was tested separately with simulated microphone audio; physical-device recording and offline dictation reuse remain unverified. Real human listening quality, low-end/mobile voice performance, local installed voice availability and screen-reader interactions remain unverified. There is no WCAG certification. Dictation, notifications, vibration, wake lock and background timer behavior need device-specific testing; timer, breathing and voice-status announcements need human review.

Before broad release, test with neurodivergent participants: comprehension, sensory comfort, font preference, keyboard and screen-reader workflows, task relevance, energy choices, timer guidance, backup recovery and crisis-message clarity. Include disabled users in deciding what feels supportive. Review crisis detection and wording with appropriate experts; pattern matching can miss wording or produce false positives. Record findings and remediate barriers before claiming effectiveness or suitability.
