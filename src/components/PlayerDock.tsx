import type { RefObject } from "react";
import { formatTime, SONG } from "../music/cues";
import type { Playback } from "../music/youtube";

interface PlayerDockProps {
  mountRef: RefObject<HTMLDivElement | null>;
  playback: Playback;
  chapterName: string;
  onSeek(time: number): void;
  onShowNotes(): void;
  onTogglePlayback(): void;
}

export function PlayerDock(props: PlayerDockProps) {
  return (
    <>
      <footer className="listening-desk" aria-label="Listening desk">
        <div className="track-line">
          <button
            className="play-button"
            type="button"
            disabled={!props.playback.ready}
            aria-label={
              props.playback.playing ? "Pause Sea Glass" : "Play Sea Glass"
            }
            onClick={props.onTogglePlayback}
          >
            {props.playback.playing ? "Ⅱ" : "▶"}
          </button>
          <div>
            <strong>{SONG.title}</strong>
            <span>
              {SONG.artist} / {SONG.album}
            </span>
          </div>
          <span className="track-time">
            {formatTime(props.playback.time)}{" "}
            <span>/ {formatTime(props.playback.duration)}</span>
          </span>
        </div>
        <input
          className="song-progress"
          type="range"
          aria-label="Song position"
          min="0"
          max={props.playback.duration}
          step="0.1"
          value={props.playback.time}
          disabled={!props.playback.ready}
          onChange={(event) => props.onSeek(Number(event.target.value))}
        />
        <div className="cue-line">
          <span className="live-dot" /> AUTHORED VISUAL CUES{" "}
          <span>/ {props.chapterName}</span>
          <button
            type="button"
            onClick={props.onShowNotes}
            aria-label="About the authored cues"
          >
            ⓘ
          </button>
        </div>
      </footer>
      <aside className="youtube-corner" aria-label="YouTube song player">
        <div className="youtube-label">
          <span>AUDIO FROM YOUTUBE</span>
          <a
            href={`https://www.youtube.com/watch?v=${SONG.videoId}`}
            target="_blank"
            rel="noreferrer"
          >
            OPEN ↗
          </a>
        </div>
        <div className="youtube-mount" ref={props.mountRef} />
        <p className="player-status" role="status">
          {props.playback.message}
        </p>
      </aside>
    </>
  );
}
