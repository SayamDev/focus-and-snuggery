---
name: Focus & Snuggery
description: Calm, predictable space for one small action.
colors:
  canvas: "#faf9f6"
  surface: "#fffefb"
  sidebar: "#f0f3ec"
  panel: "#eaf0e5"
  ink: "#1d3333"
  muted: "#53675d"
  line: "#c7d1c3"
  accent: "#46644f"
  on-accent: "#fffefb"
  selected: "#dce6d6"
  ring: "#6a8973"
  ring-track: "#cfd7cb"
  focus: "#3c7250"
  dark-canvas: "#1b2520"
  dark-surface: "#25332b"
  dark-sidebar: "#202c24"
  dark-panel: "#2c3b30"
  dark-ink: "#edf2e9"
  dark-muted: "#becbbb"
  dark-line: "#586d5b"
  dark-accent: "#b3c9a9"
  dark-on-accent: "#1b2b20"
  dark-selected: "#405642"
  dark-ring: "#aec5a3"
  dark-ring-track: "#536650"
  dark-focus: "#d1e5bb"
  low-sensory-canvas: "#eeeee7"
  low-sensory-surface: "#f3f3ed"
  low-sensory-sidebar: "#e7e9df"
  low-sensory-panel: "#e5e8de"
  low-sensory-ink: "#29372c"
  low-sensory-muted: "#536052"
  low-sensory-accent: "#485d46"
  low-sensory-selected: "#d6dccd"
  low-sensory-ring: "#6b7f62"
  contrast-canvas: "#fefdf7"
  contrast-surface: "#fefdf7"
  contrast-sidebar: "#f0f2e8"
  contrast-panel: "#e5edda"
  contrast-ink: "#142018"
  contrast-muted: "#304231"
  contrast-line: "#425a3f"
  contrast-accent: "#244924"
  contrast-selected: "#c6d9b4"
  contrast-ring: "#244924"
  contrast-ring-track: "#a5b79a"
  contrast-focus: "#153d18"
typography:
  headline:
    fontFamily: "Lato, Arial, sans-serif"
    fontSize: "2.1rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Lato, Arial, sans-serif"
    fontSize: "1.45rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Lato, Arial, sans-serif"
    fontSize: "18px"
    lineHeight: 1.5
  timer:
    fontFamily: "Lato, Arial, sans-serif"
    fontSize: "3.1rem"
    lineHeight: 1.15
    letterSpacing: "-0.035em"
rounded:
  field: "10px"
  control: "12px"
  navigation: "13px"
  surface: "16px"
  dialog: "20px"
  pill: "24px"
spacing:
  compact: "8px"
  control-gap: "10px"
  row-gap: "12px"
  grid-gap: "16px"
  section-gap: "24px"
  panel-padding: "26px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
    rounded: "{rounded.control}"
    padding: "12px 18px"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "12px 18px"
  button-secondary-hover:
    backgroundColor: "{colors.selected}"
  field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
    padding: "12px"
  panel:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.surface}"
    padding: "26px"
  navigation:
    backgroundColor: "{colors.selected}"
    textColor: "{colors.ink}"
    rounded: "{rounded.navigation}"
    padding: "16px"
  sensory-choice:
    backgroundColor: "{colors.selected}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "12px 18px"
  welcome-dialog:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.dialog}"
    width: "min(1020px, calc(100vw - 48px))"
  timer-ring:
    width: "270px"
    typography: "{typography.timer}"
---

# Design System: Focus & Snuggery

## Overview

**Creative North Star: "Calm, accessible and predictable"**

A calm, spacious workspace with warm ivory surfaces, restrained sage, readable sans typography and predictable controls. Selected 12ui candidate B is the visual authority; its original prototype, converted HTML and assets remain in `design-reference/`. The current production tokens in `src/styles.css` are normative for future screens.

Motion communicates an explicitly started exercise or real timer progress. The interface uses plain, respectful language, without guilt, pressure or autoplay motion.

**Key Characteristics:**

- Spacious composition and visible controls
- Tonal surfaces with restrained sage emphasis
- One current task and a functional timer ring

## Colors

### Primary

Restrained sage (`accent`) identifies primary actions; `on-accent` supplies their text. `ring` provides focus-time feedback and `focus` the keyboard outline. Selected controls use `selected`, with a border or weight change as an additional cue.

### Neutral

Warm ivory `canvas` surrounds near-white `surface`. Sage-tinted `sidebar` and `panel` group related content. `ink` carries body text, `muted` secondary copy, and `line` boundaries. Theme-prefixed tokens above capture actual dark, low-sensory and high-contrast overrides; unspecified overrides inherit the base values. Quiet mode further dims surface variables in CSS.

**The Semantic Color Rule.** Use the current theme’s semantic CSS variables in components; do not hard-code the light palette into a new screen.

## Typography

Lato with Arial/sans-serif fallback is the default. Atkinson Hyperlegible is a user-selectable alternative. Both are self-hosted. Normal body size is 18px, with 20px and 22px options. Body line-height is 1.5 and paragraphs stop at 70ch. Headings use bold weight, balanced wrapping and slightly tightened tracking. The task title deliberately uses regular weight; timer numerals are tabular.

Mobile page headings become 1.65rem; timer digits become 2.7rem. Keep relative type so user text-size preferences propagate.

## Layout

The shell has a 250px sidebar and flexible content, capped at 1800px. Sidebar widths reduce to 230px at 1350px and 200px at 900px. At 700px and below, navigation becomes an expandable two-column menu above content. Main padding is 42px 38px 28px 42px on desktop and 26px 18px on mobile.

Settings step from three to two to one column. Calm tools and check-in panels stack at 900px. The focus session controls wrap separately from the task actions; task actions become two columns on mobile. The primary session control spans the mobile row. Keep the flexible `minmax(0, 1fr)` treatment and text wrapping for long tasks. The welcome dialog uses an art/content split on desktop, stacks below 740px and scrolls within the viewport. Mobile welcome actions use a sticky footer on the surface background. Rhythm fields align to the baseline of the adjoining disclosure control.

## Elevation & Depth

Depth comes from tonal layering and one-pixel boundaries. Main content remains flat. The welcome modal alone uses `0 24px 80px #14201840` elevation above a `#18271ed1` backdrop. Selected buttons use a one-pixel inset accent stroke. Keyboard focus uses a 3px outline with 4px offset, and the energy radio indicator uses 3px offset.

## Shapes

Surfaces use gently curved 16px corners, controls 12px, fields 10px and navigation 13px. Energy choices and quiet controls use pills. Timer, mood symbols and breath cues use circles with a clear functional role.

## Components

- **Buttons:** labelled, at least 48px high; secondary hover uses the selected surface. Primary hover and active states dim with `brightness(0.94)`. Disabled controls reduce opacity to 0.55.
- **Fields:** full-width, visible one-pixel boundary, inherited typography and explicit labels. The brain-dump composer expands vertically and uses a spacious borderless textarea inside a tonal panel. Keep Find small steps beside the textarea and its Enter/Shift+Enter hint visible. Review is a separate focused stage; Save steps opens What’s next. Show unclear fragments in a supportive tonal note for clarification. The microphone panel uses existing labelled buttons, setup/status text and an editable transcript field; loading, recording and adding text are distinct explicit actions.
- **Selects:** native select inside a full-width relative wrapper, padded 14px/48px with an 18px decorative Phosphor caret inset 16px from the end. The icon ignores pointer events; forced-colors restores the native arrow.
- **Welcome:** skippable native modal, optional name and explicitly loaded natural voice, with a direct brain-dump action. Existing ivory/sage tokens and watercolor reading-corner art extend candidate B. Keep artwork separate from text on a solid field; hide decorative imagery in sensory modes.
- **Return action:** a single left arrow beside the descriptive label; retain the action’s 48px minimum target.
- **Navigation:** icon plus label, with selected background and `aria-current`; the mobile menu uses a labelled expansion control.
- **Choices:** mood and sensory buttons retain `aria-pressed`; energy uses native radios with pill labels and an outlined keyboard state.
- **Panels:** flat surfaces with a border; focus and supportive callouts use tonal backgrounds to group actions.
- **Timer ring:** 270px desktop and 300px on wide screens; the extended focus panel uses 168px on mobile with 2.25rem digits to keep rhythm controls reachable. A ten-unit SVG stroke shrinks with remaining time; numeric time and written labels remain available.
- **Breath cue:** starts only from the user’s exercise action; 10-second ease-in-out scale cycle (0.88 to 1.12), pause and stop controls. Reduced motion removes animation and transitions, while written cues remain.

## Do's and Don'ts

### Do:

- Do preserve the current theme variables and readable text contrast.
- Do keep controls at least 48px high and retain visible keyboard focus.
- Do wrap actions and simplify columns on small screens.
- Do hide decorative imagery in quiet and low-sensory modes.

### Don't:

- Don’t introduce autoplay motion or pressure through streaks and scores.
- Don’t replace text labels with unexplained icons.
- Don’t treat generated reference copy or sample data as product behavior.
