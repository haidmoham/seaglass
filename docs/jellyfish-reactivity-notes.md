# Jellyfish reactivity candidates for Sea Glass

This note records a targeted LEGO search for music-driven motion. It is private project design guidance, not public exhibit copy.

## Evidence boundary

- **Observed in canonical documentation:** Voidpulse Jellyfish measures audio samples and maps energy and bass to bounded body deformation. Smoothed attacks drive a spring that preserves velocity. A delayed envelope drives a secondary reach. Constant bass does not retrigger an attack. Material brightness and bloom remain steady.
- **Observed in the private design library:** no earned component currently matches this job. The useful records below are candidates. They have evidence from prior artifacts, but the library has not promoted them to `components/`.
- **Verified live availability:** `https://jellyfish.mhaider.dev/` returned HTTP 200 with the title “voidpulse — go on. stare.” A browser surface was unavailable, so rendered motion was not visually reviewed in this pass.
- **Sea Glass constraint:** the embedded YouTube player exposes playback state and time, not audio samples. Frequency-specific reactions require a separately supplied recording or browser-tab audio. Until that source exists, authored cue energy may preview the motion grammar but must remain labeled as authored.

## Candidate 1: stable glass, living caustic

**Job:** Make the sea-glass fragment feel responsive without weakening its identity as the exhibit's visual anchor.

**Composition:** Keep the glass silhouette and main refraction stable. Add a separate low-mass caustic or mist shell around it. Feed slow energy into shell width and flow. Feed bounded attacks into one brief contraction and recovery.

**Adaptation points:** shell radius, teal-to-porcelain palette path, recovery duration, and the ratio between energy drift and attack displacement.

**Invariants:**

- The core silhouette stays readable at rest and at peak response.
- Light intensity does not pulse with every attack.
- Motion changes geometry or flow, not the meaning of the material.
- Reduced-motion mode preserves the stable core and freezes decorative drift.

**Source transformation:** This combines the library candidate “stable core, living aura” with Jellyfish's documented steady-light boundary. Sea Glass replaces a biological mantle and nucleus with a mineral core and a refractive atmosphere.

## Candidate 2: local bass impact, delayed ocean answer

**Job:** Give low-frequency events weight and scale without making the whole storm pump.

**Composition:** A detected bass attack first compresses the water and foam in a small radius around the glass. A delayed, broader wave then travels outward across the ocean. Preserve position and velocity when a new attack arrives so closely spaced events bend the current response instead of restarting it.

**Adaptation points:** impact radius, spring damping, delay, wave width, foam gain, and maximum displacement. A useful first tuning surface is damping plus delay beside a replayable attack envelope.

**Invariants:**

- A sustained bass level does not repeatedly trigger impacts.
- Displacement and foam gain stay bounded.
- The ocean keeps a complete resting motion when no signal is present.
- Camera motion, material brightness, and global exposure do not follow the attack.
- The delayed wave reads as a consequence of the local impact.

**Source transformation:** Jellyfish's documented attack spring and delayed tentacle reach become a local water impact and a delayed ocean response. The library candidate “locality buys amplitude” supplies the hierarchy: a strong effect is acceptable because its location and lifetime communicate cause.

## Candidate 3: storm-front carrier and bounded deposit

**Job:** Let treble or upper-band energy animate the storm without adding unrelated particles everywhere.

**Composition:** Give one moving rain front or debris ribbon ownership of the active color. When it crosses the glass or wave crest, it leaves a short porcelain-green wake that fades on a fixed schedule. The carrier moves continuously; only a measured onset or authored event transfers its state.

**Adaptation points:** carrier width, diagonal angle, wake length, fade duration, and whether the deposit appears on foam, cloud edge, or glass caustic. Use one receiving surface in the first trial.

**Invariants:**

- One carrier owns the active state.
- Passive surfaces return to a neutral palette.
- Deposits decay and cannot accumulate into permanent clutter.
- Color follows a deliberate neighboring-pigment path. It does not cycle through arbitrary hues.
- Passive travel does not simulate repeated contact.

**Source transformation:** This composes the library candidates “pigment carrier, localized deposit” and “ordered pigment drift.” The carrier changes from a drawing pin to weather motion; the bounded record changes from a curve trace to a wake in the represented environment.

## Recommended first experiment

Test **local bass impact, delayed ocean answer** first. It has the clearest causal reading and the smallest overlap with the existing weather modes.

- **Question:** Can one local impact plus one delayed wave make the crescendo feel physical while the glass and lighting remain stable?
- **Smallest useful action:** Add a development-only attack control with damping and delay. Drive the same input boundary that a future measured bass onset would use.
- **Observable result:** A single trigger produces one bounded compression near the glass and one outward wave. A held input produces no new impacts.
- **Review condition:** Keep the unit only if the cause remains legible at normal and reduced intensity, the glass stays readable, and pause preserves the current pose. Remove the delayed layer if it reads as a second unrelated effect.

## Provenance

- Private design vocabulary: `haidmoham/design-vocabulary` at `993c77d`.
- Rendered-behavior source documentation: `haidmoham/voidpulse-jellyfish` at `f9b863a`.
- Consulted library records: LEGO contract, component index, designing-through-feedback collection, stable core/living aura, locality buys amplitude, ordered pigment drift, pigment carrier/localized deposit, and live controls as a thinking surface.
- No private library text or Jellyfish implementation code is copied into the Sea Glass application.
