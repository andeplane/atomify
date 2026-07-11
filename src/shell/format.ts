/** Formatting helpers for the shell. */

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) {
    return "—";
  }
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes;
  let unit = "B";
  for (const next of units) {
    if (value < 1024) {
      break;
    }
    value /= 1024;
    unit = next;
  }
  return `${value >= 100 ? Math.round(value) : value.toFixed(1)} ${unit}`;
}

export function relativeTime(iso: string, now: Date = new Date()): string {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) {
    return "—";
  }
  const seconds = Math.max(0, (now.getTime() - then) / 1000);
  if (seconds < 45) {
    return "just now";
  }
  const minutes = seconds / 60;
  if (minutes < 60) {
    return `${Math.round(minutes)} min ago`;
  }
  const hours = minutes / 60;
  if (hours < 24) {
    const h = Math.round(hours);
    return `${h} h ago`;
  }
  const days = hours / 24;
  if (days < 2) {
    return "Yesterday";
  }
  if (days < 7) {
    return `${Math.round(days)} days ago`;
  }
  const weeks = days / 7;
  if (weeks < 5) {
    return weeks < 2 ? "Last week" : `${Math.round(weeks)} weeks ago`;
  }
  return new Date(iso).toLocaleDateString();
}

/** "run-005" -> "005"; external run dirs pass through unchanged. */
export function runNumber(runId: string): string {
  const match = /^run-(\d+)$/.exec(runId);
  return match ? match[1] : runId;
}

export function formatDuration(seconds: number | undefined): string {
  if (seconds === undefined || !Number.isFinite(seconds)) {
    return "—";
  }
  if (seconds < 60) {
    return `${Math.round(seconds)} s`;
  }
  const minutes = Math.floor(seconds / 60);
  const rest = Math.round(seconds % 60);
  if (minutes < 60) {
    return `${minutes} min ${rest} s`;
  }
  const hours = Math.floor(minutes / 60);
  return `${hours} h ${minutes % 60} min`;
}

export function greeting(now: Date = new Date()): string {
  const hour = now.getHours();
  if (hour < 5) {
    return "Up late";
  }
  if (hour < 12) {
    return "Good morning";
  }
  if (hour < 18) {
    return "Good afternoon";
  }
  return "Good evening";
}
