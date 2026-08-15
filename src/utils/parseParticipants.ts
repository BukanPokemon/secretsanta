import { Participant, Rule } from '../types';
import { checkRules } from './generatePairs';

export interface ParseSuccess {
  ok: true;
  participants: Record<string, Participant>;
}

export interface ParseError {
  ok: false;
  line: number;
  key: string;
  values?: Record<string, string>;
}

export type ParseResult = ParseSuccess | ParseError;

export function formatParticipantText(participants: Record<string, Participant>): string {
  return Object.values(participants).map(participant => {
    const mustRules = participant.rules
      .filter(r => r.type === 'must')
      .map(r => `=${participants[r.targetParticipantId]?.name ?? ''}`);

    const mustNotRules = participant.rules
      .filter(r => r.type === 'mustNot')
      .map(r => `!${participants[r.targetParticipantId]?.name ?? ''}`);

    const groupPart = participant.groupId
      ? [`#${participant.groupId}`]
      : [];

    const hintPart = participant.hint
      ? [`(${participant.hint})`]
      : [];

    // wishlistUrl isn't representable here: URLs routinely contain '=' and
    // '!', which this format uses as rule delimiters. It stays editable
    // only through the form view / CSV import.
    return `${[participant.name, ...hintPart, ...mustRules, ...mustNotRules, ...groupPart].join(' ')}\n`;
  }).join('');
}

// Characters that end the name/hint portion of a line and start the
// rules/group section. '#' must stay out of names for the same reason '!'
// and '=' already are.
const EXTRAS_START = /[!=#(]/;

export function parseParticipantsText(input: string, existingParticipants?: Record<string, Participant>): ParseResult {
  const lines = input.split('\n').map(line => line.trim());
  const result: Record<string, Participant> = {};
  const nameToId: Record<string, string> = {};

  const parsedLines: {
    line: number,
    name: string,
    hint?: string,
    extra: string[],
  }[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === '') continue;

    let splitIndex = EXTRAS_START.exec(line)?.index;

    const name = typeof splitIndex === 'number'
      ? line.slice(0, splitIndex).trim()
      : line.trim();

    let hint: string | undefined;
    if (typeof splitIndex === 'number' && line[splitIndex] === '(') {
      let depth = 1;
      let j = splitIndex + 1;

      while (depth > 0 && j < line.length) {
        if (line[j] === '(') depth++;
        if (line[j] === ')') depth--;
        j++;
      }

      hint = line.slice(splitIndex + 1, j - 1);
      splitIndex = j;
    }

    const remainingPart = line.slice(splitIndex);
    const parts = remainingPart
      .trim()
      .split(/([!=#])/)
      .map(part => part.trim());

    if (!name) {
      return { ok: false, line: i + 1, key: 'errors.emptyName' };
    }

    parsedLines.push({ 
      line: i + 1, 
      name: name.trim(), 
      hint: hint?.trim(),
      extra: parts.filter(Boolean)
    });
  }

  // First pass: create participants and build name-to-id mapping
  for (const {line, name, hint} of parsedLines) {
    if (nameToId[name]) {
      return { 
        ok: false, 
        line,
        key: 'errors.duplicateName',
        values: { name } 
      };
    }

    const id = existingParticipants?.[name]?.id ?? crypto.randomUUID();
    nameToId[name] = id;
    result[id] = { id, name, hint, rules: [] };
  }

  // Second pass: process rules and group tags
  for (const {line, name, extra} of parsedLines) {
    const id = nameToId[name];
    const rules: Rule[] = [];
    let groupId: string | undefined;

    for (let j = 0; j + 1 < extra.length; j += 2) {
      const sigil = extra[j];
      const value = extra[j + 1];
      if (!value) {
        continue;
      }

      if (sigil === '#') {
        groupId = value;
        continue;
      }

      const targetId = nameToId[value];
      if (!targetId) {
        return {
          ok: false,
          line,
          key: 'errors.unknownParticipant',
          values: { name: value }
        };
      }

      rules.push({
        type: sigil === '=' ? 'must' : 'mustNot',
        targetParticipantId: targetId
      });
    }

    const validationError = checkRules(rules);
    if (validationError) {
      return {
        ok: false,
        line,
        key: validationError
      };
    }

    result[id].rules = rules;
    result[id].groupId = groupId;
  }

  return { ok: true, participants: result };
} 
