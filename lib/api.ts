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

async function fetchJSON<T>(url: string, headers: HeadersInit, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...headers, ...init?.headers },
    ...init,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message ?? 'Error del servidor');
  }
  return res.json() as Promise<T>;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  return fetchJSON<T>(`${API}/api${path}`, authHeaders(), init);
}

// Uses user JWT (for public endpoints that optionally accept user identity)
async function requestUser<T>(path: string, init?: RequestInit): Promise<T> {
  return fetchJSON<T>(`${API}/api${path}`, userAuthHeaders(), init);
}

// Auth
export async function login(email: string, password: string) {
  const data = await request<{ access_token: string; admin: { name: string; email: string } }>(
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

export function getAdmin() {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('fx_admin');
  return raw ? (JSON.parse(raw) as { name: string; email: string }) : null;
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

// Bookings
export type Booking = {
  id: number;
  name: string;
  phone: string;
  email?: string;
  classScheduleId: number;
  status: 'PENDIENTE' | 'CONFIRMADO' | 'CANCELADO';
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

export const updateUserProfile = (data: { name?: string; phone?: string; email?: string; password?: string }) =>
  requestUser<UserProfile>('/users/me', { method: 'PATCH', body: JSON.stringify(data) });
