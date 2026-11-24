import { beforeEach, describe, expect, it } from 'vitest';
import { mockClient } from './mockClient.js';

describe('mock API seam', () => {
  beforeEach(() => { localStorage.clear(); window.history.replaceState({}, '', '/'); });
  it('serves the planning preview documents through the API client', async () => {
    const response = await mockClient.listDocuments();
    expect(response.items.map((item) => item.fileName)).toEqual(['Community Partnership Agreement', 'Volunteer Handbook Acknowledgment', 'Board Meeting Confidentiality Form']);
  });
  it('provides list empty state without importing fixtures from the UI', async () => {
    localStorage.setItem('previewState', 'empty');
    expect((await mockClient.listDocuments()).items).toHaveLength(0);
  });
  it('creates a development-only recipient invitation', async () => {
    const result = await mockClient.createInvitation('11111111-1111-4111-8111-111111111111', { name: 'Casey', email: 'casey@example.org' });
    expect(result.status).toBe('sent_to_development_sink');
  });
});