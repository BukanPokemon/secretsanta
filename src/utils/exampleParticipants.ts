import { Participant } from "../types";
import { parseParticipantsText } from "./parseParticipants";

// Six fake participants showcasing a hint, a MUST NOT rule, a MUST rule,
// and a group exclusion, so "Try an example" also doubles as a tour of
// what the rules can do. Verified by example-participants.test.ts to
// actually produce a valid set of pairings.
const EXAMPLE_TEXT = `
Budi (suka membaca buku)
Ani (suka cokelat) !Budi
Citra (suka berkebun) #Keluarga
Dedi (suka kopi) #Keluarga
Eka (suka musik) =Budi
Fajar (suka olahraga)
`;

export function buildExampleParticipants(): Record<string, Participant> {
  const result = parseParticipantsText(EXAMPLE_TEXT);
  if (!result.ok) {
    // EXAMPLE_TEXT is a fixed constant verified by tests — this would mean
    // the constant itself is broken, not a runtime/user-input error.
    throw new Error(`Invalid EXAMPLE_TEXT: ${result.key}`);
  }
  return result.participants;
}
