export interface SubtitleCue {
  start: number;
  end: number;
  text: string;
}

function parseTimestamp(ts: string): number {
  const cleaned = ts.trim().replace(",", ".");
  const segments = cleaned.split(":");

  if (segments.length === 3) {
    const [h, m, rest] = segments;
    const [s, ms = "0"] = rest.split(".");
    return (
      parseInt(h, 10) * 3600 +
      parseInt(m, 10) * 60 +
      parseInt(s, 10) +
      parseInt(ms.padEnd(3, "0").slice(0, 3), 10) / 1000
    );
  }

  if (segments.length === 2) {
    const [m, rest] = segments;
    const [s, ms = "0"] = rest.split(".");
    return (
      parseInt(m, 10) * 60 +
      parseInt(s, 10) +
      parseInt(ms.padEnd(3, "0").slice(0, 3), 10) / 1000
    );
  }

  return 0;
}

/** Parse WebVTT (or converted SRT) into a list of cues */
export function parseVtt(content: string): SubtitleCue[] {
  const normalized = content.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];

  const blocks = normalized.split(/\n\n+/);
  const cues: SubtitleCue[] = [];

  for (const block of blocks) {
    const lines = block.trim().split("\n");
    if (lines.length < 2) continue;
    if (lines[0].startsWith("WEBVTT") || lines[0].startsWith("NOTE")) continue;

    const timeLineIndex = lines.findIndex((line) => line.includes("-->"));
    if (timeLineIndex === -1) continue;

    const [startRaw, endRaw] = lines[timeLineIndex].split("-->");
    const text = lines
      .slice(timeLineIndex + 1)
      .join("\n")
      .replace(/<[^>]+>/g, "")
      .trim();

    if (!text) continue;

    cues.push({
      start: parseTimestamp(startRaw),
      end: parseTimestamp(endRaw),
      text,
    });
  }

  return cues;
}

export function getActiveCue(
  cues: SubtitleCue[],
  currentTime: number
): SubtitleCue | null {
  return (
    cues.find((cue) => currentTime >= cue.start && currentTime < cue.end) ?? null
  );
}
