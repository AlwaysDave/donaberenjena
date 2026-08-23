import React, { useState } from 'react';
import { PdfDocument } from '../../types';
import { FileText, Download, Check } from 'lucide-react';

interface PdfDownloadButtonProps {
  document?: PdfDocument;
  fallbackTitle?: string;
  className?: string;
}

export const PdfDownloadButton: React.FC<PdfDownloadButtonProps> = ({
  document,
  fallbackTitle = 'Descargar Documento Informativo (PDF)',
  className = ''
}) => {
  const [downloaded, setDownloaded] = useState(false);

  if (!document && !fallbackTitle) return null;

  const title = document?.title || fallbackTitle;
  const size = document?.fileSize || 'PDF';

  const handleDownload = (e: React.MouseEvent) => {
    e.preventDefault();
    setDownloaded(true);
    // Simulated PDF download
    const dummyPdfContent = `Asociación Gastronómica Doña Berenjena\n\nDocumento: ${title}\nFecha de generación: ${new Date().toLocaleDateString('es-ES')}\n\nEste documento contiene la información detallada, fichas técnicas y condiciones de la actividad.`;
    const blob = new Blob([dummyPdfContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = window.document.createElement('a');
    link.href = url;
    link.download = `${title.replace(/\s+/g, '_')}.txt`;
    link.click();
    URL.revokeObjectURL(url);

    setTimeout(() => setDownloaded(false), 3000);
  };

  return (
    <button
      id="btn-download-pdf"
      type="button"
      onClick={handleDownload}
      className={`inline-flex items-center justify-between gap-3 px-4 py-3 rounded-lg border border-[#EDE4D7] bg-[#FCFAF7] hover:bg-[#F6F1EA] hover:border-[#DFD3C2] text-[#26201D] transition-colors group cursor-pointer text-left ${className}`}
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-md bg-[#521849]/10 text-[#521849] flex items-center justify-center shrink-0 group-hover:bg-[#521849] group-hover:text-white transition-colors">
          <FileText className="w-5 h-5" />
        </div>
        <div>
          <p className="text-sm font-medium leading-tight text-[#26201D] group-hover:text-[#521849] transition-colors">
            {title}
          </p>
          <p className="text-xs text-[#574B45] mt-0.5">
            Documento descargable • {size}
          </p>
        </div>
      </div>
      <div className="shrink-0 text-[#574B45] group-hover:text-[#521849] pl-2">
        {downloaded ? (
          <span className="inline-flex items-center text-xs font-semibold text-emerald-700 gap-1">
            <Check className="w-4 h-4" /> Listo
          </span>
        ) : (
          <Download className="w-4 h-4" />
        )}
      </div>
    </button>
  );
};
