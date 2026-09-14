import { chapters, formatTime } from "../music/cues";

interface ExhibitNotesProps {
  playbackReady: boolean;
  onClose(): void;
  onSeek(time: number): void;
}

export function ExhibitNotes(props: ExhibitNotesProps) {
  return (
    <section className="notes-panel" aria-label="Exhibit notes">
      <div className="notes-heading">
        <p className="eyebrow">EXHIBIT 001</p>
        <button
          type="button"
          aria-label="Close exhibit notes"
          onClick={props.onClose}
        >
          ×
        </button>
      </div>
      <h2>
        A song. A place.
        <br />A first experiment.
      </h2>
      <p>
        An imagined supercell surrounds one fragment of sea glass. Enter the
        frame, then drag to find your own view.
      </p>
      <p>
        The storm follows <strong>authored visual cues</strong> synchronized to
        YouTube time. These cues are provisional art direction. They are not
        measured frequencies or verified song sections.
      </p>
      <div className="chapter-list">
        {chapters.map((chapter, index) => (
          <button
            type="button"
            key={chapter.time}
            disabled={!props.playbackReady}
            onClick={() => props.onSeek(chapter.time)}
          >
            <span>{String(index + 1).padStart(2, "0")}</span>
            <span>{chapter.name}</span>
            <span>{formatTime(chapter.time)}</span>
          </button>
        ))}
      </div>
      <p className="notes-credit">
        Music: Driveways, “Sea Glass,” Tempest (2024). Unofficial fan
        experiment. Original procedural artwork. Drag or use arrow keys on the
        artwork. Freeze motion at any time.
      </p>
    </section>
  );
}
