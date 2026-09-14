import { DEFAULT_TRACK, type Track } from "./track";

export interface Playback {
  time: number;
  duration: number;
  playing: boolean;
  ready: boolean;
  message: string;
}

export interface SongPlayer {
  play(): void;
  pause(): void;
  seek(time: number): void;
  load(track: Track): void;
  destroy(): void;
}

const API_LOAD_TIMEOUT_MS = 10_000;
const PLAYER_READY_TIMEOUT_MS = 8_000;
const RETRY_DELAY_MS = 600;

let apiPromise: Promise<void> | undefined;

function loadApi(): Promise<void> {
  if (window.YT?.Player) return Promise.resolve();
  if (apiPromise) return apiPromise;

  const pending = new Promise<void>((resolve, reject) => {
    let script: HTMLScriptElement | undefined;
    const fail = (message: string) => {
      window.clearTimeout(timeout);
      script?.remove();
      reject(new Error(message));
    };
    const timeout = window.setTimeout(
      () => fail("YouTube API load timed out."),
      API_LOAD_TIMEOUT_MS,
    );
    const priorReadyCallback = window.onYouTubeIframeAPIReady;

    window.onYouTubeIframeAPIReady = () => {
      window.clearTimeout(timeout);
      priorReadyCallback?.();
      resolve();
    };

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src="https://www.youtube.com/iframe_api"]',
    );
    if (existingScript) {
      script = existingScript;
      existingScript.addEventListener(
        "error",
        () => fail("YouTube API could not connect."),
        { once: true },
      );
      return;
    }

    script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.onerror = () => fail("YouTube API could not connect.");
    document.head.append(script);
  });

  apiPromise = pending.catch((error: Error) => {
    apiPromise = undefined;
    throw error;
  });
  return apiPromise;
}

function createPlayerFrame(track: Track): HTMLIFrameElement {
  const source = new URL(
    `https://www.youtube-nocookie.com/embed/${track.videoId}`,
  );
  source.searchParams.set("enablejsapi", "1");
  source.searchParams.set("origin", window.location.origin);
  source.searchParams.set("playsinline", "1");
  source.searchParams.set("rel", "0");

  const frame = document.createElement("iframe");
  frame.title = "YouTube video player";
  frame.width = "100%";
  frame.height = "100%";
  frame.referrerPolicy = "strict-origin-when-cross-origin";
  frame.allow =
    "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
  frame.allowFullscreen = true;
  frame.style.display = "block";
  frame.style.width = "100%";
  frame.style.height = "100%";
  frame.src = source.toString();
  return frame;
}

export function connectYouTube(
  mount: HTMLElement,
  onUpdate: (playback: Playback) => void,
  track: Track = DEFAULT_TRACK,
): SongPlayer {
  mount.style.width = "100%";
  mount.style.height = "100%";

  let player: YT.Player | undefined;
  let destroyed = false;
  let ready = false;
  let message = "Connecting to YouTube…";
  let interval = 0;
  let readyDeadline = 0;
  let retryTimer = 0;
  let attempt = 0;
  let activeTrack = track;
  let pendingTrack: Track | undefined;

  function publish() {
    onUpdate({
      time: ready ? (player?.getCurrentTime() ?? 0) : 0,
      duration: ready
        ? player?.getDuration() || activeTrack.duration
        : activeTrack.duration,
      playing: ready && player?.getPlayerState() === YT.PlayerState.PLAYING,
      ready,
      message,
    });
  }

  function disposeAttempt() {
    window.clearTimeout(readyDeadline);
    player?.destroy();
    player = undefined;
    ready = false;
    mount.replaceChildren();
  }

  function startAttempt() {
    if (destroyed) return;
    attempt += 1;
    const attemptId = attempt;
    const frame = createPlayerFrame(activeTrack);
    mount.replaceChildren(frame);

    player = new YT.Player(frame, {
      host: "https://www.youtube-nocookie.com",
      events: {
        onReady: () => {
          if (destroyed || attemptId !== attempt) return;
          window.clearTimeout(readyDeadline);
          ready = true;
          if (pendingTrack) {
            player?.cueVideoById(pendingTrack.videoId);
            pendingTrack = undefined;
          }
          message = "Ready to listen";
          publish();
        },
        onStateChange: (event) => {
          if (destroyed || attemptId !== attempt) return;
          message =
            event.data === YT.PlayerState.PLAYING
              ? "Playing from YouTube"
              : event.data === YT.PlayerState.BUFFERING
                ? "Buffering on YouTube…"
                : event.data === YT.PlayerState.ENDED
                  ? "The song has ended"
                  : "Paused";
          publish();
        },
        onError: () => {
          if (destroyed || attemptId !== attempt) return;
          window.clearTimeout(readyDeadline);
          ready = false;
          message =
            "YouTube playback is unavailable here. Open the song on YouTube.";
          publish();
        },
      },
    });

    readyDeadline = window.setTimeout(() => {
      if (destroyed || ready || attemptId !== attempt) return;
      if (attempt === 1) {
        message = "YouTube did not respond. Retrying…";
        publish();
        disposeAttempt();
        retryTimer = window.setTimeout(startAttempt, RETRY_DELAY_MS);
        return;
      }
      message = "YouTube could not load here. Open the song on YouTube.";
      publish();
    }, PLAYER_READY_TIMEOUT_MS);
  }

  void loadApi()
    .then(() => {
      if (destroyed) return;
      startAttempt();
      interval = window.setInterval(publish, 120);
    })
    .catch(() => {
      if (destroyed) return;
      message = "YouTube could not connect. Open the song on YouTube.";
      publish();
    });

  return {
    play() {
      if (ready) player?.playVideo();
    },
    pause() {
      if (ready) player?.pauseVideo();
    },
    seek(time) {
      if (ready) player?.seekTo(time, true);
    },
    load(nextTrack) {
      activeTrack = nextTrack;
      pendingTrack = nextTrack;
      message = "Loading from YouTube…";
      onUpdate({
        time: 0,
        duration: nextTrack.duration,
        playing: false,
        ready,
        message,
      });
      if (ready) {
        player?.cueVideoById(nextTrack.videoId);
        pendingTrack = undefined;
      }
    },
    destroy() {
      destroyed = true;
      window.clearInterval(interval);
      window.clearTimeout(retryTimer);
      disposeAttempt();
    },
  };
}
