// links.ts
import { compressToUint8Array, decompressFromUint8Array } from "lz-string";
import { encryptWithKey, decryptWithKey } from "./crypto";
import { bytesToBase64Url, base64UrlToBytes } from "./base64url";
import { ReceiverData, EventMetadata } from "../types";

export interface AssignmentPayload {
  from: string;
  to: ReceiverData;
  info?: string;
  event?: EventMetadata;
}

function isEventMetadataEmpty(eventMetadata: EventMetadata): boolean {
  return Object.values(eventMetadata).every(value => value === undefined || value === "");
}

/**
 * Compress, encrypt, and pack a giver's assignment payload — together with
 * the event key needed to decrypt it — into the string that goes after the
 * `#` in an assignment link. Fragments are never sent to a server, so
 * nothing identifying ends up in access logs, Referer headers, or the
 * requests link-preview bots (WhatsApp, Telegram, Slack, ...) make when they
 * fetch a shared URL.
 */
export async function encodeAssignmentFragment(
  eventKey: string,
  payload: AssignmentPayload
): Promise<string> {
  const compressed = compressToUint8Array(JSON.stringify(payload));
  const encrypted = await encryptWithKey(compressed, eventKey);

  const keyBytes = base64UrlToBytes(eventKey);
  const combined = new Uint8Array(keyBytes.length + encrypted.length);
  combined.set(keyBytes);
  combined.set(encrypted, keyBytes.length);

  return bytesToBase64Url(combined);
}

/**
 * Generate the unique Secret Santa assignment link for a giver.
 */
export async function generateAssignmentLink(
  eventKey: string,
  giver: string,
  receiver: ReceiverData,
  instructions?: string,
  eventMetadata?: EventMetadata
) {
  // `/pairing` is a fixed top-level route (see src/index.tsx), not nested
  // under the current page — deriving this from window.location.pathname
  // (as before Phase 9's /id//en/ locale routes existed) would produce
  // .../id/pairing when generated from the Indonesian home page, which
  // matches no route at all. BASE_URL already carries a trailing slash
  // (e.g. "/tukar-kado/"), so no separating slash is added before "pairing".
  const baseUrl = `${window.location.origin}${import.meta.env.BASE_URL}`;

  const payload: AssignmentPayload = { from: giver, to: receiver };
  if (instructions?.trim()) {
    payload.info = instructions.trim();
  }
  if (eventMetadata && !isEventMetadataEmpty(eventMetadata)) {
    payload.event = eventMetadata;
  }

  const fragment = await encodeAssignmentFragment(eventKey, payload);
  return `${baseUrl}pairing#${fragment}`;
}

const EVENT_KEY_BYTE_LENGTH = 32;

/**
 * Decode an assignment link's URL fragment (everything after the `#`,
 * without the `#` itself) back into the giver/receiver/instructions payload.
 */
export async function decryptAssignmentFragment(fragment: string): Promise<AssignmentPayload> {
  const combined = base64UrlToBytes(fragment);
  const keyBytes = combined.slice(0, EVENT_KEY_BYTE_LENGTH);
  const ivAndCiphertext = combined.slice(EVENT_KEY_BYTE_LENGTH);

  const eventKey = bytesToBase64Url(keyBytes);
  const decrypted = await decryptWithKey(ivAndCiphertext, eventKey);

  const json = decompressFromUint8Array(decrypted);
  if (json === null) {
    throw new Error("Failed to decompress pairing payload");
  }

  return JSON.parse(json) as AssignmentPayload;
}

/**
 * Generate CSV content from an array of [Giver, SecretSantaLink].
 * Does NOT include header; caller should provide it if needed.
 */
export function generateCSV(assignments: [string, string][]) {
  return assignments.map(([giver, link]) => `${giver}\t${link}`).join("\n");
}
