import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from './index.js';
import { liveClient } from './liveClient.js';

const fetchMock = vi.fn<typeof fetch>();

describe('application API client', () => {
  beforeEach(async () => {
    await liveClient.logout();
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  it('uses the live backend client in application workflows', () => {
    expect(api).toBe(liveClient);
  });

  it('stores the sender token for the current browser session and sends it on protected calls', async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ accessToken: 'session-token', user: { id: 'user-id', displayName: 'Taylor', email: 'taylor@example.org' } }), { status: 201, headers: { 'Content-Type': 'application/json' } }));
    await api.register({ name: 'Taylor', email: 'taylor@example.org', password: 'a-long-test-password' });
    expect(sessionStorage.getItem('signedoc-access-token')).toBe('session-token');

    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ items: [], nextCursor: null }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
    await api.listDocuments();
    const request = fetchMock.mock.calls[1][1] as RequestInit;
    expect(new Headers(request.headers).get('Authorization')).toBe('Bearer session-token');

    await api.logout();
    expect(sessionStorage.getItem('signedoc-access-token')).toBeNull();
  });
});