import { useEffect, useRef, useState } from "react";

import {
  startLiveWeather,
  type LiveWeatherController,
  type LiveWeatherUpdate,
} from "../audio/live-weather";
import type { WeatherMode } from "../weather/modes";

interface LiveWeatherControlProps {
  playing: boolean;
  trackId: string;
  enabled: boolean;
  onEnabledChange(value: boolean): void;
  onWeather(mode: WeatherMode): void;
  onReaction?(update: LiveWeatherUpdate): void;
}

type ControlMessage =
  | "pick this tab. share audio."
  | "listening"
  | "no audio yet"
  | "paused"
  | "tab audio needs a supported desktop browser."
  | "share this tab with audio."
  | "sharing canceled."
  | null;

export function LiveWeatherControl(props: LiveWeatherControlProps) {
  const controller = useRef<LiveWeatherController | null>(null);
  const requestId = useRef(0);
  const mounted = useRef(true);
  const enabled = useRef(props.enabled);
  const playing = useRef(props.playing);
  const onWeather = useRef(props.onWeather);
  const onReaction = useRef(props.onReaction);
  const [sharing, setSharing] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [message, setMessage] = useState<ControlMessage>(null);

  enabled.current = props.enabled;
  playing.current = props.playing;
  onWeather.current = props.onWeather;
  onReaction.current = props.onReaction;

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      requestId.current += 1;
      controller.current?.stop();
      controller.current = null;
    };
  }, []);

  useEffect(() => {
    controller.current?.setPlaying(props.enabled && props.playing);
    if (sharing && props.enabled && !props.playing) setMessage("paused");
  }, [props.enabled, props.playing, sharing]);

  useEffect(() => {
    controller.current?.reset();
  }, [props.trackId]);

  function receiveUpdate(update: LiveWeatherUpdate) {
    if (!mounted.current) return;
    onReaction.current?.(update);

    if (update.status === "stopped") {
      controller.current = null;
      setSharing(false);
      setMessage(null);
      return;
    }

    if (!playing.current || !enabled.current) setMessage("paused");
    else if (update.status === "quiet") setMessage("no audio yet");
    else setMessage("listening");

    if (update.mode && enabled.current && playing.current) {
      onWeather.current(update.mode);
    }
  }

  async function beginSharing() {
    const activeRequest = requestId.current + 1;
    requestId.current = activeRequest;
    setRequesting(true);
    setMessage("pick this tab. share audio.");

    try {
      const nextController = await startLiveWeather(receiveUpdate);
      if (!mounted.current || requestId.current !== activeRequest) {
        nextController.stop();
        return;
      }
      controller.current = nextController;
      nextController.setPlaying(props.playing);
      setSharing(true);
      setRequesting(false);
      props.onEnabledChange(true);
      setMessage(props.playing ? "listening" : "paused");
    } catch (error) {
      if (!mounted.current || requestId.current !== activeRequest) return;
      setRequesting(false);
      if (error instanceof Error && error.message.includes("not supported")) {
        setMessage("tab audio needs a supported desktop browser.");
      } else if (
        error instanceof Error &&
        error.message.includes("audio enabled")
      ) {
        setMessage("share this tab with audio.");
      } else {
        setMessage("sharing canceled.");
      }
    }
  }

  function toggleEnabled() {
    if (!controller.current) {
      void beginSharing();
      return;
    }
    props.onEnabledChange(!props.enabled);
  }

  function stopSharing() {
    requestId.current += 1;
    controller.current?.stop();
    controller.current = null;
    setSharing(false);
    setRequesting(false);
    setMessage(null);
    props.onEnabledChange(false);
  }

  return (
    <div className="live-weather-controls">
      <div>
        <button
          type="button"
          aria-pressed={sharing ? props.enabled : undefined}
          disabled={requesting}
          onClick={toggleEnabled}
        >
          {sharing ? "auto weather" : "use tab audio"}
        </button>
        {sharing && (
          <button type="button" onClick={stopSharing}>
            stop sharing
          </button>
        )}
      </div>
      {message && <p role="status">{message}</p>}
      <small>desktop tab audio. stays here.</small>
    </div>
  );
}
