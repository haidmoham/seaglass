// A first art-direction pass, not measurements or verified musical sections.
export const SONG = {
  title: "Sea Glass",
  artist: "Driveways",
  album: "Tempest",
  videoId: "s77kCPJC42Y",
  duration: 223,
};

export const chapters = [
  { time: 0, name: "The approach", energy: 0.32, weather: "supercell" },
  { time: 37, name: "Pressure rising", energy: 0.62, weather: "rain" },
  { time: 73, name: "Inside the cell", energy: 0.95, weather: "supercell" },
  { time: 112, name: "A green light", energy: 0.48, weather: "rain" },
  { time: 151, name: "The breaking point", energy: 1, weather: "supercell" },
  { time: 195, name: "After the storm", energy: 0.36, weather: "clearing" },
] as const;

export function chapterAt(time: number) {
  return chapters.findLast((chapter) => time >= chapter.time) ?? chapters[0];
}

export function cueEnergy(time: number) {
  const index = Math.max(
    0,
    chapters.findLastIndex((chapter) => time >= chapter.time),
  );
  const current = chapters[index] ?? chapters[0];
  const next = chapters[index + 1];
  if (!next) return current.energy;
  const transition = Math.max(0, Math.min(1, (time - next.time + 5) / 5));
  return current.energy + (next.energy - current.energy) * transition;
}

export function formatTime(seconds: number) {
  const value = Math.max(0, Math.floor(seconds));
  return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, "0")}`;
}
