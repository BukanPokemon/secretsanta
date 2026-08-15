import { X } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";

interface QrCodeModalProps {
  giverName: string;
  dataUrl: string | null;
  onClose: () => void;
}

export function QrCodeModal({ giverName, dataUrl, onClose }: QrCodeModalProps) {
  const { t } = useTranslation();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full max-h-full overflow-y-auto text-center">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">{t("links.qrModalTitle", { name: giverName })}</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-700" aria-label={t("links.close")}>
            <X size={20} weight="bold" />
          </button>
        </div>

        {dataUrl ? (
          <img src={dataUrl} alt={t("links.qrModalTitle", { name: giverName })} className="mx-auto w-56 h-56" />
        ) : (
          <div className="w-56 h-56 mx-auto flex items-center justify-center text-gray-400 text-sm">
            {t("import.loading")}
          </div>
        )}

        <button
          onClick={onClose}
          className="mt-4 w-full px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
        >
          {t("links.close")}
        </button>
      </div>
    </div>
  );
}
