import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { encodeAssignmentFragment, decryptAssignmentFragment, AssignmentPayload } from './links';
import { generateEventKey, encryptText, decryptText } from './crypto';
import { ReceiverData } from '../types';

const receiverArb = fc.record({
  name: fc.string({ minLength: 1 }),
  hint: fc.option(fc.string(), { nil: undefined }),
  address: fc.option(fc.string(), { nil: undefined }),
  phone: fc.option(fc.string(), { nil: undefined }),
  notes: fc.option(fc.string(), { nil: undefined }),
});

describe('assignment fragment round-trip', () => {
  it('recovers giver, receiver, and instructions for arbitrary field combinations', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1 }),
        receiverArb,
        fc.option(fc.string(), { nil: undefined }),
        async (from, to, info) => {
          const key = generateEventKey();
          const payload: AssignmentPayload = { from, to };
          if (info?.trim()) payload.info = info.trim();

          const fragment = await encodeAssignmentFragment(key, payload);
          const decoded = await decryptAssignmentFragment(fragment);

          expect(decoded).toEqual(payload);
        }
      ),
      { numRuns: 30 }
    );
  });

  it('survives Unicode names, emoji, and addresses', async () => {
    const key = generateEventKey();
    const payload: AssignmentPayload = {
      from: 'Nguyễn Văn A 🎅',
      to: {
        name: '田中太郎',
        hint: 'Sesuatu yang manis 🍬',
        address: 'Jl. Merdeka No. 17, RT 03/RW 02, Jakarta 🏠',
        phone: '+62 812-3456-7890',
        notes: 'Alergi kacang ⚠️',
      },
      info: 'Budget: Rp100.000 — bawa 25 Desember 🎄',
    };

    const fragment = await encodeAssignmentFragment(key, payload);
    const decoded = await decryptAssignmentFragment(fragment);

    expect(decoded).toEqual(payload);
  });

  it('survives event metadata (name, dates, budget) in the payload', async () => {
    const key = generateEventKey();
    const payload: AssignmentPayload = {
      from: 'Budi',
      to: { name: 'Ani' },
      event: {
        eventName: 'Tukar Kado Kantor',
        eventDate: '2026-12-20',
        exchangeDeadline: '2026-12-24',
        budgetMin: 50000,
        budgetMax: 150000,
      },
    };

    const fragment = await encodeAssignmentFragment(key, payload);
    const decoded = await decryptAssignmentFragment(fragment);

    expect(decoded).toEqual(payload);
  });

  it('produces a different key and ciphertext for every event, even for the same payload', async () => {
    const payload: AssignmentPayload = { from: 'Budi', to: { name: 'Ani' } };

    const fragmentA = await encodeAssignmentFragment(generateEventKey(), payload);
    const fragmentB = await encodeAssignmentFragment(generateEventKey(), payload);

    expect(fragmentA).not.toBe(fragmentB);
  });

  it('fails to decode a corrupted fragment instead of returning wrong data', async () => {
    const key = generateEventKey();
    const fragment = await encodeAssignmentFragment(key, { from: 'Budi', to: { name: 'Ani' } });

    await expect(decryptAssignmentFragment(fragment.slice(0, -8))).rejects.toThrow();
  });
});

describe('legacy query-string links (v1)', () => {
  it('still decrypt with the old hardcoded key', async () => {
    // Mirrors how pre-Phase-2 links encoded the `to` query parameter.
    const receiver: ReceiverData = { name: 'Ani', hint: 'Buku' };
    const encryptedTo = await encryptText(JSON.stringify(receiver));
    const decrypted = JSON.parse(await decryptText(encryptedTo)) as ReceiverData;

    expect(decrypted).toEqual(receiver);
  });
});
