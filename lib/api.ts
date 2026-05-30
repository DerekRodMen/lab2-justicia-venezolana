const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

// ── Admin auth helpers ────────────────────────────────────────────────────
function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('fx_token');
}
function authHeaders(): HeadersInit {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ── User auth helpers ─────────────────────────────────────────────────────
function getUserToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('fx_user_token');
}
function userAuthHeaders(): HeadersInit {
  const token = getUserToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function fetchJSON<T>(
  url: string,
  headers: HeadersInit,
  init?: RequestInit,
  onUnauthorized?: () => void,
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      headers: { 'Content-Type': 'application/json', ...headers, ...init?.headers },
      ...init,
    });
  } catch {
    // Error de red / servidor caído / CORS.
    throw new Error('No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.');
  }

  if (!res.ok) {
    // Sesión expirada o token inválido: limpiamos y dejamos que la UI redirija.
    if (res.status === 401 && onUnauthorized) onUnauthorized();
    if (res.status === 429) {
      throw new Error('Demasiadas solicitudes. Espera un momento e inténtalo de nuevo.');
    }
    const err = await res.json().catch(() => ({ message: res.statusText }));
    const message = Array.isArray(err?.message) ? err.message.join(', ') : err?.message;
    throw new Error(message ?? 'Error del servidor');
  }

  // 204 No Content u otras respuestas sin cuerpo.
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

// Si el token de admin expira, limpiamos la sesión y mandamos al login.
function handleAdminUnauthorized() {
  if (typeof window === 'undefined') return;
  const hadToken = !!localStorage.getItem('fx_token');
  localStorage.removeItem('fx_token');
  localStorage.removeItem('fx_admin');
  // Solo redirigimos si había una sesión activa (token expirado/ inválido),
  // no en un intento de login fallido.
  if (hadToken && window.location.pathname.startsWith('/admin')) {
    window.location.href = '/admin';
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  return fetchJSON<T>(`${API}/api${path}`, authHeaders(), init, handleAdminUnauthorized);
}

// Uses user JWT (for public endpoints that optionally accept user identity)
async function requestUser<T>(path: string, init?: RequestInit): Promise<T> {
  return fetchJSON<T>(`${API}/api${path}`, userAuthHeaders(), init);
}

// Auth
export type AdminProfile = {
  id: number;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'TRAINER';
};

export async function login(email: string, password: string) {
  const data = await request<{ access_token: string; admin: AdminProfile }>(
    '/auth/login',
    { method: 'POST', body: JSON.stringify({ email, password }) },
  );
  localStorage.setItem('fx_token', data.access_token);
  localStorage.setItem('fx_admin', JSON.stringify(data.admin));
  return data;
}

export function logout() {
  localStorage.removeItem('fx_token');
  localStorage.removeItem('fx_admin');
}

export function getAdmin(): AdminProfile | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('fx_admin');
  return raw ? (JSON.parse(raw) as AdminProfile) : null;
}

// Leads
export type Lead = {
  id: number;
  name: string;
  phone: string;
  goal: string;
  message?: string;
  status: 'NUEVO' | 'CONTACTADO' | 'EN_PROCESO' | 'CONVERTIDO' | 'PERDIDO';
  notes?: string;
  createdAt: string;
};

export type LeadStats = {
  total: number;
  byStatus: { status: string; _count: { id: number } }[];
  byGoal: { goal: string; _count: { id: number } }[];
};

export const createLead = (data: { name: string; phone: string; goal: string; message?: string }) =>
  request<Lead>('/leads', { method: 'POST', body: JSON.stringify(data) });

export const getLeads = (status?: string) =>
  request<Lead[]>(`/leads${status ? `?status=${status}` : ''}`);

export const getLeadStats = () => request<LeadStats>('/leads/stats');

export const updateLead = (id: number, data: { status?: string; notes?: string }) =>
  request<Lead>(`/leads/${id}`, { method: 'PATCH', body: JSON.stringify(data) });

export const deleteLead = (id: number) =>
  request<void>(`/leads/${id}`, { method: 'DELETE' });

// Classes
export type ClassSchedule = {
  id: number;
  name: string;
  instructor: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  capacity: number;
  isActive: boolean;
  _count: { bookings: number };
};

export const getClasses = () => request<ClassSchedule[]>('/classes');

export const createClass = (data: Omit<ClassSchedule, 'id' | 'isActive' | '_count'> & { isActive?: boolean }) =>
  request<ClassSchedule>('/classes', { method: 'POST', body: JSON.stringify(data) });

export const updateClass = (id: number, data: Partial<ClassSchedule>) =>
  request<ClassSchedule>(`/classes/${id}`, { method: 'PATCH', body: JSON.stringify(data) });

export const deleteClass = (id: number) =>
  request<void>(`/classes/${id}`, { method: 'DELETE' });

export const markAttendance = (id: number, attended: boolean) =>
  request<Booking>(`/classes/bookings/${id}/attendance`, {
    method: 'PATCH',
    body: JSON.stringify({ attended }),
  });

// Instructors
export type Instructor = {
  id: number;
  name: string;
  bio?: string;
  specialty?: string;
  photoUrl?: string;
  order: number;
  isActive: boolean;
};

export const getInstructors = () => request<Instructor[]>('/instructors');

export const createInstructor = (data: Omit<Instructor, 'id' | 'isActive' | 'order'> & { order?: number; isActive?: boolean }) =>
  request<Instructor>('/instructors', { method: 'POST', body: JSON.stringify(data) });

export const updateInstructor = (id: number, data: Partial<Instructor>) =>
  request<Instructor>(`/instructors/${id}`, { method: 'PATCH', body: JSON.stringify(data) });

export const deleteInstructor = (id: number) =>
  request<void>(`/instructors/${id}`, { method: 'DELETE' });

// Waitlist
export type WaitlistEntry = {
  id: number;
  name: string;
  phone: string;
  email?: string;
  classScheduleId: number;
  status: 'ESPERANDO' | 'NOTIFICADO' | 'CONVERTIDO' | 'EXPIRADO';
  notifiedAt?: string;
  createdAt: string;
  classSchedule?: { name: string; dayOfWeek: number; startTime: string };
};

export const joinWaitlist = (data: { name: string; phone: string; email?: string; classScheduleId: number }) =>
  requestUser<WaitlistEntry>('/classes/waitlist', { method: 'POST', body: JSON.stringify(data) });

export const getWaitlist = (classId?: number) =>
  request<WaitlistEntry[]>(`/classes/waitlist/all${classId ? `?classId=${classId}` : ''}`);

export const removeFromWaitlist = (id: number) =>
  request<WaitlistEntry>(`/classes/waitlist/${id}/remove`, { method: 'PATCH' });

// Bookings
export type Booking = {
  id: number;
  name: string;
  phone: string;
  email?: string;
  classScheduleId: number;
  status: 'PENDIENTE' | 'CONFIRMADO' | 'CANCELADO';
  attended?: boolean | null;
  createdAt: string;
  classSchedule?: { name: string; startTime: string; endTime: string; dayOfWeek: number };
};

// Uses user token so the booking gets linked to the logged-in user
export const createBooking = (data: { name: string; phone: string; email?: string; classScheduleId: number }) =>
  requestUser<Booking>('/classes/bookings', { method: 'POST', body: JSON.stringify(data) });

export const getBookings = (classId?: number) =>
  request<Booking[]>(`/classes/bookings/all${classId ? `?classId=${classId}` : ''}`);

export const cancelBooking = (id: number) =>
  request<Booking>(`/classes/bookings/${id}/cancel`, { method: 'PATCH' });

export const confirmBooking = (id: number) =>
  request<Booking>(`/classes/bookings/${id}/confirm`, { method: 'PATCH' });

// ── User portal ───────────────────────────────────────────────────────────
export type UserProfile = { id: number; name: string; email: string; phone: string };

export async function registerUser(data: { name: string; phone: string; email: string; password: string }) {
  const res = await requestUser<{ access_token: string; user: UserProfile }>('/users/register', {
    method: 'POST', body: JSON.stringify(data),
  });
  localStorage.setItem('fx_user_token', res.access_token);
  localStorage.setItem('fx_user', JSON.stringify(res.user));
  return res;
}

export async function loginUser(email: string, password: string) {
  const res = await requestUser<{ access_token: string; user: UserProfile }>('/users/login', {
    method: 'POST', body: JSON.stringify({ email, password }),
  });
  localStorage.setItem('fx_user_token', res.access_token);
  localStorage.setItem('fx_user', JSON.stringify(res.user));
  return res;
}

export function logoutUser() {
  localStorage.removeItem('fx_user_token');
  localStorage.removeItem('fx_user');
}

export function getCurrentUser(): UserProfile | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('fx_user');
  return raw ? (JSON.parse(raw) as UserProfile) : null;
}

export const getMyBookings = () => requestUser<Booking[]>('/users/mis-reservas');

// Memberships
export type Membership = {
  id: number;
  userId: number;
  plan: 'BASICO' | 'PRO' | 'PREMIUM';
  startDate: string;
  endDate: string;
  isActive: boolean;
  notes?: string;
  user?: { id: number; name: string; email: string; phone: string };
};

// Transfer booking (cambio de clase)
export const transferBooking = (id: number, newClassScheduleId: number) =>
  requestUser<Booking>(`/classes/bookings/${id}/transfer`, {
    method: 'PATCH',
    body: JSON.stringify({ newClassScheduleId }),
  });

// Progress
export type ProgressEntry = {
  id: number;
  category: 'FUERZA' | 'CARDIO' | 'PESO' | 'GENERAL';
  date: string;
  weight?: number | null;
  reps?: number | null;
  notes?: string | null;
  createdAt: string;
};

export const getProgress = () => requestUser<ProgressEntry[]>('/users/progress');

export const addProgress = (data: {
  category?: string; date?: string; weight?: number; reps?: number; notes?: string;
}) => requestUser<ProgressEntry>('/users/progress', { method: 'POST', body: JSON.stringify(data) });

export const deleteProgress = (id: number) =>
  requestUser<void>(`/users/progress/${id}`, { method: 'DELETE' });

// Admin management
export type AdminUser = {
  id: number; name: string; email: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'TRAINER';
  createdAt: string;
};

export const listAdmins = () => request<AdminUser[]>('/auth/admins');

export const createAdmin = (data: { name: string; email: string; password: string; role?: string }) =>
  request<AdminUser>('/auth/admins', { method: 'POST', body: JSON.stringify(data) });

export const updateAdminRole = (id: number, role: string) =>
  request<AdminUser>(`/auth/admins/${id}/role`, { method: 'PATCH', body: JSON.stringify({ role }) });

export const removeAdmin = (id: number) =>
  request<{ message: string }>(`/auth/admins/${id}`, { method: 'DELETE' });

export const getMyMembership = () =>
  requestUser<Membership | null>('/memberships/me');

export const getAllMemberships = () =>
  request<Membership[]>('/memberships');

export const upsertMembership = (data: {
  userId: number; plan: string; startDate: string; endDate: string; notes?: string;
}) => request<Membership>('/memberships', { method: 'POST', body: JSON.stringify(data) });

export const deleteMembership = (userId: number) =>
  request<void>(`/memberships/${userId}`, { method: 'DELETE' });

// Reviews
export type ClassReview = {
  id: number;
  bookingId: number;
  classScheduleId: number;
  rating: number;
  comment?: string;
  createdAt: string;
  user?: { name: string };
};

export type ReviewSummary = { name: string; total: number; average: number };

export const createReview = (data: { bookingId: number; rating: number; comment?: string }) =>
  requestUser<ClassReview>('/reviews', { method: 'POST', body: JSON.stringify(data) });

export const getReviewSummary = () =>
  request<ReviewSummary[]>('/reviews/summary');

export const forgotPassword = (email: string) =>
  requestUser<{ message: string }>('/users/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });

export const resetPassword = (token: string, password: string) =>
  requestUser<{ message: string }>('/users/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, password }),
  });

export const updateUserProfile = (data: { name?: string; phone?: string; email?: string; password?: string }) =>
  requestUser<UserProfile>('/users/me', { method: 'PATCH', body: JSON.stringify(data) });
