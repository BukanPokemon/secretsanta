import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { DownloadSimple, UploadSimple } from '@phosphor-icons/react';
import { EventMetadata } from '../types';
import { formatBudget } from '../utils/currency';
import { BUDGET_PRESETS } from '../config/site';

interface SettingsProps {
  instructions: string;
  onChangeInstructions: (instructions: string) => void;
  eventMetadata: EventMetadata;
  onChangeEventMetadata: (metadata: EventMetadata) => void;
  onExportEvent: () => void;
  onImportEvent: (file: File) => void;
}

export function Settings({
  instructions,
  onChangeInstructions,
  eventMetadata,
  onChangeEventMetadata,
  onExportEvent,
  onImportEvent,
}: SettingsProps) {
  const { t, i18n } = useTranslation();
  const importInputRef = useRef<HTMLInputElement>(null);

  const updateField = <K extends keyof EventMetadata>(key: K, value: EventMetadata[K]) => {
    onChangeEventMetadata({ ...eventMetadata, [key]: value });
  };

  const handleImportChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onImportEvent(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-4">
      <div className="p-4 bg-gray-50 rounded-lg space-y-4">
        <div>
          <label htmlFor="settings-event-name" className="block text-sm font-medium text-gray-700 mb-1">{t('settings.eventName')}</label>
          <input
            id="settings-event-name"
            type="text"
            value={eventMetadata.eventName ?? ''}
            onChange={e => updateField('eventName', e.target.value || undefined)}
            placeholder={t('settings.eventNamePlaceholder')}
            className="w-full p-2 border rounded"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="settings-event-date" className="block text-sm font-medium text-gray-700 mb-1">{t('settings.eventDate')}</label>
            <input
              id="settings-event-date"
              type="date"
              value={eventMetadata.eventDate ?? ''}
              onChange={e => updateField('eventDate', e.target.value || undefined)}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label htmlFor="settings-deadline" className="block text-sm font-medium text-gray-700 mb-1">{t('settings.exchangeDeadline')}</label>
            <input
              id="settings-deadline"
              type="date"
              value={eventMetadata.exchangeDeadline ?? ''}
              onChange={e => updateField('exchangeDeadline', e.target.value || undefined)}
              className="w-full p-2 border rounded"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('settings.budgetRange')}</label>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              min={0}
              value={eventMetadata.budgetMin ?? ''}
              onChange={e => updateField('budgetMin', e.target.value === '' ? undefined : Number(e.target.value))}
              placeholder={t('settings.budgetMinPlaceholder')}
              aria-label={t('settings.budgetMinPlaceholder')}
              className="w-full p-2 border rounded"
            />
            <input
              type="number"
              min={0}
              value={eventMetadata.budgetMax ?? ''}
              onChange={e => updateField('budgetMax', e.target.value === '' ? undefined : Number(e.target.value))}
              placeholder={t('settings.budgetMaxPlaceholder')}
              aria-label={t('settings.budgetMaxPlaceholder')}
              className="w-full p-2 border rounded"
            />
          </div>

          <div className="mt-2 flex flex-wrap gap-1.5">
            {BUDGET_PRESETS[i18n.language === 'id' ? 'IDR' : 'USD'].map(preset => (
              <button
                key={`${preset.min}-${preset.max}`}
                type="button"
                onClick={() => onChangeEventMetadata({ ...eventMetadata, budgetMin: preset.min, budgetMax: preset.max })}
                className="px-2 py-1 text-xs bg-white border border-gray-300 rounded-full text-gray-600 hover:bg-gray-100"
              >
                {formatBudget(preset.min, i18n.language)}–{formatBudget(preset.max, i18n.language)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4 bg-gray-50 rounded-lg">
        <div className="mb-2">
          <h3 className="block text-sm font-medium text-gray-700">
            {t('settings.instructions')}
          </h3>
          <p className="mt-1 text-xs text-gray-500">
            {t('settings.instructionsHelp')}
          </p>
        </div>
        <textarea
          value={instructions}
          onChange={(e) => onChangeInstructions(e.target.value)}
          className="w-full p-2 border rounded min-h-[100px]"
          placeholder={t('settings.instructionsPlaceholder')}
          aria-label={t('settings.instructions')}
        />
      </div>

      <div className="p-4 bg-gray-50 rounded-lg">
        <div className="mb-2">
          <h3 className="block text-sm font-medium text-gray-700">
            {t('settings.backupTitle')}
          </h3>
          <p className="mt-1 text-xs text-gray-500">
            {t('settings.backupHelp')}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onExportEvent}
            className="flex-1 p-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 flex items-center justify-center gap-2"
          >
            <DownloadSimple size={20} weight="bold" />
            {t('settings.exportEvent')}
          </button>
          <button
            type="button"
            onClick={() => importInputRef.current?.click()}
            className="flex-1 p-2 bg-gray-600 text-white rounded hover:bg-gray-700 flex items-center justify-center gap-2"
          >
            <UploadSimple size={20} weight="bold" />
            {t('settings.importEvent')}
          </button>
          <input
            ref={importInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            aria-label={t('settings.importEvent')}
            onChange={handleImportChange}
          />
        </div>
      </div>
    </div>
  );
}
