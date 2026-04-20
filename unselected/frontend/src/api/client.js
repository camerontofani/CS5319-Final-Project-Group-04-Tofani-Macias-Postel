const TOKEN_KEY = 'smartstudy_access_token';

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

export async function apiGet(path, { auth = true } = {}) {
  const res = await fetch(`${baseUrl()}${path}`, {
    headers: { ...authHeaders(auth) },
  });
  if (!res.ok) {
    throw await buildError(res);
  }
  return res.json();
}

export async function apiPost(path, body, { auth = true } = {}) {
  const res = await fetch(`${baseUrl()}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(auth),
    },
    body: JSON.stringify(body ?? {}),
  });
  if (!res.ok) {
    throw await buildError(res);
  }
  return res.json();
}

export async function apiPatch(path, body, { auth = true } = {}) {
  const res = await fetch(`${baseUrl()}${path}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(auth),
    },
    body: JSON.stringify(body ?? {}),
  });
  if (!res.ok) {
    throw await buildError(res);
  }
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
