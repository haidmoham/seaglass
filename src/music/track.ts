import { SONG } from "./cues";

export interface Track {
  videoId: string;
  title: string;
  artist: string;
  duration: number;
}

export const DEFAULT_TRACK: Track = {
  videoId: SONG.videoId,
  title: SONG.title,
  artist: SONG.artist,
  duration: SONG.duration,
};
