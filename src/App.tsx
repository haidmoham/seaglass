import { useEffect, useRef, useState } from "react";
import { ExhibitControls } from "./components/ExhibitControls";
import { PlayerDock } from "./components/PlayerDock";
import { WeatherInferencePanel } from "./components/WeatherInferencePanel";
import { BackgroundArtwork } from "./components/BackgroundArtwork";
import { SongSearch } from "./components/SongSearch";
import { LiveWeatherControl } from "./components/LiveWeatherControl";
import { DEFAULT_TRACK, type Track } from "./music/track";
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
  duration: DEFAULT_TRACK.duration,
  playing: false,
  ready: false,
  message: "loading",
};

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playerMountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<StormSceneController | null>(null);
  const playerRef = useRef<SongPlayer | null>(null);
  const [track, setTrack] = useState(DEFAULT_TRACK);
  const [immersive, setImmersive] = useState(false);
  const [playback, setPlayback] = useState(initialPlayback);
  const [motion, setMotion] = useState(true);
  const [intensity, setIntensity] = useState(1);
  const [weather, setWeather] = useState<WeatherMode>("storm");
  const [liveEnabled, setLiveEnabled] = useState(false);
  const [inferenceOpen, setInferenceOpen] = useState(false);
  const [sceneError, setSceneError] = useState(false);
  const [seekVersion, setSeekVersion] = useState(0);

  useEffect(() => {
    if (!canvasRef.current) return;
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
    if (!playerMountRef.current) return;
    const mount = document.createElement("div");
    playerMountRef.current.append(mount);
    playerRef.current = connectYouTube(mount, setPlayback);
    return () => {
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, []);
  useEffect(() => sceneRef.current?.setMotion(motion), [motion]);
  useEffect(
    () => sceneRef.current?.setPlayback(playback.time, playback.playing),
    [playback.time, playback.playing],
  );
  useEffect(() => sceneRef.current?.setIntensity(intensity), [intensity]);
  useEffect(() => sceneRef.current?.setImmersive(immersive), [immersive]);
  useEffect(() => sceneRef.current?.setWeather(weather), [weather]);
  useEffect(() => {
    function close(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setImmersive(false);
      setInferenceOpen(false);
    }
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);

  function chooseWeather(mode: WeatherMode) {
    setLiveEnabled(false);
    setWeather(mode);
  }
  function selectTrack(next: Track) {
    setTrack(next);
    playerRef.current?.load(next);
  }
  function hitPlay() {
    playerRef.current?.play();
    setImmersive(true);
  }
  function togglePlayback() {
    if (playback.playing) playerRef.current?.pause();
    else playerRef.current?.play();
  }

  return (
    <main
      className={`exhibit${immersive ? " is-inside" : ""}${motion ? "" : " is-frozen"}`}
    >
      <div className="entrance-pigment" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      {!immersive && (
        <BackgroundArtwork
          motion={motion}
          time={playback.time}
          playing={playback.playing}
        />
      )}
      <div className="museum-grain" aria-hidden="true" />
      <header className="museum-header">
        <button
          className="text-button"
          aria-label="Back to search"
          onClick={() => setImmersive(false)}
        >
          ↖
        </button>
        <button className="text-button" onClick={() => setInferenceOpen(true)}>
          audio file
        </button>
      </header>
      {!immersive && (
        <section id="gallery" className="intro" aria-label="Play a song">
          <h1>
            <button
              className="hit-play"
              onClick={hitPlay}
              disabled={!playback.ready}
            >
              just hit
              <br />
              <span>play</span>
              <span className="play-arrow" aria-hidden="true">
                ↗
              </span>
            </button>
          </h1>
          <SongSearch onSelect={selectTrack} />
        </section>
      )}
      <section className="artwork-position" aria-label="Weather artwork">
        <div className="artwork-frame">
          <div className="frame-inner">
            <canvas
              ref={canvasRef}
              className="storm-canvas"
              tabIndex={0}
              aria-label="Drag to orbit. Arrow keys move the camera."
            />
            {sceneError && (
              <div className="scene-error">
                3D couldn’t start. Try another browser.
              </div>
            )}
            <div className="artwork-vignette" aria-hidden="true" />
            {!immersive && (
              <button
                className="frame-enter"
                aria-label="Enter weather"
                onClick={hitPlay}
              >
                ↗
              </button>
            )}
          </div>
        </div>
      </section>
      <ExhibitControls
        intensity={intensity}
        motion={motion}
        weather={weather}
        onIntensityChange={setIntensity}
        onMotionChange={setMotion}
        onResetView={() => sceneRef.current?.resetCamera()}
        onWeatherChange={chooseWeather}
      />
      <LiveWeatherControl
        playing={playback.playing}
        trackId={`${track.videoId}:${seekVersion}`}
        enabled={liveEnabled}
        onEnabledChange={setLiveEnabled}
        onWeather={setWeather}
      />
      <PlayerDock
        mountRef={playerMountRef}
        playback={playback}
        track={track}
        chapterName=""
        onSeek={(time) => {
          playerRef.current?.seek(time);
          setSeekVersion((value) => value + 1);
        }}
        onShowNotes={() => setInferenceOpen(true)}
        onTogglePlayback={togglePlayback}
      />
      {inferenceOpen && (
        <WeatherInferencePanel
          onClose={() => setInferenceOpen(false)}
          onApply={(mode) => {
            chooseWeather(mode);
            setInferenceOpen(false);
          }}
        />
      )}
    </main>
  );
}
