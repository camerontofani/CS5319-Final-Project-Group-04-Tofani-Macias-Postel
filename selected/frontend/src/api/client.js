const TOKEN_KEY = 'smartstudy_access_token';
const TIMEOUT_MS = 15000;

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

function baseUrl() {
  return process.env.REACT_APP_API_URL || '';
}

function authHeaders(includeAuth) {
  const headers = {};
  if (includeAuth) {
    const t = getStoredToken();
    if (t) {
      headers.Authorization = `Bearer ${t}`;
    }
  }
  return headers;
}

function fetchWithTimeout(url, options) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), TIMEOUT_MS);
  return fetch(url, { ...options, signal: controller.signal }).finally(() =>
    clearTimeout(id)
  );
}

export async function apiGet(path, { auth = true } = {}) {
  let res;
  try {
    res = await fetchWithTimeout(`${baseUrl()}${path}`, {
      headers: { ...authHeaders(auth) },
    });
  } catch (e) {
    throw new Error(e.name === 'AbortError' ? 'Request timed out' : 'Network error — is the server running?');
  }
  if (!res.ok) throw await buildError(res);
  return res.json();
}

export async function apiPost(path, body, { auth = true } = {}) {
  let res;
  try {
    res = await fetchWithTimeout(`${baseUrl()}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders(auth) },
      body: JSON.stringify(body ?? {}),
    });
  } catch (e) {
    throw new Error(e.name === 'AbortError' ? 'Request timed out' : 'Network error — is the server running?');
  }
  if (!res.ok) throw await buildError(res);
  return res.json();
}

export async function apiPatch(path, body, { auth = true } = {}) {
  let res;
  try {
    res = await fetchWithTimeout(`${baseUrl()}${path}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeaders(auth) },
      body: JSON.stringify(body ?? {}),
    });
  } catch (e) {
    throw new Error(e.name === 'AbortError' ? 'Request timed out' : 'Network error — is the server running?');
  }
  if (!res.ok) throw await buildError(res);
  return res.json();
}

async function buildError(res) {
  const text = await res.text();
  try {
    const j = JSON.parse(text);
    if (j.detail) {
      if (typeof j.detail === 'string') return new Error(j.detail);
      if (Array.isArray(j.detail)) {
        return new Error(j.detail.map((d) => d.msg || d).join(', '));
      }
    }
  } catch {
    /* use text */
  }
  return new Error(text || res.statusText);
}
