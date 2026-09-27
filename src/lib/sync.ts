import { 
  opportunitiesApi, applicationsApi, mentorsApi, communityApi, 
  eventsApi, startupsApi, coursesApi, notificationsApi, connectionsApi, usersApi
} from './api';
import { 
  STORAGE_KEYS, setItem, hasAuthenticatedSession, getCurrentUser 
} from './storage';

/**
 * Pulls the latest data from the backend API and silently updates LocalStorage.
 * The UI will automatically re-render thanks to the 'upliftra_data_changed' events.
 */
export async function syncDatabaseWithServer() {
  if (!hasAuthenticatedSession()) return;
  const user = getCurrentUser();
  if (!user || !user.id) return;

  try {
    // We fire these off concurrently for speed
    const [
      oppsRes, appsRes, mentorsRes, eventsRes, startupsRes, 
      coursesRes, certsRes, notifsRes, connsRes, postsRes, mreqRes, msessRes, usersRes
    ] = await Promise.all([
      opportunitiesApi.getAll(),
      applicationsApi.getAll(),
      mentorsApi.getAll(),
      eventsApi.getAll(),
      startupsApi.getAll(),
      coursesApi.getAll(),
      coursesApi.getCertificates(),
      notificationsApi.getAll(),
      connectionsApi.getAll(),
      communityApi.getPosts(),
      mentorsApi.getRequests(),
      mentorsApi.getSessions(),
      usersApi.getAll() // Might fail if not admin, we handle it
    ]);

    // Update LocalStorage directly with real data if API was reachable (not offline)
    if (!oppsRes.offline) {
      if (oppsRes.success && oppsRes.opportunities) setItem(STORAGE_KEYS.OPPORTUNITIES, oppsRes.opportunities);
      if (appsRes.success && appsRes.applications) setItem(STORAGE_KEYS.APPLICATIONS, appsRes.applications);
      if (mentorsRes.success && mentorsRes.mentors) setItem(STORAGE_KEYS.MENTORS, mentorsRes.mentors);
      if (eventsRes.success && eventsRes.events) setItem(STORAGE_KEYS.EVENTS, eventsRes.events);
      if (startupsRes.success && startupsRes.startups) setItem(STORAGE_KEYS.STARTUPS, startupsRes.startups);
      if (coursesRes.success && coursesRes.courses) setItem(STORAGE_KEYS.COURSES, coursesRes.courses);
      if (certsRes.success && certsRes.certificates) setItem(STORAGE_KEYS.CERTIFICATES, certsRes.certificates);
      if (notifsRes.success && notifsRes.notifications) setItem(STORAGE_KEYS.NOTIFICATIONS, notifsRes.notifications);
      if (connsRes.success && connsRes.connections) setItem(STORAGE_KEYS.CONNECTIONS, connsRes.connections);
      if (postsRes.success && postsRes.posts) setItem(STORAGE_KEYS.COMMUNITY_POSTS, postsRes.posts);
      if (mreqRes.success && mreqRes.requests) setItem(STORAGE_KEYS.MENTORSHIP_REQUESTS, mreqRes.requests);
      if (msessRes.success && msessRes.sessions) setItem(STORAGE_KEYS.MENTORSHIP_SESSIONS, msessRes.sessions);
      
      // Admin only data
      if (usersRes.success && usersRes.users) setItem(STORAGE_KEYS.USERS, usersRes.users);
    }
  } catch (err) {
    console.error('Background sync failed:', err);
  }
}
