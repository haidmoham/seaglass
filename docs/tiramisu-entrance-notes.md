# Tiramisu entrance study for Sea Glass

## Inspection boundary

The live page at `https://tiramisu.shin86.dev/` was inspected in the Codex browser.
The rendered landing confirmed the pigment field, teal title plaque, thin border,
and typography described below. Pointer response and navigation transitions were
not directly tested. The Sea Glass blob motion is an original adaptation, not a
claim to reproduce Tiramisu's internal behavior.

No Tiramisu repository or implementation source was inspected.

## Observed visual system

### One organic field behind one rigid frame

The page gives most of the viewport to an oversized, soft-edged pigment field. Hot pink, orange, dusty mauve, and teal masses meet through broad blurred transitions. The forms continue past the viewport edges. They read as one cropped material rather than a set of circles.

A dark teal content surface sits in front of that field. It uses hard rectangular edges and a thin coral-to-cyan top rule. The stable frame makes the soft field feel more alive.

### Title as an object

The large lowercase wordmark sits inside its own solid dark plaque. The plaque overlaps the pigment field above the main content frame. The title therefore acts as a spatial object and entrance marker, not only a heading.

### Typography and controls

The system uses three distinct voices:

- very large heavy sans serif for identity;
- high-contrast serif for the content invitation;
- small monospace for navigation, modes, counts, and controls.

Controls use thin rules, square cells, and small coral accents. They stay visually attached to the rigid content frame. The organic background does not distort the text or form controls.

### Entry sequence visible in the landing composition

The eye moves through four layers:

1. narrow cluster navigation;
2. the floating title plaque;
3. a compact mode control aligned with the title field;
4. the framed task surface below.

This is a spatial entrance rather than a full-screen splash. The next action is already visible inside the world.

### Phone observation

At the captured 390-pixel viewport, the same wide composition remained cropped horizontally instead of fully reflowing. The title and mode controls extended beyond the right edge. The content frame and list remained legible in the visible area, but this crop should not be copied into Sea Glass.

## Sea Glass adaptation

### Keep the blob inside the museum frame

Use one low-resolution procedural pigment field behind the storm, ocean, and glass. Crop its masses beyond the artwork edges. Restrict its palette to the existing exhibit materials: deep teal, sea green, storm mauve, porcelain, and one restrained coral accent.

The museum page remains rigid. The living field belongs to the artwork. This preserves the current framed-exhibit concept while giving the preview immediate organic presence.

### Make the frame itself the entrance

Keep the same canvas and scene instance between gallery and immersive states.

- Gallery: the field moves slowly behind the framed storm composition.
- Enter: the artwork frame expands to the viewport while its border and caption recede.
- Immersive: the same field becomes atmospheric depth behind clouds and ocean.

Do not replace the preview with a new scene. Continuity is the useful part of the Tiramisu grammar.

### Give “SEA GLASS” a plaque role

Let the existing title overlap or visually anchor to the artwork edge. It may use a compact dark mineral surface rather than Tiramisu’s exact rectangle. The title must remain semantic HTML and must not become a texture inside the canvas.

### Proposed pointer behavior

This behavior was not verified on the live page. It is a Sea Glass adaptation for the requested reactive blob:

- Pointer movement creates local attraction and slight depth parallax.
- Use heavy damping and cap displacement so the mass never chases the cursor.
- Nearby color boundaries may stretch; the whole palette must not rotate or flash.
- Pointer exit returns smoothly to the authored composition.
- Touch drag continues to control the storm camera. The blob should respond to the same normalized pointer without stealing the gesture.
- Reduced motion freezes autonomous drift and keeps direct manipulation at low amplitude.

### Invariants

- The glass silhouette remains the stable focal object.
- Blob color and displacement stay behind the represented weather.
- Text and controls remain rigid and readable.
- Gallery and immersive views use one continuous scene.
- The 200-pixel YouTube player and exhibit controls remain reachable on phones.
- The field uses a deliberate neighboring-color path. It never becomes a rainbow gradient.
- A complete still composition exists when motion is off.

## Smallest useful implementation test

- **Question:** Does one cropped pigment field make the framed preview feel alive and make entry feel continuous?
- **Action:** Add three or four large metaball-like masses behind the current scene. Drive slow drift plus a capped pointer offset. Reuse the same uniforms while the frame expands.
- **Observation:** At rest, the glass reads first. On pointer movement, one nearby boundary bends without moving the title or controls. On entry, no color or geometry jump reveals a scene swap.
- **Review condition:** Keep the unit only if the still frame remains strong, the glass stays dominant, and the phone view shows the full entrance action without horizontal clipping.

## Capture record

- Live host inspected: `https://tiramisu.shin86.dev/`, 2026-09-14.
- Desktop captures at 600 ms and 5 seconds were identical.
- Phone capture showed the wide composition cropped at 390 × 844.
- Screenshots remain outside the project repository.
