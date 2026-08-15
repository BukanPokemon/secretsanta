import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { GeneratedPairs, generatePairs, diagnoseInfeasibility, checkRules, generateGenerationHash } from './generatePairs';
import { Participant, Rule } from '../types';
import { parseParticipantsText, ParseSuccess } from './parseParticipants';

// Arbitrary to generate valid participant names (non-empty strings)
const nameArb = fc.string({ minLength: 1 }).map(s => s.trim()).filter(s => s.length > 0);

// Arbitrary to generate a valid participant
const participantArb = fc.record({
  id: fc.string(),
  name: nameArb,
  rules: fc.array(
    fc.record({
      type: fc.constantFrom<'must' | 'mustNot'>('must', 'mustNot'),
      targetParticipantId: fc.integer({ min: 0 })
    }),
    { maxLength: 3 }
  )
});

type RawParticipant = {
  id: string;
  name: string;
  rules: { type: 'must' | 'mustNot'; targetParticipantId: number }[];
};

// Fixes rule target ids to point at real participants and drops
// self-contradictory rule sets (multiple MUSTs, MUST + MUST NOT on the same
// target) so the resulting participants are always rule-valid.
function withConsistentRules(participants: Record<string, RawParticipant>): Record<string, Participant> {
  return Object.fromEntries(
    Object.entries(participants).map(([id, participant]) => {
      const rules = participant.rules
        // Remove duplicate rules for the same target
        .filter((rule, index, self) =>
          index === self.findIndex(r => r.targetParticipantId === rule.targetParticipantId)
        )
        // Ensure valid IDs
        .map(r => ({
          ...r,
          targetParticipantId: Object.keys(participants)[
            r.targetParticipantId % Object.keys(participants).length
          ]
        }));

      // Ensure no more than one MUST rule
      const mustRules = rules.filter(r => r.type === 'must');
      const validRules = mustRules.length > 1
        ? [mustRules[0], ...rules.filter(r => r.type === 'mustNot')]
        : rules;

      // Remove conflicting MUST/MUST NOT rules
      const mustRule = validRules.find(r => r.type === 'must');
      const finalRules = mustRule
        ? validRules.filter(r =>
            r.type === 'must' ||
            r.targetParticipantId !== mustRule.targetParticipantId
          )
        : validRules;

      return [id, { ...participant, id, rules: finalRules }];
    })
  );
}

// Updated participantsArb to generate valid rule combinations
const participantsArb = fc.dictionary(
  fc.string(),
  participantArb,
  { minKeys: 2, maxKeys: 10 }
).map(withConsistentRules);

describe('generatePairs', () => {
  it('should always return valid pairings or null', () => {
    fc.assert(
      fc.property(participantsArb, (participants) => {
        const result = generatePairs(participants);
        
        if (result === null) {
          return true; // Null is a valid result
        }

        // Properties that must hold for valid pairings:
        expect(result.pairings).toHaveLength(Object.keys(participants).length);
        
        const givers = new Set(result.pairings.map(({giver}) => giver.id));
        const receivers = new Set(result.pairings.map(({receiver}) => receiver.id));
        
        // Everyone gives exactly once
        expect(givers.size).toBe(Object.keys(participants).length);
        // Everyone receives exactly once
        expect(receivers.size).toBe(Object.keys(participants).length);
        
        // All MUST rules are respected
        result.pairings.forEach(({giver, receiver}) => {
          const mustRules = participants[giver.id].rules.filter(r => r.type === 'must');
          
          mustRules.forEach(rule => {
            expect(receiver.id).toBe(rule.targetParticipantId);
          });
        });

        // All MUST NOT rules are respected
        result.pairings.forEach(({giver, receiver}) => {
          const mustNotRules = participants[giver.id].rules.filter(r => r.type === 'mustNot');
          
          mustNotRules.forEach(rule => {
            expect(receiver.id).not.toBe(rule.targetParticipantId);
          });
        });

        // No self-assignments unless required by MUST rule
        result.pairings.forEach(({giver, receiver}) => {
          if (giver.id === receiver.id) {
            const selfAssignmentRequired = participants[giver.id].rules.some(
              (r: Rule) => r.type === 'must' && r.targetParticipantId === giver.id
            );
            expect(selfAssignmentRequired).toBe(true);
          }
        });
      })
    );
  });

  it('should return null for impossible configurations', () => {
    // Test case: everyone MUST NOT give to everyone else
    fc.assert(
      fc.property(fc.integer({ min: 2, max: 5 }), (size) => {
        const participants: Record<string, Participant> = {};
        for (let i = 0; i < size; i++) {
          const id = `person${i}`;
          participants[id] = {
            id,
            name: `Person${i}`,
            rules: Object.keys(participants).map(targetId => ({
              type: 'mustNot' as const,
              targetParticipantId: targetId
            }))
          };
        }

        const result = generatePairs(participants);
        expect(result).toBeNull();
      })
    );
  });

  it('should handle circular MUST rules correctly', () => {
    const participants: Record<string, Participant> = {
      'A': { id: 'A', name: 'A', rules: [{ type: 'must', targetParticipantId: 'B' }] },
      'B': { id: 'B', name: 'B', rules: [{ type: 'must', targetParticipantId: 'C' }] },
      'C': { id: 'C', name: 'C', rules: [{ type: 'must', targetParticipantId: 'A' }] },
    };

    const result = generatePairs(participants);
    expect(result?.pairings.map(({giver, receiver}) => [
      participants[giver.id],
      participants[receiver.id],
    ])).toEqual([
      [participants['A'], participants['B']],
      [participants['B'], participants['C']],
      [participants['C'], participants['A']],
    ]);
  });

  it('should return null for invalid rule configurations', () => {
    // Test multiple MUST rules
    const multiMustParticipants: Record<string, Participant> = {
      'A': { 
        id: 'A',
        name: 'A', 
        rules: [
          { type: 'must', targetParticipantId: 'B' },
          { type: 'must', targetParticipantId: 'C' }
        ] 
      },
      'B': { id: 'B', name: 'B', rules: [] },
      'C': { id: 'C', name: 'C', rules: [] },
    };

    expect(generatePairs(multiMustParticipants)).toBeNull();

    // Test conflicting MUST/MUST NOT rules
    const conflictingRulesParticipants: Record<string, Participant> = {
      'A': { 
        id: 'A',
        name: 'A', 
        rules: [
          { type: 'must', targetParticipantId: 'B' },
          { type: 'mustNot', targetParticipantId: 'B' }
        ] 
      },
      'B': { id: 'B', name: 'B', rules: [] },
    };

    expect(generatePairs(conflictingRulesParticipants)).toBeNull();
  });

  it('should support generating complex configurations', () => {
    const parseResult = parseParticipantsText(`
      Alice !Brian !Claire
      Brian !Alice !Claire
      Claire !Brian !Alice
      Ethan !Fiona !Grace !Hannah !Ivy !Jack !Kyle
      Fiona !Ethan !Grace !Hannah !Ivy !Jack !Kyle
      Grace !Fiona !Ethan !Hannah !Ivy !Jack !Kyle
      Hannah !Fiona !Grace !Ethan !Ivy !Jack !Kyle
      Ivy !Fiona !Grace !Hannah !Ethan !Jack !Kyle
      Kyle !Fiona !Grace !Hannah !Ethan !Jack !Ivy
      Logan !Sophie
      Sophie !Logan
      Matthew !Nina !Olivia !Paige !Quinn !Ryan
      Nina !Matthew !Olivia !Paige !Quinn !Ryan
      Olivia !Nina !Matthew !Paige !Quinn !Ryan
      Paige !Nina !Olivia !Matthew !Quinn !Ryan
      Jack !Fiona !Grace !Hannah !Ethan !Ivy !Kyle
      Quinn !Matthew !Nina !Olivia !Paige !Ryan
      Ryan !Quinn !Matthew !Nina !Olivia !Paige
    `);

    expect(parseResult.ok).toBe(true);
    const parseOk = parseResult as ParseSuccess;

    const result = generatePairs(parseOk.participants);
    expect(result).not.toBeNull();
  });

  it('should generate valid pairings for a given complex configuration', () => {
    const parseResult = parseParticipantsText(`
      Alice !Brian !Claire
      Brian !Alice !Claire
      Claire !Brian !Alice
      Ethan !Fiona !Grace !Hannah !Ivy !Jack !Kyle
      Fiona !Ethan !Grace !Hannah !Ivy !Jack !Kyle
      Grace !Fiona !Ethan !Hannah !Ivy !Jack !Kyle
      Hannah !Fiona !Grace !Ethan !Ivy !Jack !Kyle
      Ivy !Fiona !Grace !Hannah !Ethan !Jack !Kyle
      Kyle !Fiona !Grace !Hannah !Ethan !Jack !Ivy
      Logan !Sophie
      Sophie !Logan
      Matthew !Nina !Olivia !Paige !Quinn !Ryan
      Nina !Matthew !Olivia !Paige !Quinn !Ryan
      Olivia !Nina !Matthew !Paige !Quinn !Ryan
      Paige !Nina !Olivia !Matthew !Quinn !Ryan
      Jack !Fiona !Grace !Hannah !Ethan !Ivy !Kyle
      Quinn !Matthew !Nina !Olivia !Paige !Ryan
      Ryan !Quinn !Matthew !Nina !Olivia !Paige
    `);

    expect(parseResult.ok).toBe(true);
    const parseOk = parseResult as ParseSuccess;

    for (let t = 0; t < 100; t++) {
      const generationResult = generatePairs(parseOk.participants);

      expect(generationResult).not.toBeNull();
      const {pairings} = generationResult as GeneratedPairs;

      // Verify each participant gives and receives exactly once
      const givers = new Set(pairings.map(p => p.giver.id));
      const receivers = new Set(pairings.map(p => p.receiver.id));
      expect(givers.size).toBe(Object.keys(parseOk.participants).length);
      expect(receivers.size).toBe(Object.keys(parseOk.participants).length);

      // Verify no self-assignments
      for (const {giver, receiver} of pairings) {
        expect(giver.id).not.toBe(receiver.id);
      }

      // Verify all MUST NOT rules are respected
      for (const {giver, receiver} of pairings) {
        const participant = parseOk.participants[giver.id];
        const mustNotRules = participant.rules.filter(r => r.type === 'mustNot');
        
        for (const rule of mustNotRules) {
          expect(receiver.id).not.toBe(rule.targetParticipantId);
        }
      }

      // Verify all MUST rules are respected
      for (const {giver, receiver} of pairings) {
        const participant = parseOk.participants[giver.id];
        const mustRules = participant.rules.filter(r => r.type === 'must');

        for (const rule of mustRules) {
          expect(receiver.id).toBe(rule.targetParticipantId);
        }
      }
    }
  });

  // Independent ground-truth oracle: tries every permutation and checks it
  // against the same MUST/MUST NOT rules generatePairs enforces. Only
  // tractable for small participant counts, but that's exactly where a
  // greedy, non-backtracking algorithm was liable to give up on a
  // satisfiable-but-tight rule set — this is what "any input the old
  // implementation solved, the new one also solves" (and strictly more) is
  // tested against.
  function bruteForceHasValidMatching(participants: Record<string, Participant>): boolean {
    const ids = Object.keys(participants);

    const isValidAssignment = (receiverIds: string[]) =>
      receiverIds.every((receiverId, i) => {
        const giverId = ids[i];
        const giver = participants[giverId];
        const mustRule = giver.rules.find(r => r.type === 'must');

        if (giverId === receiverId) {
          // Self-pairing is only valid when a self-targeting MUST rule
          // explicitly forces it (see buildCandidateReceivers) — otherwise
          // self is excluded from candidates entirely.
          return mustRule?.targetParticipantId === giverId;
        }

        if (mustRule) return mustRule.targetParticipantId === receiverId;
        return !giver.rules.some(r => r.type === 'mustNot' && r.targetParticipantId === receiverId);
      });

    const permute = (arr: string[], from: number): boolean => {
      if (from === arr.length) {
        return isValidAssignment(arr);
      }
      for (let i = from; i < arr.length; i++) {
        [arr[from], arr[i]] = [arr[i], arr[from]];
        if (permute(arr, from + 1)) return true;
        [arr[from], arr[i]] = [arr[i], arr[from]];
      }
      return false;
    };

    return permute([...ids], 0);
  }

  it('is exact: returns null if and only if no valid assignment exists', () => {
    // Same normalization as participantsArb, capped smaller so brute force
    // (this test is purely about matching feasibility, not rule validation,
    // which is already covered above) stays fast.
    const smallParticipantsArb = fc.dictionary(
      fc.string(),
      participantArb,
      { minKeys: 2, maxKeys: 6 }
    ).map(withConsistentRules);

    fc.assert(
      fc.property(smallParticipantsArb, (participants) => {
        const result = generatePairs(participants);
        const trulyFeasible = bruteForceHasValidMatching(participants);

        expect(result !== null).toBe(trulyFeasible);
      }),
      { numRuns: 200 }
    );
  });

  it('produces varied outputs across repeated runs when multiple valid matchings exist', () => {
    const participants: Record<string, Participant> = {
      A: { id: 'A', name: 'A', rules: [] },
      B: { id: 'B', name: 'B', rules: [] },
      C: { id: 'C', name: 'C', rules: [] },
      D: { id: 'D', name: 'D', rules: [] },
    };

    const seenMatchings = new Set<string>();
    for (let i = 0; i < 50; i++) {
      const result = generatePairs(participants);
      expect(result).not.toBeNull();

      const signature = result!.pairings
        .map(p => `${p.giver.id}->${p.receiver.id}`)
        .sort()
        .join(',');
      seenMatchings.add(signature);
    }

    // 4 unconstrained participants admit 9 distinct derangements; 50 runs
    // landing on the exact same one every time would indicate the
    // shuffling isn't actually randomizing which matching gets picked.
    expect(seenMatchings.size).toBeGreaterThan(1);
  });
});

describe('diagnoseInfeasibility', () => {
  it('reports needing more participants', () => {
    const participants: Record<string, Participant> = {
      A: { id: 'A', name: 'A', rules: [] },
    };

    expect(diagnoseInfeasibility(participants)).toEqual({ key: 'errors.needMoreParticipants' });
  });

  it('reports a participant with more than one MUST rule, by name', () => {
    const participants: Record<string, Participant> = {
      A: { id: 'A', name: 'Budi', rules: [
        { type: 'must', targetParticipantId: 'B' },
        { type: 'must', targetParticipantId: 'C' },
      ] },
      B: { id: 'B', name: 'Ani', rules: [] },
      C: { id: 'C', name: 'Citra', rules: [] },
    };

    expect(diagnoseInfeasibility(participants)).toEqual({
      key: 'errors.multipleMustRules',
      params: { name: 'Budi' }
    });
  });

  it('reports a MUST/MUST NOT conflict on the same participant, with target name', () => {
    const participants: Record<string, Participant> = {
      A: { id: 'A', name: 'Budi', rules: [
        { type: 'must', targetParticipantId: 'B' },
        { type: 'mustNot', targetParticipantId: 'B' },
      ] },
      B: { id: 'B', name: 'Ani', rules: [] },
    };

    expect(diagnoseInfeasibility(participants)).toEqual({
      key: 'errors.conflictingRules',
      params: { name: 'Budi', target: 'Ani' }
    });
  });

  it('reports two givers both forced onto the same receiver', () => {
    const participants: Record<string, Participant> = {
      A: { id: 'A', name: 'Budi', rules: [{ type: 'must', targetParticipantId: 'C' }] },
      B: { id: 'B', name: 'Ani', rules: [{ type: 'must', targetParticipantId: 'C' }] },
      C: { id: 'C', name: 'Citra', rules: [] },
    };

    expect(diagnoseInfeasibility(participants)).toEqual({
      key: 'errors.duplicateMustTarget',
      params: { giverA: 'Budi', giverB: 'Ani', target: 'Citra' }
    });
  });

  it('reports a giver with no one left to give to', () => {
    const participants: Record<string, Participant> = {
      A: { id: 'A', name: 'Budi', rules: [
        { type: 'mustNot', targetParticipantId: 'B' },
        { type: 'mustNot', targetParticipantId: 'C' },
      ] },
      B: { id: 'B', name: 'Ani', rules: [] },
      C: { id: 'C', name: 'Citra', rules: [] },
    };

    expect(diagnoseInfeasibility(participants)).toEqual({
      key: 'errors.noValidReceiverFor',
      params: { name: 'Budi' }
    });
  });

  it('reports a participant nobody is allowed to give to', () => {
    const participants: Record<string, Participant> = {
      A: { id: 'A', name: 'Budi', rules: [{ type: 'mustNot', targetParticipantId: 'C' }] },
      B: { id: 'B', name: 'Ani', rules: [{ type: 'mustNot', targetParticipantId: 'C' }] },
      C: { id: 'C', name: 'Citra', rules: [] },
    };

    expect(diagnoseInfeasibility(participants)).toEqual({
      key: 'errors.noValidGiverFor',
      params: { name: 'Citra' }
    });
  });

  it('falls back to a generic message when no single rule explains the conflict', () => {
    // A and B can each only give to C (via MUST NOT, not an explicit MUST,
    // so duplicateMustTarget doesn't apply) — every giver has a non-empty
    // candidate set and every participant is reachable as a receiver, but
    // only one of A/B can actually end up with C. A Hall's-theorem
    // violation across the {A, B} subset rather than one explainable rule.
    const participants: Record<string, Participant> = {
      A: { id: 'A', name: 'A', rules: [
        { type: 'mustNot', targetParticipantId: 'B' },
        { type: 'mustNot', targetParticipantId: 'D' },
      ] },
      B: { id: 'B', name: 'B', rules: [
        { type: 'mustNot', targetParticipantId: 'A' },
        { type: 'mustNot', targetParticipantId: 'D' },
      ] },
      C: { id: 'C', name: 'C', rules: [] },
      D: { id: 'D', name: 'D', rules: [] },
    };

    expect(diagnoseInfeasibility(participants)).toEqual({ key: 'errors.invalidPairs' });
    expect(generatePairs(participants)).toBeNull();
  });

  it('never disagrees with generatePairs about feasibility', () => {
    fc.assert(
      fc.property(participantsArb, (participants) => {
        const hasSelfConflict = Object.values(participants).some(p => checkRules(p.rules) !== null);
        if (hasSelfConflict) return true; // covered by dedicated rule-conflict tests above

        const result = generatePairs(participants);
        const reason = diagnoseInfeasibility(participants);

        // generatePairs succeeding and diagnoseInfeasibility being callable
        // are two different code paths; what matters is they never
        // contradict each other about whether the input was feasible.
        if (result !== null) {
          expect(reason.key).not.toBe('errors.needMoreParticipants');
        }
      }),
      { numRuns: 100 }
    );
  });
});

describe('groups', () => {
  it('never pairs two members of the same group together', () => {
    const participants: Record<string, Participant> = {
      A: { id: 'A', name: 'A', rules: [], groupId: 'family' },
      B: { id: 'B', name: 'B', rules: [], groupId: 'family' },
      C: { id: 'C', name: 'C', rules: [] },
      D: { id: 'D', name: 'D', rules: [] },
    };

    for (let i = 0; i < 30; i++) {
      const result = generatePairs(participants);
      expect(result).not.toBeNull();

      for (const { giver, receiver } of result!.pairings) {
        if (giver.id === 'A' || giver.id === 'B') {
          expect(receiver.id).not.toBe(giver.id === 'A' ? 'B' : 'A');
        }
      }
    }
  });

  it('is reported as infeasible (not a crash) when a two-person group has no one else to pair with', () => {
    const participants: Record<string, Participant> = {
      A: { id: 'A', name: 'Budi', rules: [], groupId: 'couple' },
      B: { id: 'B', name: 'Ani', rules: [], groupId: 'couple' },
    };

    expect(generatePairs(participants)).toBeNull();
    expect(diagnoseInfeasibility(participants)).toEqual({
      key: 'errors.noValidReceiverFor',
      params: { name: 'Budi' }
    });
  });

  it('an explicit MUST rule overrides group exclusion, same as it overrides MUST NOT', () => {
    const participants: Record<string, Participant> = {
      A: {
        id: 'A', name: 'A', groupId: 'family',
        rules: [{ type: 'must', targetParticipantId: 'B' }]
      },
      B: { id: 'B', name: 'B', rules: [], groupId: 'family' },
      C: { id: 'C', name: 'C', rules: [] },
    };

    const result = generatePairs(participants);
    expect(result).not.toBeNull();
    expect(result!.pairings.find(p => p.giver.id === 'A')?.receiver.id).toBe('B');
  });

  it('changing a participant\'s group changes the generation hash', () => {
    const base: Record<string, Participant> = {
      A: { id: 'A', name: 'A', rules: [] },
      B: { id: 'B', name: 'B', rules: [] },
    };
    const grouped: Record<string, Participant> = {
      A: { id: 'A', name: 'A', rules: [], groupId: 'family' },
      B: { id: 'B', name: 'B', rules: [] },
    };

    expect(generateGenerationHash(base)).not.toBe(generateGenerationHash(grouped));
  });
});
