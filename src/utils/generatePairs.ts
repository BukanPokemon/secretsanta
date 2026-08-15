import { Participant, Rule } from "../types";
import { generateEventKey } from "./crypto";

export function checkRules(rules: Rule[]): string | null {
  const mustRules = rules.filter(r => r.type === 'must');
  if (mustRules.length > 1) {
    return 'errors.multipleMustRules';
  } else if (mustRules.length === 1) {
    if (rules.some(r => r.type === 'mustNot' && r.targetParticipantId === mustRules[0].targetParticipantId)) {
      return 'errors.conflictingRules';
    }
  }

  return null;
}

export function generateGenerationHash(participants: Record<string, Participant>): string {
  return JSON.stringify(Object.values(participants).map(p => ({rules: p.rules, hint: p.hint, groupId: p.groupId})));
}

export type GeneratedPairs = {
  hash: string;
  // Random per-event key used to encrypt each giver's assignment link.
  encryptionKey: string;
  pairings: {
    giver: {id: string; name: string};
    receiver: {id: string; name: string};
  }[];
};

// Each participant is both a potential giver and a potential receiver, so
// finding a valid set of pairings is a bipartite perfect-matching problem:
// givers on one side, receivers on the other, both drawn from the same
// participant set, with self-pairing and MUST/MUST NOT rules cutting edges.
function buildCandidateReceivers(participants: Record<string, Participant>): Map<string, Set<string>> {
  const participantIds = Object.keys(participants);
  const candidateReceivers = new Map<string, Set<string>>();

  for (const giverId of participantIds) {
    const giver = participants[giverId];

    // Start with all participants except self as potential receivers
    const candidates = new Set(participantIds.filter(id => id !== giverId));

    // Handle MUST rules
    const mustRule = giver.rules.find(r => r.type === 'must');
    if (mustRule) {
      // If there's a MUST rule, this is the only possible receiver —
      // takes priority over MUST NOT rules and group exclusion alike.
      candidates.clear();
      candidates.add(mustRule.targetParticipantId);
    } else {
      // Remove MUST NOT targets from candidates
      giver.rules
        .filter(r => r.type === 'mustNot')
        .forEach(r => candidates.delete(r.targetParticipantId));

      // Members of the same group (e.g. a couple or a family) never draw
      // each other.
      if (giver.groupId) {
        for (const otherId of participantIds) {
          if (otherId !== giverId && participants[otherId].groupId === giver.groupId) {
            candidates.delete(otherId);
          }
        }
      }
    }

    candidateReceivers.set(giverId, candidates);
  }

  return candidateReceivers;
}

function shuffled<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Exact maximum bipartite matching via DFS augmenting paths (Kuhn's
// algorithm). Unlike a greedy most-constrained-first pass, this is
// guaranteed to find a perfect matching whenever one exists — a
// satisfiable-but-tight rule set can no longer spuriously fail. Candidate
// and processing order are shuffled so which matching gets picked (when
// several are valid) varies between calls.
function findPerfectMatching(
  participantIds: string[],
  candidateReceivers: Map<string, Set<string>>
): Map<string, string> | null {
  const candidatesByGiver = new Map<string, string[]>();
  for (const giverId of participantIds) {
    candidatesByGiver.set(giverId, shuffled(Array.from(candidateReceivers.get(giverId)!)));
  }

  const receiverToGiver = new Map<string, string>();

  const tryAssign = (giverId: string, visited: Set<string>): boolean => {
    for (const receiverId of candidatesByGiver.get(giverId)!) {
      if (visited.has(receiverId)) continue;
      visited.add(receiverId);

      const incumbentGiver = receiverToGiver.get(receiverId);
      if (incumbentGiver === undefined || tryAssign(incumbentGiver, visited)) {
        receiverToGiver.set(receiverId, giverId);
        return true;
      }
    }
    return false;
  };

  for (const giverId of shuffled(participantIds)) {
    if (!tryAssign(giverId, new Set())) {
      return null;
    }
  }

  const giverToReceiver = new Map<string, string>();
  for (const [receiverId, giverId] of receiverToGiver) {
    giverToReceiver.set(giverId, receiverId);
  }
  return giverToReceiver;
}

export function generatePairs(participants: Record<string, Participant>): GeneratedPairs | null {
  const participantIds = Object.keys(participants);

  if (participantIds.length < 2) {
    return null;
  }

  // Validate rules
  for (const participant of Object.values(participants)) {
    if (checkRules(participant.rules)) {
      return null;
    }
  }

  const candidateReceivers = buildCandidateReceivers(participants);
  const matching = findPerfectMatching(participantIds, candidateReceivers);
  if (!matching) {
    return null;
  }

  // Output order follows participant insertion order, independent of the
  // order the matcher happened to resolve receivers in.
  const pairings = participantIds.map(giverId => {
    const receiverId = matching.get(giverId)!;
    return {
      giver: { id: giverId, name: participants[giverId].name },
      receiver: { id: receiverId, name: participants[receiverId].name }
    };
  });

  return {
    hash: generateGenerationHash(participants),
    encryptionKey: generateEventKey(),
    pairings
  };
}

export type InfeasibilityReason =
  | { key: 'errors.needMoreParticipants' }
  | { key: 'errors.multipleMustRules'; params: { name: string } }
  | { key: 'errors.conflictingRules'; params: { name: string; target: string } }
  | { key: 'errors.duplicateMustTarget'; params: { giverA: string; giverB: string; target: string } }
  | { key: 'errors.noValidReceiverFor'; params: { name: string } }
  | { key: 'errors.noValidGiverFor'; params: { name: string } }
  | { key: 'errors.invalidPairs' };

// Explains why generatePairs returned null, for surfacing a specific
// message instead of a generic "couldn't generate" error. Only called on
// the failure path, so it doesn't need to be as fast as generatePairs
// itself — it re-derives candidate sets and checks the common, explainable
// conflicts before falling back to a generic message.
export function diagnoseInfeasibility(participants: Record<string, Participant>): InfeasibilityReason {
  const participantIds = Object.keys(participants);

  if (participantIds.length < 2) {
    return { key: 'errors.needMoreParticipants' };
  }

  for (const participant of Object.values(participants)) {
    const errorKey = checkRules(participant.rules);
    if (errorKey === 'errors.multipleMustRules') {
      return { key: errorKey, params: { name: participant.name } };
    }
    if (errorKey === 'errors.conflictingRules') {
      const mustRule = participant.rules.find(r => r.type === 'must')!;
      return {
        key: errorKey,
        params: {
          name: participant.name,
          target: participants[mustRule.targetParticipantId]?.name ?? ''
        }
      };
    }
  }

  // Two givers both forced onto the same receiver by their own MUST rules.
  const giverIdByMustTarget = new Map<string, string>();
  for (const giverId of participantIds) {
    const mustRule = participants[giverId].rules.find(r => r.type === 'must');
    if (!mustRule) continue;

    const otherGiverId = giverIdByMustTarget.get(mustRule.targetParticipantId);
    if (otherGiverId) {
      return {
        key: 'errors.duplicateMustTarget',
        params: {
          giverA: participants[otherGiverId].name,
          giverB: participants[giverId].name,
          target: participants[mustRule.targetParticipantId]?.name ?? ''
        }
      };
    }
    giverIdByMustTarget.set(mustRule.targetParticipantId, giverId);
  }

  const candidateReceivers = buildCandidateReceivers(participants);

  // A giver with nobody left to give to.
  for (const giverId of participantIds) {
    if (candidateReceivers.get(giverId)!.size === 0) {
      return { key: 'errors.noValidReceiverFor', params: { name: participants[giverId].name } };
    }
  }

  // A participant nobody is allowed to give to.
  const reachableAsReceiver = new Set<string>();
  for (const candidates of candidateReceivers.values()) {
    for (const receiverId of candidates) {
      reachableAsReceiver.add(receiverId);
    }
  }
  for (const participantId of participantIds) {
    if (!reachableAsReceiver.has(participantId)) {
      return { key: 'errors.noValidGiverFor', params: { name: participants[participantId].name } };
    }
  }

  // No single rule explains it — a larger subset of participants is
  // mutually over-constrained (Hall's theorem violation across a group).
  return { key: 'errors.invalidPairs' };
} 