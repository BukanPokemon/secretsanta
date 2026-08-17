import React, { useEffect, useState } from "react";
import { CheckCircle, Circle, DownloadSimple, Printer, QrCode, Warning, WhatsappLogo } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { CopyButton } from "./CopyButton";
import { QrCodeModal } from "./QrCodeModal";
import { generateAssignmentLink, generateCSV } from "../utils/links";
import { buildWhatsAppLink } from "../utils/phone";
import { Participant, EventMetadata } from "../types";
import { GeneratedPairs, generateGenerationHash } from "../utils/generatePairs";

interface SecretSantaLinksProps {
  assignments: GeneratedPairs;
  instructions?: string;
  eventMetadata?: EventMetadata;
  participants: Record<string, Participant>;
  onGeneratePairs: () => void;
}

const SENT_TRACKING_STORAGE_KEY = "secretSantaSentTracking";

function loadSentTracking(): Record<string, boolean> {
  try {
    const stored = localStorage.getItem(SENT_TRACKING_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

export function SecretSantaLinks({
  assignments,
  instructions,
  eventMetadata,
  participants,
  onGeneratePairs
}: SecretSantaLinksProps) {
  const { t } = useTranslation();
  const [resolvedLinks, setResolvedLinks] = useState<Record<string, string>>({});
  const [qrDataUrls, setQrDataUrls] = useState<Record<string, string>>({});
  const [qrModalGiverId, setQrModalGiverId] = useState<string | null>(null);
  const [sentTracking, setSentTracking] = useState<Record<string, boolean>>(loadSentTracking);

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
      giverId: giver.id,
      giverName: participants[giver.id]?.name ?? giver.name,
      giverPhone: participants[giver.id]?.phone,
      receiverData
    };
  });

  adjustedPairings.sort((a, b) => a.giverName.localeCompare(b.giverName));

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const linkEntries = await Promise.all(
        adjustedPairings.map(async ({ giverId, giverName, receiverData }) => {
          const link = await generateAssignmentLink(assignments.encryptionKey, giverName, receiverData, instructions, eventMetadata);
          return [giverId, link] as const;
        })
      );
      if (cancelled) return;
      setResolvedLinks(Object.fromEntries(linkEntries));

      // QR generation is lazy-loaded — it's only needed for the QR modal
      // and the print view, not the common copy/WhatsApp path.
      const QRCode = await import("qrcode");
      const qrEntries = await Promise.all(
        linkEntries.map(async ([giverId, link]) => {
          const dataUrl = await QRCode.toDataURL(link, { width: 240, margin: 1 });
          return [giverId, dataUrl] as const;
        })
      );
      if (!cancelled) setQrDataUrls(Object.fromEntries(qrEntries));
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignments.encryptionKey, assignments.hash, instructions, eventMetadata, participants]);

  const toggleSent = (giverId: string) => {
    setSentTracking(prev => {
      const next = { ...prev, [giverId]: !prev[giverId] };
      localStorage.setItem(SENT_TRACKING_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const buildMessage = (giverName: string, link: string) =>
    t("links.whatsappMessage", { name: giverName, link });

  const handleExportCSV = async () => {
    const headers: [string, string] = ["Giver", "Secret Santa Link"];
    const rows: [string, string][] = adjustedPairings.map(({ giverName, giverId }) => [
      giverName,
      resolvedLinks[giverId] ?? "",
    ]);
    const csvContent = generateCSV([headers, ...rows]);

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "secret-santa-assignments.csv";
    a.click();

    window.URL.revokeObjectURL(url);
  };

  const buildAllMessages = async () =>
    adjustedPairings
      .map(({ giverId, giverName }) => buildMessage(giverName, resolvedLinks[giverId] ?? ""))
      .join("\n\n");

  const qrModalGiver = adjustedPairings.find(p => p.giverId === qrModalGiverId);

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

      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded text-sm flex items-start gap-2 print:hidden">
        <Warning size={20} weight="bold" className="flex-shrink-0 mt-0.5" />
        <p>{t("links.selfSpoilWarning")}</p>
      </div>

      <div className="p-4 bg-gray-50 rounded-lg print:hidden">
        <div className="flex flex-wrap gap-2 items-center mb-4">
          <p className="text-gray-600 text-balance flex-1 min-w-[200px]">{t("links.shareInstructions")}</p>
          <button
            onClick={handleExportCSV}
            className="p-2 bg-green-700 text-white rounded hover:bg-green-800 flex flex-none items-center gap-2"
          >
            <DownloadSimple size={20} weight="bold" />
            {t("links.exportCSV")}
          </button>
          <CopyButton
            textToCopy={buildAllMessages}
            className="p-2 bg-teal-600 text-white rounded hover:bg-teal-700 flex flex-none items-center gap-2"
          >
            {t("links.copyAll")}
          </CopyButton>
          <button
            onClick={() => window.print()}
            className="p-2 bg-gray-600 text-white rounded hover:bg-gray-700 flex flex-none items-center gap-2"
          >
            <Printer size={20} weight="bold" />
            {t("links.printSlips")}
          </button>
        </div>

        <div className="space-y-2">
          {adjustedPairings.map(({ giverId, giverName, giverPhone, receiverData }) => {
            const link = resolvedLinks[giverId];
            const whatsappLink = giverPhone && link ? buildWhatsAppLink(giverPhone, buildMessage(giverName, link)) : null;
            const isSent = !!sentTracking[giverId];

            return (
              <div key={giverId} className="flex flex-wrap items-center gap-2 p-2 bg-white rounded border">
                <button
                  onClick={() => toggleSent(giverId)}
                  title={t("links.markSent")}
                  className={`flex-shrink-0 ${isSent ? 'text-green-500' : 'text-gray-300 hover:text-gray-400'}`}
                >
                  {isSent ? <CheckCircle size={22} weight="fill" /> : <Circle size={22} />}
                </button>

                <span className="font-medium flex-1 min-w-[100px]">{giverName}</span>

                <CopyButton
                  textToCopy={() => generateAssignmentLink(assignments.encryptionKey, giverName, receiverData, instructions, eventMetadata)}
                  className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center justify-center gap-2 text-sm"
                >
                  {t("links.copySecretLink")}
                </CopyButton>

                {whatsappLink && (
                  <a
                    href={whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => toggleSent(giverId)}
                    className="p-2 bg-green-700 text-white rounded hover:bg-green-800 flex items-center justify-center gap-2 text-sm"
                  >
                    <WhatsappLogo size={18} weight="fill" />
                    {t("links.sendWhatsApp")}
                  </a>
                )}

                <button
                  onClick={() => setQrModalGiverId(giverId)}
                  disabled={!link}
                  className="p-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                >
                  <QrCode size={18} weight="bold" />
                  {t("links.showQr")}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Printable slips — hidden on screen, shown only when printing */}
      <div className="hidden print:block">
        {adjustedPairings.map(({ giverId, giverName }) => (
          <div key={giverId} className="break-after-page py-8 text-center">
            <h2 className="text-2xl font-bold mb-4">{giverName}</h2>
            <p className="mb-4">{t("links.printSlipInstructions")}</p>
            {qrDataUrls[giverId] && (
              <img src={qrDataUrls[giverId]} alt="" className="mx-auto w-48 h-48 mb-4" />
            )}
            <p className="text-xs text-gray-500">{t("links.printSlipFallback")}</p>
            <p className="text-xs break-all">{resolvedLinks[giverId]}</p>
          </div>
        ))}
      </div>

      {qrModalGiver && (
        <QrCodeModal
          giverName={qrModalGiver.giverName}
          dataUrl={qrDataUrls[qrModalGiver.giverId] ?? null}
          onClose={() => setQrModalGiverId(null)}
        />
      )}
    </>
  );
}
