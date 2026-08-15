import { describe, it, expect } from 'vitest';
import { parseEventBackup, EventBackup } from './eventBackup';
import { Participant } from '../types';

describe('parseEventBackup', () => {
  it('round-trips a full backup', () => {
    const participants: Record<string, Participant> = {
      a: { id: 'a', name: 'Budi', rules: [], groupId: 'family' },
    };
    const backup: EventBackup = {
      version: 1,
      participants,
      assignments: {
        hash: 'h',
        encryptionKey: 'k',
        pairings: [{ giver: { id: 'a', name: 'Budi' }, receiver: { id: 'a', name: 'Budi' } }],
      },
      instructions: 'Bring gifts by Friday',
      eventMetadata: { eventName: 'Kantor', budgetMin: 50000, budgetMax: 100000 },
    };

    const parsed = parseEventBackup(JSON.stringify(backup));
    expect(parsed).toEqual(backup);
  });

  it('fills in defaults for missing optional fields', () => {
    const parsed = parseEventBackup(JSON.stringify({ participants: { a: { id: 'a', name: 'Budi', rules: [] } } }));

    expect(parsed.assignments).toBeNull();
    expect(parsed.instructions).toBe('');
    expect(parsed.eventMetadata).toEqual({});
  });

  it('rejects a file with no participants map', () => {
    expect(() => parseEventBackup(JSON.stringify({ foo: 'bar' }))).toThrow();
  });

  it('rejects malformed JSON', () => {
    expect(() => parseEventBackup('not json')).toThrow();
  });
});
