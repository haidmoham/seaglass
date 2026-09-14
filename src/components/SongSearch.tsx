import { useRef, useState, type FormEvent } from "react";
import type { Track } from "../music/track";

interface SongSearchProps {
  onSelect(track: Track): void;
}

export function SongSearch({ onSelect }: SongSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Track[]>([]);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const request = useRef(0);

  async function search(event: FormEvent) {
    event.preventDefault();
    const id = ++request.current;
    if (!query.trim()) return;
    setBusy(true);
    setStatus("finding songs…");
    setResults([]);
    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(query.trim())}`,
        { signal: AbortSignal.timeout(12000) },
      );
      if (!response.ok) throw new Error("Search is unavailable. Try again.");
      const data: { tracks: Track[] } = await response.json();
      if (id !== request.current) return;
      setResults(data.tracks);
      setStatus(data.tracks.length ? "" : "nothing yet. try another search.");
    } catch {
      if (id === request.current)
        setStatus("search didn’t connect. try again.");
    } finally {
      if (id === request.current) setBusy(false);
    }
  }

  return (
    <section className="song-search" aria-label="Find a song">
      <form onSubmit={search}>
        <input
          aria-label="Search YouTube"
          placeholder="find a song"
          value={query}
          maxLength={120}
          onChange={(event) => setQuery(event.target.value)}
        />
        <button
          type="submit"
          disabled={busy || !query.trim()}
          aria-label="Search"
        >
          ↗
        </button>
      </form>
      <p role="status">{status}</p>
      {results.length > 0 && (
        <div className="song-results">
          {results.map((track) => (
            <button
              type="button"
              key={track.videoId}
              onClick={() => {
                onSelect(track);
                setResults([]);
                setStatus("");
              }}
            >
              <img
                src={`https://i.ytimg.com/vi/${track.videoId}/mqdefault.jpg`}
                alt=""
                loading="lazy"
              />
              <span>
                <strong>{track.title}</strong>
                <small>{track.artist}</small>
              </span>
              <span aria-hidden="true">↗</span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
