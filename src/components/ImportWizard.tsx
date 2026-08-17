import { Fragment, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { produce } from "immer";
import { CheckCircle, Warning, WarningCircle, X } from "@phosphor-icons/react";
import { Participant } from "../types";
import {
  ColumnMapping,
  ParticipantField,
  PARTICIPANT_FIELDS,
  RawSheet,
  guessColumnMapping,
  parseSpreadsheetFile,
  parseSpreadsheetRows,
} from "../utils/spreadsheetImport";

interface ImportWizardProps {
  file: File;
  existingParticipants: Record<string, Participant>;
  onImport: (participants: Record<string, Participant>) => void;
  onCancel: () => void;
}

const FIELD_LABEL_KEYS: Record<ParticipantField, string> = {
  name: "import.fieldName",
  address: "import.fieldAddress",
  phone: "import.fieldPhone",
  hint: "import.fieldHint",
  notes: "import.fieldNotes",
  wishlistUrl: "import.fieldWishlistUrl",
  groupId: "import.fieldGroupId",
};

const MAX_PREVIEW_ROWS = 50;
const LARGE_IMPORT_THRESHOLD = 200;

export function ImportWizard({ file, existingParticipants, onImport, onCancel }: ImportWizardProps) {
  const { t } = useTranslation();
  const [sheet, setSheet] = useState<RawSheet | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    parseSpreadsheetFile(file)
      .then(result => {
        if (cancelled) return;
        if (result.headers.length === 0) {
          setLoadError(t("import.errorEmptyFile"));
          return;
        }
        setSheet(result);
        setMapping(guessColumnMapping(result.headers));
      })
      .catch(() => {
        if (!cancelled) setLoadError(t("import.errorReadingFile"));
      });

    return () => { cancelled = true; };
  }, [file, t]);

  const existingNames = useMemo(
    () => Object.values(existingParticipants).map(p => p.name),
    [existingParticipants]
  );

  const parsed = useMemo(
    () => (sheet ? parseSpreadsheetRows(sheet.rows, mapping, existingNames) : null),
    [sheet, mapping, existingNames]
  );

  const setColumnField = (header: string, field: ParticipantField | null) => {
    setMapping(prev => ({ ...prev, [header]: field }));
  };

  const handleConfirm = () => {
    if (!parsed) return;

    const newParticipants = produce(existingParticipants, draft => {
      for (const row of parsed.rows) {
        if (row.errorKeys.length > 0 || !row.values.name) continue;

        const id = crypto.randomUUID();
        draft[id] = {
          id,
          name: row.values.name,
          rules: [],
          address: row.values.address,
          phone: row.values.phone,
          hint: row.values.hint,
          notes: row.values.notes,
          wishlistUrl: row.values.wishlistUrl,
          groupId: row.values.groupId,
        };
      }
    });

    onImport(newParticipants);
  };

  const errorCount = parsed ? parsed.rows.filter(r => r.errorKeys.length > 0).length : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-full overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">{t("import.title")}</h2>
          <button onClick={onCancel} className="p-1 text-gray-400 hover:text-gray-700" aria-label={t("rules.cancel")}>
            <X size={20} weight="bold" />
          </button>
        </div>

        {loadError && (
          <div className="p-3 bg-red-100 text-red-700 rounded text-sm">{loadError}</div>
        )}

        {!loadError && !sheet && (
          <p className="text-gray-500 text-sm">{t("import.loading")}</p>
        )}

        {sheet && parsed && (
          <>
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">{t("import.mappingTitle")}</h3>
              <div className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-2 items-center">
                {sheet.headers.map((header, index) => (
                  <Fragment key={`${index}-${header}`}>
                    <span className="text-sm text-gray-800 truncate" title={header}>
                      {header || t("import.blankHeader")}
                    </span>
                    <select
                      value={mapping[header] ?? ""}
                      onChange={e => setColumnField(header, (e.target.value || null) as ParticipantField | null)}
                      className="p-1.5 border rounded text-sm"
                      aria-label={header || t("import.blankHeader")}
                    >
                      <option value="">{t("import.fieldIgnore")}</option>
                      {PARTICIPANT_FIELDS.map(field => (
                        <option key={field} value={field}>{t(FIELD_LABEL_KEYS[field] as any)}</option>
                      ))}
                    </select>
                  </Fragment>
                ))}
              </div>
            </div>

            {parsed.rows.length > LARGE_IMPORT_THRESHOLD && (
              <div className="mb-4 p-2 bg-yellow-50 text-yellow-800 text-xs rounded">
                {t("import.largeFileWarning", { count: parsed.rows.length })}
              </div>
            )}

            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">{t("import.previewTitle")}</h3>
              <div className="border rounded overflow-x-auto max-h-64 overflow-y-auto">
                <table className="w-full text-sm">
                  <tbody>
                    {parsed.rows.slice(0, MAX_PREVIEW_ROWS).map(row => (
                      <tr key={row.rowNumber} className="border-b last:border-b-0">
                        <td className="p-2 text-gray-400 w-16 align-top">{t("import.rowNumber", { number: row.rowNumber })}</td>
                        <td className="p-2 align-top">
                          {row.values.name ?? <span className="text-gray-400 italic">{t("import.blankHeader")}</span>}
                          {row.values.address && <span className="text-gray-500"> · {row.values.address}</span>}
                          {row.values.phone && <span className="text-gray-500"> · {row.values.phone}</span>}
                        </td>
                        <td className="p-2 w-8 align-top">
                          {row.errorKeys.length > 0 ? (
                            <span title={row.errorKeys.map(k => t(k as any)).join(", ")}>
                              <WarningCircle size={18} weight="fill" className="text-red-500" />
                            </span>
                          ) : row.warningKeys.length > 0 ? (
                            <span title={row.warningKeys.map(k => t(k as any)).join(", ")}>
                              <Warning size={18} weight="fill" className="text-yellow-500" />
                            </span>
                          ) : (
                            <CheckCircle size={18} weight="fill" className="text-green-500" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsed.rows.length > MAX_PREVIEW_ROWS && (
                  <p className="p-2 text-xs text-gray-400 text-center">
                    {t("import.morePreviewRows", { count: parsed.rows.length - MAX_PREVIEW_ROWS })}
                  </p>
                )}
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              {t("import.summary", {
                valid: parsed.validCount,
                errors: errorCount,
                blank: parsed.skippedBlankCount,
              })}
            </p>

            <div className="flex justify-end gap-2">
              <button onClick={onCancel} className="px-4 py-2 text-gray-600 hover:text-gray-800">
                {t("rules.cancel")}
              </button>
              <button
                onClick={handleConfirm}
                disabled={parsed.validCount === 0}
                className="px-4 py-2 bg-green-700 text-white rounded hover:bg-green-800 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {t("import.confirmButton", { count: parsed.validCount })}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
