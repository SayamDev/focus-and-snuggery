# Asset manifest

No missing asset slots and no Lottie assets.

- `public/art/planning-art.png`: 12ui converted botanical planning image; brain dump callout. Rendered at 150px desktop, 120px mobile, decorative alt text.
- `public/art/breathing.png`: 12ui converted breath illustration; breathing choice, rendered at 220x160 desktop.
- `public/art/grounding.png`: 12ui converted stacked-stone illustration; grounding choice, rendered at 220x160 desktop.
- `public/art/focus-illustration.png`: retained 12ui introduction reference asset; the current welcome dialog uses `welcome-corner.webp` instead.
- `design-reference/pages/p2-check-in.assets/botanical.png`: original conversion asset retained for provenance; unused `public/art/botanical.png` was removed from production.
- `public/icon.svg`, `icon-192.png`, `icon-512.png`: generated locally from the Phosphor Plant icon. Source script: `scripts/icons.mjs`.
- Fonts: self-hosted Lato and Atkinson Hyperlegible via Fontsource. Bundled licence files are retained in their npm packages.

Paid generated images, editable HTML and all conversion assets are retained in `design-reference/`. The reference HTML is generation output; its example claims and controls are not the application’s data behavior. Production code follows the supplied brief.

## Optional speech resources

The voice extension adds no decorative images, Lottie files or missing visual slots. The existing candidate B reference assets remain the visual source.

- `src/features/voice/kokoro.worker.ts`: browser worker using `kokoro-js`, q8 WASM and `onnx-community/Kokoro-82M-v1.0-ONNX`; model resources download from Hugging Face only after explicit loading.
- Voice styles: `bf_emma`, `bm_george` and `af_heart`, prepared together during loading. They are cached runtime resources, not checked-in illustration assets.
- WASM runtime resources can come from the bundled app or jsDelivr. Model/style removal deletes Kokoro entries and voice cache; shared runtime resources may remain. Browser eviction can remove downloaded files.
- Generated reading clips use temporary object URLs, revoked by playback cleanup. Private reading text is synthesized in the browser worker; initial resource hosts receive download network metadata.

See README.md for download sizes, implementation references and the dependency audit note. Real synthesis/offline/removal evidence is recorded in `evidence/natural-voice-real.json`; perceptual quality is not established by that test.

## Welcome illustration

`public/art/welcome-corner.webp` is an original AI-generated watercolor reading corner, optimized to WebP. The welcome dialog uses it as a decorative CSS background; quiet and low-sensory modes suppress the artwork. Brand and supporting text use a solid sage field to preserve contrast across image crops. The design reference and original generated image remain in the local design archive.
