import { useEffect, useRef, useState } from "react";

import { ExhibitControls } from "./components/ExhibitControls";
import { ExhibitNotes } from "./components/ExhibitNotes";
import { PlayerDock } from "./components/PlayerDock";
import { chapterAt, cueEnergy, SONG } from "./music/cues";
import {
  connectYouTube,
  type Playback,
  type SongPlayer,
} from "./music/youtube";
import {
  createStormScene,
  type StormSceneController,
} from "./scene/storm-scene";
import type { WeatherMode } from "./weather/modes";

const initialPlayback: Playback = {
  time: 0,
  duration: SONG.duration,
  playing: false,
  ready: false,
  message: "Connecting to YouTube…",
};

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playerMountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<StormSceneController | null>(null);
  const playerRef = useRef<SongPlayer | null>(null);
  const [immersive, setImmersive] = useState(false);
  const [playback, setPlayback] = useState(initialPlayback);
  const [motion, setMotion] = useState(true);
  const [intensity, setIntensity] = useState(1);
  const [weather, setWeather] = useState<WeatherMode>("supercell");
  const [followScore, setFollowScore] = useState(true);
  const [notesOpen, setNotesOpen] = useState(false);
  const [sceneError, setSceneError] = useState(false);
  const currentChapter = chapterAt(playback.time);
  const effectiveWeather = followScore ? currentChapter.weather : weather;

  useEffect(() => {
    if (canvasRef.current === null) return;
    try {
      sceneRef.current = createStormScene(canvasRef.current);
    } catch {
      setSceneError(true);
    }
    return () => {
      sceneRef.current?.dispose();
      sceneRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (playerMountRef.current === null) return;
    const mount = document.createElement("div");
    playerMountRef.current.append(mount);
    playerRef.current = connectYouTube(mount, setPlayback);
    return () => {
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, []);

  useEffect(() => sceneRef.current?.setMotion(motion), [motion]);
  useEffect(() => sceneRef.current?.setIntensity(intensity), [intensity]);
  useEffect(
    () => sceneRef.current?.setEnergy(cueEnergy(playback.time)),
    [playback.time],
  );
  useEffect(() => sceneRef.current?.setImmersive(immersive), [immersive]);
  useEffect(
    () => sceneRef.current?.setWeather(effectiveWeather),
    [effectiveWeather],
  );

  useEffect(() => {
    function closeOverlay(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setImmersive(false);
      setNotesOpen(false);
    }
    window.addEventListener("keydown", closeOverlay);
    return () => window.removeEventListener("keydown", closeOverlay);
  }, []);

  function togglePlayback() {
    if (playback.playing) playerRef.current?.pause();
    else playerRef.current?.play();
  }

  function chooseWeather(mode: WeatherMode) {
    setFollowScore(false);
    setWeather(mode);
  }

  function previewCrescendo() {
    chooseWeather("clearing");
    setImmersive(true);
  }

  return (
    <main className={immersive ? "exhibit is-inside" : "exhibit"}>
      <div className="museum-grain" aria-hidden="true" />
      <header className="museum-header">
        <a
          className="museum-wordmark"
          href="#gallery"
          onClick={() => setImmersive(false)}
          aria-label="Return to the gallery"
        >
          <span className="museum-symbol" aria-hidden="true">
            ◈
          </span>
          <span>
            AFTERIMAGE
            <span className="wordmark-sub">MUSEUM OF INNER WEATHER</span>
          </span>
        </a>
        <div className="header-center">
          <span className="live-dot" /> A SONG YOU CAN ENTER
        </div>
        <button
          className="text-button exhibit-notes"
          type="button"
          onClick={() => setNotesOpen(!notesOpen)}
          aria-expanded={notesOpen}
        >
          Exhibit notes <span>↗</span>
        </button>
      </header>

      <section id="gallery" className="intro" aria-label="Exhibit introduction">
        <p className="eyebrow">
          COLLECTION 001 <span>/</span> DRIVEWAYS
        </p>
        <h1>
          SEA
          <br />
          <span>GLASS</span>
          <sup>01</sup>
        </h1>
        <p className="intro-copy">
          Some songs stay with you. <br />
          This one is a place.
        </p>
        <div className="intro-rule" />
        <p className="catalog-meta">
          A SUPERCELL. A FRAGMENT. A WAY THROUGH.
          <br />
          TEMPEST, 2024 · 03:43
        </p>
        <button
          className="enter-button"
          type="button"
          onClick={() => setImmersive(true)}
        >
          Enter the storm <span aria-hidden="true">↗</span>
        </button>
        <p className="entry-hint">DRAG TO LOOK AROUND · HEADPHONES ON</p>
      </section>

      <section
        className="artwork-position"
        aria-label="Sea Glass storm artwork"
      >
        <div className="frame-shadow" />
        <div className="artwork-frame">
          <div className="frame-inner">
            <canvas
              ref={canvasRef}
              className="storm-canvas"
              tabIndex={0}
              aria-label="Three-dimensional storm. Drag to orbit. Arrow keys move the camera."
            />
            {sceneError && (
              <div className="scene-error">
                This browser could not start the 3D exhibit. Try a browser with
                WebGL enabled.
              </div>
            )}
            <div className="artwork-vignette" aria-hidden="true" />
            <span className="artwork-mark" aria-hidden="true">
              SG—001
              <br />
              ATMOSPHERIC STUDY
            </span>
            {!immersive && (
              <button
                className="frame-enter"
                type="button"
                aria-label="Enter the three-dimensional storm"
                onClick={() => setImmersive(true)}
              >
                ↗
              </button>
            )}
            {immersive && effectiveWeather === "clearing" && (
              <div
                className="clearing-verse"
                aria-label="Your Light visual cue"
              >
                <span>YOUR LIGHT</span>
                <p>sky blue · porcelain</p>
              </div>
            )}
          </div>
        </div>
        <div className="artwork-caption">
          <span>01 / SEA GLASS</span>
          <span>AN IMPOSSIBLE WEATHER SYSTEM</span>
          <span>↖ DRAG THE ARTWORK</span>
        </div>
      </section>

      {immersive && (
        <div className="inside-label">
          <p className="eyebrow">YOU ARE INSIDE</p>
          <h2>Sea Glass</h2>
          <p>
            Driveways <span>—</span> {currentChapter.name}
          </p>
          <button
            className="back-button"
            type="button"
            onClick={() => setImmersive(false)}
          >
            ↙ Return to gallery
          </button>
        </div>
      )}

      <ExhibitControls
        intensity={intensity}
        followScore={followScore}
        motion={motion}
        weather={effectiveWeather}
        onFollowScoreChange={setFollowScore}
        onIntensityChange={setIntensity}
        onMotionChange={setMotion}
        onPreviewCrescendo={previewCrescendo}
        onResetView={() => sceneRef.current?.resetCamera()}
        onWeatherChange={chooseWeather}
      />
      <PlayerDock
        mountRef={playerMountRef}
        playback={playback}
        chapterName={currentChapter.name}
        onSeek={(time) => playerRef.current?.seek(time)}
        onShowNotes={() => setNotesOpen(true)}
        onTogglePlayback={togglePlayback}
      />
      {notesOpen && (
        <ExhibitNotes
          playbackReady={playback.ready}
          onClose={() => setNotesOpen(false)}
          onSeek={(time) => playerRef.current?.seek(time)}
        />
      )}
    </main>
  );
}
