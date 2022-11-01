import mixpanel, {Dict} from 'mixpanel-browser';
import { v4 as uuidv4 } from 'uuid'
let userId: string|null = null
export const track = (event_name: string, properties?: Dict) => {
  if (userId == null) {
    userId = localStorage.getItem('userId')
    if (userId == null) {
      userId = uuidv4()
      localStorage.setItem('userId', userId)
    }
  }
  
  if (location.hostname === "localhost" || location.hostname === "127.0.0.1") { //eslint-disable-line no-restricted-globals
    console.log("Tracking ", event_name, properties)
    return
  }

  mixpanel.track(event_name, {...properties, distinct_id: userId})
}
export const time_event = (event_name: string) => {
  // @ts-ignore
  if (location.hostname === "localhost" || location.hostname === "127.0.0.1") { //eslint-disable-line no-restricted-globals
    return
  }
  
  mixpanel.time_event(event_name)
}
