// src/lib/api.ts
// ─────────────────────────────────────────────────────────────────────────────
// Frontend API Client — Single source of truth for all server communication.
// All calls go to /api/* which Vite proxies to the Express backend on port 3001.
// Falls back gracefully to localStorage when the server is unavailable (503).
// ─────────────────────────────────────────────────────────────────────────────

export type ApiResult<T = unknown> = {
  success: boolean;
  offline?: boolean;
  message?: string;
} & Partial<T>;

// ── HTTP Client ───────────────────────────────────────────────────────────────
async function request<T = unknown>(
  method: string,
  path: string,
  body?: unknown,
  options?: RequestInit
): Promise<ApiResult<T>> {
  try {
    const res = await fetch(`/api${path}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // Send cookies (JWT)
      body: body !== undefined ? JSON.stringify(body) : undefined,
      ...options,
    });

    const data = await res.json().catch(() => ({}));

    if (res.status === 503) {
      // Google Sheets not configured — caller can fall back to localStorage
      return { success: false, offline: true, message: data.message } as ApiResult<T>;
    }

    return { ...data, success: res.ok && data.success !== false };
  } catch (err) {
    // Network error (server not running)
    return {
      success: false,
      offline: true,
      message: 'API server unavailable. Running in offline mode.',
    } as ApiResult<T>;
  }
}

export const api = {
  get:    <T = unknown>(path: string)                 => request<T>('GET',    path),
  post:   <T = unknown>(path: string, body?: unknown) => request<T>('POST',   path, body),
  patch:  <T = unknown>(path: string, body?: unknown) => request<T>('PATCH',  path, body),
  put:    <T = unknown>(path: string, body?: unknown) => request<T>('PUT',    path, body),
  delete: <T = unknown>(path: string)                 => request<T>('DELETE', path),
};

// ── Health Check ──────────────────────────────────────────────────────────────
export async function checkServerHealth(): Promise<{ online: boolean; sheetsConfigured: boolean }> {
  try {
    const res = await fetch('/api/health', { credentials: 'include' });
    if (!res.ok) return { online: false, sheetsConfigured: false };
    const data = await res.json();
    return { online: true, sheetsConfigured: data.sheetsConfigured ?? false };
  } catch {
    return { online: false, sheetsConfigured: false };
  }
}

// ── Auth API ──────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data: Record<string, unknown>) =>
    api.post<{ user: unknown }>('/auth/register', data),

  login: (email: string, password: string, rememberMe = false) =>
    api.post<{ user: unknown }>('/auth/login', { email, password, rememberMe }),

  logout: () =>
    api.post('/auth/logout'),

  session: () =>
    api.get<{ user: unknown }>('/auth/session'),

  changePassword: (currentPassword: string, newPassword: string, confirmPassword: string) =>
    api.post('/auth/change-password', { currentPassword, newPassword, confirmPassword }),
};

// ── Users API ─────────────────────────────────────────────────────────────────
export const usersApi = {
  me: ()                           => api.get<{ user: unknown }>('/users/me'),
  updateMe: (data: unknown)        => api.patch<{ user: unknown }>('/users/me', data),
  getById: (id: string)            => api.get<{ user: unknown }>(`/users/${id}`),
  getAll: ()                       => api.get<{ users: unknown[] }>('/users'),
  updateById: (id: string, d: unknown) => api.patch(`/users/${id}`, d),
  deleteById: (id: string)         => api.delete(`/users/${id}`),
};

// ── Opportunities API ─────────────────────────────────────────────────────────
export const opportunitiesApi = {
  getAll: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return api.get<{ opportunities: unknown[] }>(`/opportunities${query}`);
  },
  getById: (id: string)              => api.get<{ opportunity: unknown }>(`/opportunities/${id}`),
  create: (data: unknown)            => api.post<{ opportunity: unknown }>('/opportunities', data),
  update: (id: string, d: unknown)   => api.patch(`/opportunities/${id}`, d),
  delete: (id: string)               => api.delete(`/opportunities/${id}`),
};

// ── Applications API ──────────────────────────────────────────────────────────
export const applicationsApi = {
  getAll: ()                         => api.get<{ applications: unknown[] }>('/applications'),
  create: (data: unknown)            => api.post<{ application: unknown }>('/applications', data),
  update: (id: string, d: unknown)   => api.patch(`/applications/${id}`, d),
  delete: (id: string)               => api.delete(`/applications/${id}`),
};

// ── Mentors API ───────────────────────────────────────────────────────────────
export const mentorsApi = {
  getAll: ()                         => api.get<{ mentors: unknown[] }>('/mentors'),
  getById: (id: string)              => api.get<{ mentor: unknown }>(`/mentors/${id}`),
  create: (data: unknown)            => api.post<{ mentor: unknown }>('/mentors', data),
  update: (id: string, d: unknown)   => api.patch(`/mentors/${id}`, d),
  getRequests: ()                    => api.get<{ requests: unknown[] }>('/mentors/requests/all'),
  createRequest: (data: unknown)     => api.post<{ request: unknown }>('/mentors/requests', data),
  updateRequest: (id: string, d: unknown) => api.patch(`/mentors/requests/${id}`, d),
  getSessions: ()                    => api.get<{ sessions: unknown[] }>('/mentors/sessions/all'),
  createSession: (data: unknown)     => api.post<{ session: unknown }>('/mentors/sessions', data),
  updateSession: (id: string, d: unknown) => api.patch(`/mentors/sessions/${id}`, d),
};

// ── Community API ─────────────────────────────────────────────────────────────
export const communityApi = {
  getPosts: ()                       => api.get<{ posts: unknown[] }>('/community/posts'),
  createPost: (data: unknown)        => api.post<{ post: unknown }>('/community/posts', data),
  updatePost: (id: string, d: unknown) => api.patch(`/community/posts/${id}`, d),
  deletePost: (id: string)           => api.delete(`/community/posts/${id}`),
  upvotePost: (id: string)           => api.post(`/community/posts/${id}/upvote`),
  addComment: (id: string, content: string) =>
    api.post<{ comment: unknown }>(`/community/posts/${id}/comment`, { content }),
  getReports: ()                     => api.get<{ reports: unknown[] }>('/community/reports'),
  createReport: (data: unknown)      => api.post('/community/reports', data),
};

// ── Events API ────────────────────────────────────────────────────────────────
export const eventsApi = {
  getAll: ()                         => api.get<{ events: unknown[] }>('/events'),
  getById: (id: string)              => api.get<{ event: unknown }>(`/events/${id}`),
  create: (data: unknown)            => api.post<{ event: unknown }>('/events', data),
  update: (id: string, d: unknown)   => api.patch(`/events/${id}`, d),
  register: (id: string)             => api.post(`/events/${id}/register`),
};

// ── Startups API ──────────────────────────────────────────────────────────────
export const startupsApi = {
  getAll: ()                         => api.get<{ startups: unknown[] }>('/startups'),
  create: (data: unknown)            => api.post<{ startup: unknown }>('/startups', data),
  update: (id: string, d: unknown)   => api.patch(`/startups/${id}`, d),
  delete: (id: string)               => api.delete(`/startups/${id}`),
};

// ── Courses API ───────────────────────────────────────────────────────────────
export const coursesApi = {
  getAll: ()                         => api.get<{ courses: unknown[] }>('/courses'),
  getById: (id: string)              => api.get<{ course: unknown }>(`/courses/${id}`),
  create: (data: unknown)            => api.post<{ course: unknown }>('/courses', data),
  getCertificates: ()                => api.get<{ certificates: unknown[] }>('/courses/certificates'),
  issueCertificate: (courseId: string) =>
    api.post<{ certificate: unknown }>(`/courses/${courseId}/certificate`),
};

// ── Notifications API ─────────────────────────────────────────────────────────
export const notificationsApi = {
  getAll: ()                         => api.get<{ notifications: unknown[] }>('/notifications'),
  markRead: (id: string)             => api.patch(`/notifications/${id}/read`),
  markAllRead: ()                    => api.post('/notifications/read-all'),
};

// ── Connections API ───────────────────────────────────────────────────────────
export const connectionsApi = {
  getAll: ()                         => api.get<{ connections: unknown[] }>('/connections'),
  create: (data: unknown)            => api.post<{ connection: unknown }>('/connections', data),
  update: (id: string, d: unknown)   => api.patch(`/connections/${id}`, d),
};

// ── Admin API ─────────────────────────────────────────────────────────────────
export const adminApi = {
  getStats: ()                       => api.get('/admin/stats'),
  getAuditLogs: (limit?: number)     => api.get(`/admin/audit-logs${limit ? `?limit=${limit}` : ''}`),
  updateUserStatus: (id: string, status: string) =>
    api.patch(`/admin/users/${id}/status`, { status }),
  updateUserRole: (id: string, role: string) =>
    api.patch(`/admin/users/${id}/role`, { role }),
  getVerificationRequests: ()        => api.get('/admin/verification-requests'),
};
