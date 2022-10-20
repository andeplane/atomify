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
  
  mixpanel.track(event_name, {...properties, distinct_id: userId})
}
export const time_event = (event_name: string) => {
  mixpanel.time_event(event_name)
}
