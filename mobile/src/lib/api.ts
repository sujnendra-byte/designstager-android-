// Talks to designstager.com. Every call carries the app token (set after login).
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export const SITE = 'https://designstager.com';
const TOKEN_KEY = 'ds_app_token';

let token: string | null = null;
let onSignedOut: (() => void) | null = null;

export async function loadToken() {
  token = await SecureStore.getItemAsync(TOKEN_KEY);
  return token;
}
export async function saveToken(t: string | null) {
  token = t;
  if (t) await SecureStore.setItemAsync(TOKEN_KEY, t);
  else await SecureStore.deleteItemAsync(TOKEN_KEY);
}
export function setSignedOutHandler(fn: () => void) {
  onSignedOut = fn;
}

export class ApiError extends Error {
  status: number;
  data: any;
  constructor(message: string, status: number, data: any) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

type Opts = { method?: 'GET' | 'POST'; body?: any; query?: Record<string, string | number | undefined> };

export async function api<T = any>(path: string, opts: Opts = {}): Promise<T> {
  const q = opts.query
    ? '?' +
      Object.entries(opts.query)
        .filter(([, v]) => v !== undefined && v !== '')
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join('&')
    : '';
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (token) headers['X-DS-App-Token'] = token;
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';

  let res: Response;
  try {
    res = await fetch(`${SITE}/wp-json/${path}${q === '?' ? '' : q}`, {
      method: opts.method || (opts.body !== undefined ? 'POST' : 'GET'),
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    });
  } catch {
    throw new ApiError('No internet connection. Please try again.', 0, null);
  }
  let data: any = null;
  try {
    data = await res.json();
  } catch {
    /* not JSON */
  }
  if (res.status === 401 && token && path !== 'ds-app/v1/login') {
    await saveToken(null);
    onSignedOut?.();
  }
  if (!res.ok || (data && data.ok === false) || (data && data.success === false)) {
    const msg = (data && (data.error || data.message)) || `Something went wrong (${res.status}).`;
    throw new ApiError(String(msg), res.status, data);
  }
  return data as T;
}

/* ---------- typed calls ---------- */

export type User = { id: number; name: string; email: string; avatar: string };
export type Me = {
  user: User;
  credits: number;
  plan: string;
  plan_label: string;
  plan_status: string;
  plan_end: string | number;
  downloads?: { used_free?: number; limit_free?: number; used_pro?: number; limit_pro?: number } | null;
};

export const login = (username: string, password: string) =>
  api<{ token: string; user: User }>('ds-app/v1/login', {
    body: { username, password, device: `${Platform.OS} app` },
  });
export const logout = () => api('ds-app/v1/logout', { body: {} }).catch(() => null);
export const getMe = () => api<Me>('ds-app/v1/me');

export type MarketItem = { id: number; title: string; thumb: string; pro: boolean; categories: string[]; date: string };
export type MarketCat = { id: number; slug: string; name: string; parent: number; count: number };
export const getMarket = (q: { page?: number; search?: string; category?: string; tier?: string }) =>
  api<{ items: MarketItem[]; page: number; pages: number; total: number }>('ds-app/v1/market', {
    query: { per_page: 24, ...q },
  });
export const getMarketCats = () => api<{ root: number; categories: MarketCat[] }>('ds-app/v1/market/categories');
export const marketDownload = (id: number) =>
  api<{ url: string; title: string }>('ds-app/v1/market/download', { body: { id } });

export type Draft = {
  id: string;
  title: string;
  slides_count: number;
  updated: number;
  design: string;
  first_slide?: { image_data?: string } | null;
};
export const getMyPpts = (offset = 0) =>
  api<{ drafts: Draft[]; total: number; next_offset: number }>('ds/v1/my-ppts', { query: { offset, limit: 24 } });

export type AiImage = { key: string; url: string; prompt: string; model: string; date: string };
export const getMyImages = (offset = 0) =>
  api<{ images: AiImage[]; total: number; next_offset: number }>('ds-app/v1/images', { query: { offset, limit: 30 } });

export type MediaItem = {
  key: string;
  url: string;
  status: string;
  label?: string;
  prompt?: string;
  kind?: string;
  duration?: number;
  date?: string;
  is_expired?: boolean;
};
export const getMyAudio = (offset = 0) =>
  api<{ audios?: MediaItem[]; items?: MediaItem[]; total: number; next_offset: number }>('ds/v1/my-audio', {
    query: { offset },
  });
export const getMyVideos = (offset = 0) =>
  api<{ videos: MediaItem[]; total: number; next_offset: number }>('ds/v1/my-videos', { query: { offset } });

export type CreditRow = { date?: string; time?: string; type?: string; label?: string; desc?: string; credits?: number; amount?: number; cost?: number };
export const getCreditLog = () => api<any>('ds/v1/credit-log');

/** A one-time link that opens a website page inside the app, already logged in. */
export async function webUrl(path: string) {
  try {
    const r = await api<{ code: string }>('ds-app/v1/web-code', { body: {} });
    return `${SITE}/wp-json/ds-app/v1/web?code=${r.code}&to=${encodeURIComponent(path)}`;
  } catch {
    return SITE + path;
  }
}
