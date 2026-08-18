import { useState } from 'react'
import { ArrowsClockwise, FileXls, Sparkle, Trash, UploadSimple } from "@phosphor-icons/react"
import { Participant } from '../types'
import { useTranslation } from 'react-i18next'
import { ParticipantRow } from './ParticipantRow'
import { ImportWizard } from './ImportWizard'
import { produce } from 'immer'
import xlsxTemplateUrl from '../../static/tukar-kado-template.xlsx?url'

// Hidden for now to keep the empty state simpler — flip back on rather than
// deleting the feature (handler, i18n strings, and exampleParticipants.ts
// are all still wired up and tested).
const SHOW_TRY_EXAMPLE = false

interface ParticipantsListProps {
  participants: Record<string, Participant>
  onChangeParticipants: (newParticipants: Record<string, Participant>) => void
  onOpenRules: (participantName: string) => void
  onGeneratePairs: () => void
  onTryExample: () => void
  hasGeneratedPairs: boolean
  onParticipantRemoved: () => void
}

export function ParticipantsList({
  participants,
  onChangeParticipants,
  onOpenRules,
  onGeneratePairs,
  onTryExample,
  hasGeneratedPairs,
  onParticipantRemoved,
}: ParticipantsListProps) {
  const { t } = useTranslation()
  const [nextParticipantId, setNextParticipantId] = useState(() => crypto.randomUUID())
  const [importFile, setImportFile] = useState<File | null>(null)

  const updateParticipant = (id: string, name: string) => {
    if (id === nextParticipantId) {
      setNextParticipantId(crypto.randomUUID())
    }

    onChangeParticipants(produce(participants, draft => {
      draft[id] ??= { id, name, rules: [] }
      draft[id].name = name
    }))
  }

  const removeParticipant = (id: string, name: string) => {
    const confirmMessage = hasGeneratedPairs
      ? t('participants.removeConfirmWithLinks', { name })
      : t('participants.removeConfirm', { name })
    if (!confirm(confirmMessage)) return

    onChangeParticipants(produce(participants, draft => {
      delete draft[id]

      for (const participant of Object.values(draft)) {
        participant.rules = participant.rules.filter(
          rule => rule.targetParticipantId !== id
        )
      }
    }))

    if (hasGeneratedPairs) onParticipantRemoved()
  }

  const handleClearAll = () => {
    if (confirm(t('participants.clearAllConfirm'))) {
      onChangeParticipants({})
      if (hasGeneratedPairs) onParticipantRemoved()
    }
  }

  const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) setImportFile(file)
    event.target.value = ''
  }

  const participantsList = [
    ...Object.values(participants),
    {
      id: nextParticipantId,
      name: '',
      rules: []
    }
  ]

  const isEmpty = Object.keys(participants).length === 0

  return (
    <div className="space-y-4">

      {isEmpty && SHOW_TRY_EXAMPLE ? (
        <button
          type="button"
          onClick={onTryExample}
          className="w-full px-3 py-2 text-sm bg-yellow-50 text-yellow-800 font-medium rounded-lg hover:bg-yellow-100 flex items-center justify-center gap-2 border border-dashed border-yellow-400"
        >
          <Sparkle size={16} weight="bold" />
          {t('participants.tryExample')}
        </button>
      ) : !isEmpty ? (
        <button
          type="button"
          onClick={handleClearAll}
          className="w-full px-3 py-2 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg flex items-center justify-center gap-2"
        >
          <Trash size={16} weight="bold" />
          {t('participants.clearAll')}
        </button>
      ) : null}

      {/* Spreadsheet import */}
      <div className="space-y-2">
        <label className="flex items-center justify-center gap-2 w-full px-3 py-2 bg-indigo-600 text-white rounded cursor-pointer hover:bg-indigo-700">
          <UploadSimple size={20} />
          {t('participants.uploadSpreadsheet')}
          <input
            type="file"
            accept=".csv,.xlsx"
            className="hidden"
            onChange={handleFileSelected}
          />
        </label>

        <a
          href={xlsxTemplateUrl}
          download="tukar-kado-template.xlsx"
          className="flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs text-gray-600 hover:text-gray-900 hover:underline"
        >
          <FileXls size={16} />
          {t('participants.downloadXlsxTemplate')}
        </a>
      </div>

      {importFile && (
        <ImportWizard
          file={importFile}
          existingParticipants={participants}
          onCancel={() => setImportFile(null)}
          onImport={(newParticipants) => {
            onChangeParticipants(newParticipants)
            setImportFile(null)
          }}
        />
      )}

      <p className="mt-1 text-xs text-gray-500">
        {t('participants.generationWarning')}
      </p>

      <div className="space-y-2">
        {participantsList.map((participant, index) => (
          <ParticipantRow
            key={participant.id}
            participant={participant}
            isLast={index === Object.keys(participants).length}
            onNameChange={(name) => updateParticipant(participant.id, name)}
            onOpenRules={() => onOpenRules(participant.id)}
            onRemove={() => removeParticipant(participant.id, participant.name)}
          />
        ))}
      </div>

      {/* ✅ Generate Pairs Button */}
      <button
        type="button"
        onClick={onGeneratePairs}
        className="w-full bg-green-700 text-white p-2 rounded hover:bg-green-800 flex items-center justify-center gap-2"
      >
        <ArrowsClockwise size={20} weight="bold" />
        {t('participants.generatePairs')}
      </button>

    </div>
  )
}
