import mixpanel, { type Dict } from "mixpanel-browser";
import { v4 as uuidv4 } from "uuid";

let userId: string | null = null;

export function getEmbeddingParams() {
  const urlParams = new URLSearchParams(window.location.search);
  const embeddedSimulationUrl = urlParams.get("embeddedSimulationUrl");
  const embeddedData = urlParams.get("data");
  const embedFullscreen = urlParams.get("embed") === "true";
  const embedAutoStart = urlParams.get("autostart") === "true";
  const embedMode = embeddedSimulationUrl ? "url" : embeddedData ? "data" : false;

  return { embedMode, embedFullscreen, embedAutoStart };
}

export const track = (event_name: string, properties?: Dict) => {
  if (userId == null) {
    userId = localStorage.getItem("userId");
    if (userId == null) {
      userId = uuidv4();
      localStorage.setItem("userId", userId);
    }
  }

  if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
    console.log("Tracking ", event_name, properties);
    return;
  }

  mixpanel.track(event_name, { ...properties, distinct_id: userId });
};
export const time_event = (event_name: string) => {
  if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
    //eslint-disable-line no-restricted-globals
    return;
  }

  mixpanel.time_event(event_name);
};
