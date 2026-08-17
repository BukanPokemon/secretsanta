import { useState, useEffect } from "react";
import { X, Link, LinkBreak } from "@phosphor-icons/react";
import { Participant, Rule, ReceiverData } from '../types';
import { useTranslation } from 'react-i18next';
import { produce } from "immer";

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  participantId: string;
  participants: Record<string, Participant>;
  onChangeParticipants: (newParticipants: Record<string, Participant>) => void;
}

export function RulesModal({
  isOpen,
  onClose,
  participantId,
  participants,
  onChangeParticipants,
}: RulesModalProps) {
  const { t } = useTranslation();
  const participant = participants[participantId];

  const [localRules, setLocalRules] = useState<Rule[]>(participant.rules);
  const [localHint, setLocalHint] = useState<string>(participant.hint || '');
  const [localAddress, setLocalAddress] = useState<string>(participant.address || '');
  const [localPhone, setLocalPhone] = useState<string>(participant.phone || '');
  const [localNotes, setLocalNotes] = useState<string>(participant.notes || '');
  const [localWishlistUrl, setLocalWishlistUrl] = useState<string>(participant.wishlistUrl || '');
  const [localGroupId, setLocalGroupId] = useState<string>(participant.groupId || '');

  // Escape key closes modal
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  const addRule = (type: 'must' | 'mustNot') => setLocalRules([...localRules, { type, targetParticipantId: '' }]);
  const updateRule = (index: number, targetParticipantId: string) => {
    const newRules = [...localRules];
    newRules[index].targetParticipantId = targetParticipantId;
    setLocalRules(newRules);
  };
  const removeRule = (index: number) => setLocalRules(localRules.filter((_, i) => i !== index));

  const handleSave = () => {
    onChangeParticipants(produce(participants, draft => {
      draft[participantId].rules = localRules;
      draft[participantId].hint = localHint || undefined;
      draft[participantId].address = localAddress || undefined;
      draft[participantId].phone = localPhone || undefined;
      draft[participantId].notes = localNotes || undefined;
      draft[participantId].wishlistUrl = localWishlistUrl || undefined;
      draft[participantId].groupId = localGroupId || undefined;
    }));
    onClose();
  };

  const existingGroups = Array.from(new Set(
    Object.values(participants)
      .map(p => p.groupId)
      .filter((groupId): groupId is string => !!groupId)
  ));

  const hasMustRule = localRules.some(r => r.type === 'must');
  const hasMustNotRule = localRules.some(r => r.type === 'mustNot');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-xl w-full max-h-full overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">
          {t('rules.title', { name: participant.name })}
        </h2>

        <div className="space-y-4 mb-6">
          {/* Hint */}
          <div>
            <label htmlFor={`hint-${participantId}`} className="block text-sm font-medium text-gray-700 mb-1">{t('rules.hintLabel')}</label>
            <input
              id={`hint-${participantId}`}
              type="text"
              value={localHint}
              onChange={e => setLocalHint(e.target.value)}
              placeholder={t('rules.hintPlaceholder')}
              className="w-full p-2 border rounded"
            />
          </div>

          {/* Address */}
          <div>
            <label htmlFor={`address-${participantId}`} className="block text-sm font-medium text-gray-700 mb-1">{t('rules.addressLabel', 'Address')}</label>
            <input
              id={`address-${participantId}`}
              type="text"
              value={localAddress}
              onChange={e => setLocalAddress(e.target.value)}
              placeholder={t('rules.addressPlaceholder', 'Enter address (optional)')}
              className="w-full p-2 border rounded"
            />
          </div>

          {/* Phone */}
          <div>
            <label htmlFor={`phone-${participantId}`} className="block text-sm font-medium text-gray-700 mb-1">{t('rules.phoneLabel', 'Phone')}</label>
            <input
              id={`phone-${participantId}`}
              type="text"
              value={localPhone}
              onChange={e => setLocalPhone(e.target.value)}
              placeholder={t('rules.phonePlaceholder', 'Enter phone (optional)')}
              className="w-full p-2 border rounded"
            />
          </div>

          {/* Notes */}
          <div>
            <label htmlFor={`notes-${participantId}`} className="block text-sm font-medium text-gray-700 mb-1">{t('rules.notesLabel', 'Notes')}</label>
            <textarea
              id={`notes-${participantId}`}
              value={localNotes}
              onChange={e => setLocalNotes(e.target.value)}
              placeholder={t('rules.notesPlaceholder', 'Additional notes (optional)')}
              className="w-full p-2 border rounded"
            />
          </div>

          {/* Wishlist URL */}
          <div>
            <label htmlFor={`wishlist-${participantId}`} className="block text-sm font-medium text-gray-700 mb-1">{t('rules.wishlistLabel')}</label>
            <input
              id={`wishlist-${participantId}`}
              type="url"
              value={localWishlistUrl}
              onChange={e => setLocalWishlistUrl(e.target.value)}
              placeholder={t('rules.wishlistPlaceholder')}
              className="w-full p-2 border rounded"
            />
          </div>

          {/* Group */}
          <div>
            <label htmlFor={`group-${participantId}`} className="block text-sm font-medium text-gray-700 mb-1">{t('rules.groupLabel')}</label>
            <input
              id={`group-${participantId}`}
              type="text"
              value={localGroupId}
              onChange={e => setLocalGroupId(e.target.value)}
              placeholder={t('rules.groupPlaceholder')}
              className="w-full p-2 border rounded"
              list={`existing-groups-${participantId}`}
            />
            <datalist id={`existing-groups-${participantId}`}>
              {existingGroups.map(groupId => <option key={groupId} value={groupId} />)}
            </datalist>
          </div>
        </div>

        {/* Pairing rules */}
        <div className="space-y-4 mb-6">
          {localRules.map((rule, index) => (
            <div key={index} className="flex gap-2 items-center">
              <span>
                {rule.type === 'must' ? t('rules.mustBePairedWith') : t('rules.mustNotBePairedWith')}
              </span>
              <select
                value={rule.targetParticipantId}
                onChange={e => updateRule(index, e.target.value)}
                className="flex-1 p-2 border rounded"
                aria-label={rule.type === 'must' ? t('rules.mustBePairedWith') : t('rules.mustNotBePairedWith')}
              >
                <option value="">{t('rules.selectParticipant')}</option>
                {Object.values(participants)
                  .filter(p => p.id !== participantId)
                  .map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <button onClick={() => removeRule(index)} className="p-2 text-red-500 hover:text-red-700">
                <X size={20} weight="bold"/>
              </button>
            </div>
          ))}
        </div>

        {/* Add rule buttons */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => addRule('must')}
            disabled={hasMustNotRule}
            className={`flex-1 p-2 rounded flex items-center justify-center gap-2
              ${hasMustNotRule ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'} text-white`}
          >
            <Link size={20}/>
            {t('rules.addMustRule')}
          </button>
          <button
            onClick={() => addRule('mustNot')}
            disabled={hasMustRule}
            className={`flex-1 p-2 rounded flex items-center justify-center gap-2
              ${hasMustRule ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600'} text-white`}
          >
            <LinkBreak size={20}/>
            {t('rules.addMustNotRule')}
          </button>
        </div>

        {/* Save/Cancel */}
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:text-gray-800">
            {t('rules.cancel')}
          </button>
          <button onClick={handleSave} className="px-4 py-2 bg-green-700 text-white rounded hover:bg-green-800">
            {t('rules.saveRules')}
          </button>
        </div>
      </div>
    </div>
  );
}
