import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, fieldErrorsOf } from '@/core/http/api-error.js';
import { buildQuery, createHttpClient } from '@/core/http/http-client.js';
import { tokenStorage } from '@/core/storage/token-storage.js';
import {
  formatClock, formatCompactRupiah, formatDate, formatDateKey, formatMinutes, formatRupiah
} from '@/core/format/formatters.js';

afterEach(() => { vi.restoreAllMocks(); localStorage.clear(); });

describe('formatters', () => {
  it('memformat rupiah, tanggal, jam, dan durasi', () => {
    expect(formatRupiah(1500000)).toBe('Rp 1.500.000');
    expect(formatRupiah('abc')).toBe('Rp 0');
    expect(formatCompactRupiah(2_500_000)).toBe('2.5 jt');
    expect(formatCompactRupiah(2_000_000)).toBe('2 jt');
    expect(formatCompactRupiah(15_000)).toBe('15 rb');
    expect(formatCompactRupiah(500)).toBe('500');
    expect(formatCompactRupiah(undefined)).toBe('0');
    expect(formatDate('2026-10-20T03:00:00.000Z')).toMatch(/^\d{1,2} Okt 2026$/);
    expect(formatDate(null)).toBe('');
    expect(formatDateKey('2026-10-05')).toBe('5 Okt');
    expect(formatClock(1500)).toBe('25:00');
    expect(formatClock(59.2)).toBe('01:00');
    expect(formatClock(-4)).toBe('00:00');
    expect(formatMinutes(25)).toBe('25 mnt');
    expect(formatMinutes(120)).toBe('2 jam');
    expect(formatMinutes(95)).toBe('1 jam 35 mnt');
    expect(formatMinutes(undefined)).toBe('0 mnt');
  });
});

describe('error API', () => {
  it('mengambil error per field hanya dari ApiError', () => {
    expect(fieldErrorsOf(new ApiError('x', 400, { email: 'salah' }))).toEqual({ email: 'salah' });
    expect(fieldErrorsOf(new ApiError('x', 400))).toEqual({});
    expect(fieldErrorsOf(new Error('x'))).toEqual({});
    expect(new ApiError('x').status).toBe(0);
  });
});

describe('token storage', () => {
  it('menyimpan, membaca, dan menghapus token', () => {
    expect(tokenStorage.get()).toBeNull();
    tokenStorage.set('abc');
    expect(tokenStorage.get()).toBe('abc');
    tokenStorage.clear();
    expect(tokenStorage.get()).toBeNull();
  });

  it('tidak melempar error saat storage tidak tersedia', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked'); });
    expect(tokenStorage.get()).toBeNull();
    expect(() => tokenStorage.set('x')).not.toThrow();
  });
});

describe('http client', () => {
  const respond = (status, body) => ({ ok: status < 400, status, json: async () => body });
  const build = (fetchImpl, token = 't0ken') => {
    const onUnauthorized = vi.fn();
    const client = createHttpClient({ baseUrl: '/api', getToken: () => token, onUnauthorized, fetchImpl });
    return { client, onUnauthorized };
  };

  it('membangun query string tanpa nilai kosong', () => {
    expect(buildQuery({ a: 1, b: '', c: null, d: undefined, e: 'x y' })).toBe('?a=1&e=x+y');
    expect(buildQuery()).toBe('');
  });

  it('mengirim header, token, dan body JSON', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(respond(200, { ok: true }));
    const { client } = build(fetchImpl);

    expect(await client.post('/x', { a: 1 })).toEqual({ ok: true });
    const [url, options] = fetchImpl.mock.calls[0];
    expect(url).toBe('/api/x');
    expect(options).toMatchObject({ method: 'POST', body: '{"a":1}' });
    expect(options.headers).toMatchObject({ Authorization: 'Bearer t0ken', 'Content-Type': 'application/json' });

    await client.get('/y');
    await client.patch('/z');
    await client.delete('/w');
    expect(fetchImpl.mock.calls[1][1].body).toBeUndefined();
    expect(fetchImpl.mock.calls[1][1].headers['Content-Type']).toBeUndefined();
    expect(fetchImpl.mock.calls[2][1].method).toBe('PATCH');
    expect(fetchImpl.mock.calls[3][1].method).toBe('DELETE');
  });

  it('tidak mengirim Authorization tanpa token', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(respond(200, {}));
    await build(fetchImpl, null).client.get('/x');
    expect(fetchImpl.mock.calls[0][1].headers.Authorization).toBeUndefined();
  });

  it('mengubah respons gagal menjadi ApiError', async () => {
    const { client } = build(vi.fn().mockResolvedValue(respond(400, { message: 'Salah', errors: { a: 'b' } })));
    await expect(client.get('/x')).rejects.toMatchObject({ message: 'Salah', status: 400, errors: { a: 'b' } });
  });

  it('memakai pesan umum bila body bukan JSON atau tanpa pesan', async () => {
    const badJson = { ok: false, status: 500, json: async () => { throw new Error('bukan json'); } };
    const { client } = build(vi.fn().mockResolvedValue(badJson));
    await expect(client.get('/x')).rejects.toMatchObject({ status: 500, errors: null });
  });

  it('memanggil onUnauthorized hanya untuk 401 saat token ada', async () => {
    const withToken = build(vi.fn().mockResolvedValue(respond(401, { message: 'Habis' })));
    await expect(withToken.client.get('/x')).rejects.toBeInstanceOf(ApiError);
    expect(withToken.onUnauthorized).toHaveBeenCalledTimes(1);

    const withoutToken = build(vi.fn().mockResolvedValue(respond(401, { message: 'Salah' })), null);
    await expect(withoutToken.client.post('/login')).rejects.toBeInstanceOf(ApiError);
    expect(withoutToken.onUnauthorized).not.toHaveBeenCalled();
  });

  it('melaporkan kegagalan jaringan dengan pesan ramah', async () => {
    const { client } = build(vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    await expect(client.get('/x')).rejects.toMatchObject({ status: 0, message: expect.stringContaining('terhubung') });
  });

  it('memakai fetch global secara bawaan', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(respond(200, { ok: 1 }));
    const client = createHttpClient({ baseUrl: '/api', getToken: () => null, onUnauthorized: vi.fn() });
    expect(await client.get('/ping')).toEqual({ ok: 1 });
    expect(spy).toHaveBeenCalled();
  });
});
