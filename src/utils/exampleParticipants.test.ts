import { describe, it, expect } from 'vitest';
import { buildExampleParticipants } from './exampleParticipants';
import { generatePairs } from './generatePairs';

describe('buildExampleParticipants', () => {
  it('produces 6 participants', () => {
    const participants = buildExampleParticipants();
    expect(Object.keys(participants)).toHaveLength(6);
  });

  it('always generates a valid set of pairings', () => {
    // Regenerate several times since the matcher shuffles — this is what
    // "click it and see generated pairings within five seconds" depends on.
    for (let i = 0; i < 20; i++) {
      const participants = buildExampleParticipants();
      const result = generatePairs(participants);
      expect(result).not.toBeNull();
      expect(result!.pairings).toHaveLength(6);
    }
  });

  it('respects its own showcased rules', () => {
    const participants = buildExampleParticipants();
    const result = generatePairs(participants)!;

    const byName = (name: string) => Object.values(participants).find(p => p.name === name)!;
    const receiverOf = (giverName: string) =>
      result.pairings.find(p => p.giver.id === byName(giverName).id)!.receiver.name;

    expect(receiverOf('Eka')).toBe('Budi'); // MUST rule
    expect(receiverOf('Ani')).not.toBe('Budi'); // MUST NOT rule
    expect(receiverOf('Citra')).not.toBe('Dedi'); // same group
    expect(receiverOf('Dedi')).not.toBe('Citra'); // same group
  });
});
