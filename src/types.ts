// types.ts

export interface Rule {
  type: 'must' | 'mustNot';
  targetParticipantId: string;
}

export interface Participant {
  id: string;
  name: string;
  hint?: string;      // Gift Hint
  rules: Rule[];

  // New fields for CSV / shipping info
  address?: string;
  phone?: string;
  notes?: string;
  wishlistUrl?: string;

  // Members sharing the same groupId (e.g. a couple or a family) never
  // draw each other — see buildCandidateReceivers in generatePairs.ts.
  groupId?: string;
}

export type Participants = Record<string, Participant>;

// New type for encrypted data
export interface ReceiverData {
  name: string;
  hint?: string;
  address?: string;
  phone?: string;
  notes?: string;
  wishlistUrl?: string;
}

// Event-level metadata, separate from the per-participant data above.
export interface EventMetadata {
  eventName?: string;
  eventDate?: string;        // yyyy-mm-dd, from <input type="date">
  exchangeDeadline?: string; // yyyy-mm-dd
  budgetMin?: number;
  budgetMax?: number;
}

// Optional: pair types
export interface Pair {
  giverId: string;
  receiverId: string;
}
