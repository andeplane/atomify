/** Remembers that the onboarding tour has been offered, so it auto-starts
 *  only on a user's first visit. Replays go through "Take the tour". */

export const TOUR_SEEN_KEY = "atomify.tour.seen.v1";

export function markTourSeen(): void {
  try {
    localStorage.setItem(TOUR_SEEN_KEY, "1");
  } catch {
    // storage unavailable: the tour may auto-start again next visit
  }
}

export function shouldAutoStartTour(): boolean {
  // Never in automated browsers (e2e) or unit tests: the spotlight blocks
  // clicks everywhere else on the page.
  if (typeof navigator !== "undefined" && navigator.webdriver) {
    return false;
  }
  if (import.meta.env.MODE === "test") {
    return false;
  }
  try {
    return localStorage.getItem(TOUR_SEEN_KEY) === null;
  } catch {
    return false;
  }
}
