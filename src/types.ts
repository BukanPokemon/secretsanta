// types.ts

export interface Rule {
  type: 'must' | 'mustNot'
  targetParticipantId: string
}

export interface Participant {
  id: string
  name: string
  hint?: string // Gift Hint
  rules: Rule[]

  // New fields for CSV / shipping info
  address?: string
  phone?: string
  notes?: string
  wishlistUrl?: string

  // Members sharing the same groupId (e.g. a couple or a family) never
  // draw each other — see buildCandidateReceivers in generatePairs.ts.
  groupId?: string
}

export type Participants = Record<string, Participant>

// New type for encrypted data
export interface ReceiverData {
  name: string
  hint?: string
  address?: string
  phone?: string
  notes?: string
  wishlistUrl?: string
}

export type Theme = 'christmas' | 'party' | 'newyear'

// Event-level metadata, separate from the per-participant data above. Part
// of the encrypted pairing link payload (see links.ts), so `theme` here
// also determines how the recipient's reveal page (Pairing.tsx) is styled —
// not just the organizer's own browser.
export interface EventMetadata {
  eventName?: string
  eventDate?: string // yyyy-mm-dd, from <input type="date">
  exchangeDeadline?: string // yyyy-mm-dd
  budgetMin?: number
  budgetMax?: number
  theme?: Theme
}

// Optional: pair types
export interface Pair {
  giverId: string
  receiverId: string
}
