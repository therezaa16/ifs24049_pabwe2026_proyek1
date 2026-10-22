import { ApiError } from './api-error.js';

const NETWORK_ERROR_MESSAGE = 'Tidak dapat terhubung ke server. Periksa koneksi atau pastikan backend berjalan.';
const GENERIC_ERROR_MESSAGE = 'Terjadi kesalahan. Silakan coba lagi.';

const parseBody = async (response) => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

export const buildQuery = (params = {}) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      search.append(key, value);
    }
  });
  const query = search.toString();
  return query ? `?${query}` : '';
};

export const createHttpClient = ({ baseUrl, getToken, onUnauthorized, fetchImpl = (...args) => fetch(...args) }) => {
  const request = async (method, path, body) => {
    const token = getToken();
    const headers = { Accept: 'application/json' };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (token) headers.Authorization = `Bearer ${token}`;

    let response;
    try {
      response = await fetchImpl(`${baseUrl}${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body)
      });
    } catch {
      throw new ApiError(NETWORK_ERROR_MESSAGE, 0);
    }

    const payload = await parseBody(response);
    if (!response.ok) {
      if (response.status === 401 && token) onUnauthorized();
      throw new ApiError(payload?.message || GENERIC_ERROR_MESSAGE, response.status, payload?.errors ?? null);
    }
    return payload;
  };

  return {
    get: (path) => request('GET', path),
    post: (path, body = {}) => request('POST', path, body),
    patch: (path, body = {}) => request('PATCH', path, body),
    delete: (path) => request('DELETE', path)
  };
};
