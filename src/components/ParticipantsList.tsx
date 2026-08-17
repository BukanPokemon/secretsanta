import { useState } from 'react'
import { ArrowsClockwise, FileCsv, FileXls, Sparkle, UploadSimple } from "@phosphor-icons/react"
import { Participant } from '../types'
import { useTranslation } from 'react-i18next'
import { ParticipantRow } from './ParticipantRow'
import { ImportWizard } from './ImportWizard'
import { produce } from 'immer'
import csvTemplateUrl from '../../static/tukar-kado-template.csv?url'
import xlsxTemplateUrl from '../../static/tukar-kado-template.xlsx?url'

interface ParticipantsListProps {
  participants: Record<string, Participant>
  onChangeParticipants: (newParticipants: Record<string, Participant>) => void
  onOpenRules: (participantName: string) => void
  onGeneratePairs: () => void
  onTryExample: () => void
}

export function ParticipantsList({
  participants,
  onChangeParticipants,
  onOpenRules,
  onGeneratePairs,
  onTryExample,
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

  const removeParticipant = (id: string) => {
    onChangeParticipants(produce(participants, draft => {
      delete draft[id]

      for (const participant of Object.values(draft)) {
        participant.rules = participant.rules.filter(
          rule => rule.targetParticipantId !== id
        )
      }
    }))
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

      {isEmpty && (
        <button
          type="button"
          onClick={onTryExample}
          className="w-full p-3 bg-yellow-50 text-yellow-800 font-medium rounded-lg hover:bg-yellow-100 flex items-center justify-center gap-2 border-2 border-dashed border-yellow-400"
        >
          <Sparkle size={20} weight="bold" />
          {t('participants.tryExample')}
        </button>
      )}

      {/* Spreadsheet import */}
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded cursor-pointer hover:bg-indigo-700">
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
          href={csvTemplateUrl}
          download="tukar-kado-template.csv"
          className="flex items-center gap-1.5 px-2 py-2 text-xs text-gray-600 hover:text-gray-900 hover:underline"
        >
          <FileCsv size={16} />
          {t('participants.downloadCsvTemplate')}
        </a>
        <a
          href={xlsxTemplateUrl}
          download="tukar-kado-template.xlsx"
          className="flex items-center gap-1.5 px-2 py-2 text-xs text-gray-600 hover:text-gray-900 hover:underline"
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
            onRemove={() => removeParticipant(participant.id)}
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
