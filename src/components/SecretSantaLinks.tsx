import React from "react";
import { DownloadSimple, Warning } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { CopyButton } from "./CopyButton";
import { generateAssignmentLink, generateCSV } from "../utils/links";
import { Participant } from "../types";
import { GeneratedPairs, generateGenerationHash } from "../utils/generatePairs";

interface SecretSantaLinksProps {
  assignments: GeneratedPairs;
  instructions?: string;
  participants: Record<string, Participant>;
  onGeneratePairs: () => void;
}

export function SecretSantaLinks({
  assignments,
  instructions,
  participants,
  onGeneratePairs
}: SecretSantaLinksProps) {
  const { t } = useTranslation();

  const currentHash = generateGenerationHash(participants);
  const hasChanged = currentHash !== assignments.hash;

  // Map assignments to include full receiver data
  const adjustedPairings = assignments.pairings.map(({ giver, receiver }) => {
    const receiverData = participants[receiver.id] ?? {
      name: receiver.name,
      hint: undefined,
      address: undefined,
      phone: undefined,
      notes: undefined,
    };

    return {
      giverName: participants[giver.id]?.name ?? giver.name,
      receiverData
    };
  });

  adjustedPairings.sort((a, b) => a.giverName.localeCompare(b.giverName));

  const handleExportCSV = async () => {
    // Resolve all links
    const rows = await Promise.all(
      adjustedPairings.map(async ({ giverName, receiverData }) => {
        const link = await generateAssignmentLink(assignments.encryptionKey, giverName, receiverData, instructions);
        return [giverName, link] as [string, string]; // tuple
      })
    );

    // Add single header
    const headers: [string, string] = ["Giver", "Secret Santa Link"];
    const csvContent = generateCSV([headers, ...rows]);

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "secret-santa-assignments.csv";
    a.click();

    window.URL.revokeObjectURL(url);
  };

  return (
    <>
      {hasChanged && (
        <div className="mb-2 p-3 bg-yellow-100 border border-yellow-400 text-yellow-800 rounded">
          <p className="text-sm">{t("links.warningParticipantsChanged")}</p>
          <button
            className="mt-2 w-full px-2 py-1 bg-yellow-700/40 rounded hover:bg-yellow-700/50 text-center text-white text-xs"
            onClick={onGeneratePairs}
          >
            {t("links.resetAssignments")}
          </button>
        </div>
      )}

      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded text-sm flex items-start gap-2">
        <Warning size={20} weight="bold" className="flex-shrink-0 mt-0.5" />
        <p>{t("links.selfSpoilWarning")}</p>
      </div>

      <div className="p-4 bg-gray-50 rounded-lg">
        <div className="flex space-x-4 items-center mb-4">
          <p className="text-gray-600 text-balance">{t("links.shareInstructions")}</p>
          <button
            onClick={handleExportCSV}
            className="p-2 bg-green-500 text-white rounded hover:bg-green-600 flex flex-none items-center gap-2"
          >
            <DownloadSimple size={20} weight="bold" />
            {t("links.exportCSV")}
          </button>
        </div>

        <div className="grid grid-cols-[minmax(100px,auto)_1fr] gap-3">
          {adjustedPairings.map(({ giverName, receiverData }) => (
            <React.Fragment key={giverName}>
              <span className="font-medium self-center">{giverName}:</span>

              <CopyButton
                textToCopy={() => generateAssignmentLink(assignments.encryptionKey, giverName, receiverData, instructions)}
                className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center justify-center gap-2"
              >
                {t("links.copySecretLink")}
              </CopyButton>
            </React.Fragment>
          ))}
        </div>
      </div>
    </>
  );
}
