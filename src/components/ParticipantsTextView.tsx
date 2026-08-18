import { Participant } from '../types';
import { useState } from 'react';
import { parseParticipantsText, ParseError, formatParticipantText } from '../utils/parseParticipants';
import { ArrowsClockwise, Info, X } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';

interface ParticipantsTextViewProps {
  participants: Record<string, Participant>;
  onChangeParticipants: (newParticipants: Record<string, Participant>) => void;
  onGeneratePairs: () => void;
}

export function ParticipantsTextView({ participants, onChangeParticipants, onGeneratePairs }: ParticipantsTextViewProps) {
  const { t } = useTranslation();

  const [text, setText] = useState(() => formatParticipantText(participants));
  const [error, setError] = useState<ParseError | null>(null);
  const [isFormatHelpOpen, setIsFormatHelpOpen] = useState(false);

  const handleChange = (newText: string) => {
    setText(newText);

    const result = parseParticipantsText(newText, participants);
    if (result.ok) {
      setError(null);
      onChangeParticipants(result.participants);
    } else {
      setError(result);
    }
  };

  return (
    <div className="relative space-y-2">
      <button
        type="button"
        onClick={() => setIsFormatHelpOpen(true)}
        className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 hover:underline"
      >
        <Info size={14} weight="bold" />
        {t('participants.textFormatHelp')}
      </button>

      <textarea
        className={`block w-full h-48 p-2 font-mono text-sm border rounded text-nowrap ${
          error ? 'border-red-500' : ''
        }`}
        value={text}
        onChange={e => handleChange(e.target.value)}
        placeholder={t('participants.textViewPlaceholder')}
        aria-label={t('participants.textViewLabel')}
      />

      {error && (
        <div className="bg-red-100 text-red-700 text-sm p-2 rounded">
          {t('errors.line', { number: error.line })}: {t(error.key as any, error.values)}
        </div>
      )}

      <button
        type="button"
        onClick={onGeneratePairs}
        className="w-full bg-green-700 text-white p-2 rounded hover:bg-green-800 flex items-center justify-center gap-2"
      >
        <ArrowsClockwise size={20} weight="bold" />
        {t('participants.generatePairs')}
      </button>

      {isFormatHelpOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-full overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">{t('participants.textFormatModalTitle')}</h2>
              <button
                onClick={() => setIsFormatHelpOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-700"
                aria-label={t('links.close')}
              >
                <X size={20} weight="bold" />
              </button>
            </div>

            <ul className="space-y-2 text-sm text-gray-700 list-disc pl-4">
              {(t('participants.textFormatRules', { returnObjects: true }) as string[]).map((rule, i) => (
                <li key={i} dangerouslySetInnerHTML={{ __html: rule }} />
              ))}
            </ul>

            <p className="mt-4 pt-4 border-t text-sm text-gray-600" dangerouslySetInnerHTML={{ __html: t('participants.textFormatExample') }} />

            <button
              type="button"
              onClick={() => setIsFormatHelpOpen(false)}
              className="mt-6 w-full px-4 py-2 bg-green-700 text-white rounded hover:bg-green-800"
            >
              {t('links.close')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
