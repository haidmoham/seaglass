import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type RefObject,
} from "react";
import { formatTime } from "../music/cues";
import type { Track } from "../music/track";
import type { Playback } from "../music/youtube";
import "./player-dock.css";

interface DockPosition {
  x: number;
  y: number;
}

interface PlayerDockProps {
  mountRef: RefObject<HTMLDivElement | null>;
  playback: Playback;
  track: Track;
  chapterName: string;
  onSeek(time: number): void;
  onShowNotes(): void;
  onTogglePlayback(): void;
  onVolumeChange(volume: number): void;
  onToggleMute(): void;
}

export function PlayerDock(props: PlayerDockProps) {
  const dockRef = useRef<HTMLElement>(null);
  const dragRef = useRef({ active: false, pointerId: -1, offsetX: 0, offsetY: 0 });
  const [position, setPosition] = useState<DockPosition | null>(null);

  function clampPosition(x: number, y: number): DockPosition {
    const rect = dockRef.current?.getBoundingClientRect();
    const width = rect?.width ?? 200;
    const height = rect?.height ?? 240;
    return {
      x: Math.max(0, Math.min(x, window.innerWidth - width)),
      y: Math.max(0, Math.min(y, window.innerHeight - height)),
    };
  }

  useEffect(() => {
    function handleResize(): void {
      setPosition((current) =>
        current ? clampPosition(current.x, current.y) : null,
      );
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  function handleDragStart(event: PointerEvent<HTMLDivElement>): void {
    if (event.button !== 0) return;
    if (
      event.target instanceof Element &&
      event.target.closest("a, .youtube-position-reset")
    ) return;
    const rect = dockRef.current?.getBoundingClientRect();
    if (!rect) return;
    dragRef.current = {
      active: true,
      pointerId: event.pointerId,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
  }

  function handleDragMove(event: PointerEvent<HTMLDivElement>): void {
    const drag = dragRef.current;
    if (!drag.active || drag.pointerId !== event.pointerId) return;
    setPosition(
      clampPosition(event.clientX - drag.offsetX, event.clientY - drag.offsetY),
    );
  }

  function handleDragEnd(event: PointerEvent<HTMLDivElement>): void {
    if (dragRef.current.pointerId !== event.pointerId) return;
    dragRef.current.active = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function handleNudge(event: KeyboardEvent<HTMLButtonElement>): void {
    let direction: DockPosition;
    if (event.key === "ArrowLeft") direction = { x: -12, y: 0 };
    else if (event.key === "ArrowRight") direction = { x: 12, y: 0 };
    else if (event.key === "ArrowUp") direction = { x: 0, y: -12 };
    else if (event.key === "ArrowDown") direction = { x: 0, y: 12 };
    else return;
    const rect = dockRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPosition((current) =>
      clampPosition(
        (current?.x ?? rect.left) + direction.x,
        (current?.y ?? rect.top) + direction.y,
      ),
    );
    event.preventDefault();
  }

  return (
    <>
      <footer className="listening-desk" aria-label="Listening desk">
        <div className="track-line">
          <button
            className="play-button"
            type="button"
            disabled={!props.playback.ready}
            aria-label={props.playback.playing ? "Pause song" : "Play song"}
            onClick={props.onTogglePlayback}
          >
            {props.playback.playing ? "Ⅱ" : "▶"}
          </button>
          <div>
            <strong>{props.track.title}</strong>
            <span>{props.track.artist}</span>
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
      </footer>
      <aside
        ref={dockRef}
        className={`youtube-corner${position ? " is-dragged" : ""}`}
        aria-label="YouTube song player"
        style={position ? { left: position.x, top: position.y, right: "auto", bottom: "auto" } : undefined}
      >
        <div
          className="youtube-label"
          onPointerDown={handleDragStart}
          onPointerMove={handleDragMove}
          onPointerUp={handleDragEnd}
          onPointerCancel={handleDragEnd}
        >
          <button
            className="youtube-drag-handle"
            type="button"
            aria-label="Move player"
            title="Drag or use arrow keys to move player"
            onKeyDown={handleNudge}
          >
            ⠿
          </button>
          <a
            href={`https://www.youtube.com/watch?v=${props.track.videoId}`}
            target="_blank"
            rel="noreferrer"
            aria-label={`Open ${props.track.title} by ${props.track.artist} on YouTube`}
          >
            YouTube ↗
          </a>
          {position ? (
            <button
              className="youtube-position-reset"
              type="button"
              onClick={() => setPosition(null)}
              aria-label="Reset player position"
              title="Reset position"
            >
              ↘
            </button>
          ) : null}
        </div>
        <div className="youtube-mount" ref={props.mountRef} />
        <div className="player-volume">
          <button
            type="button"
            aria-label={props.playback.muted ? "Unmute" : "Mute"}
            aria-pressed={props.playback.muted}
            disabled={!props.playback.ready}
            onClick={props.onToggleMute}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M11 5 6 9H3v6h3l5 4Z" />
              {props.playback.muted
                ? <path d="m16 9 6 6m0-6-6 6" />
                : <path d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14" />}
            </svg>
          </button>
          <input
            type="range"
            aria-label="Volume"
            aria-valuetext={props.playback.muted ? "Muted" : `${props.playback.volume}%`}
            min="0" max="100" step="1"
            value={props.playback.muted ? 0 : props.playback.volume}
            disabled={!props.playback.ready}
            onChange={(event) => props.onVolumeChange(Number(event.target.value))}
          />
          <output>{props.playback.muted ? 0 : props.playback.volume}</output>
        </div>
        <p className="player-status" role="status">
          {!props.playback.ready
            ? "loading"
            : props.playback.playing
              ? "playing"
              : "paused"}
        </p>
      </aside>
    </>
  );
}
