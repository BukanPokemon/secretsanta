import { Participant, EventMetadata } from "../types";
import { GeneratedPairs } from "./generatePairs";

// Clearing browser data (or switching devices) wipes localStorage, which is
// the only place an event's data lives — this is the escape hatch so an
// organizer can re-send links after that happens.
export interface EventBackup {
  version: 1;
  participants: Record<string, Participant>;
  assignments: GeneratedPairs | null;
  instructions: string;
  eventMetadata: EventMetadata;
}

export function downloadEventBackup(backup: EventBackup): void {
  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "tukar-kado-event.json";
  a.click();

  URL.revokeObjectURL(url);
}

export function parseEventBackup(json: string): EventBackup {
  const data = JSON.parse(json);

  if (!data || typeof data !== "object" || typeof data.participants !== "object") {
    throw new Error("Invalid event backup file");
  }

  return {
    version: 1,
    participants: data.participants ?? {},
    assignments: data.assignments ?? null,
    instructions: typeof data.instructions === "string" ? data.instructions : "",
    eventMetadata: data.eventMetadata ?? {},
  };
}
