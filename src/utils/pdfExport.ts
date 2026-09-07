import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';

export interface PdfExportOptions {
  filename?: string;
  onProgress?: (status: string) => void;
}

/**
 * Exports an HTML element as a multi-page A4 PDF document and triggers download.
 * Works seamlessly across all browsers and within sandboxed iframes.
 */
export async function exportReportToPdf(
  elementId: string,
  options: PdfExportOptions = {}
): Promise<boolean> {
  const filename = options.filename || 'informe-contable.pdf';
  const element = document.getElementById(elementId);

  if (!element) {
    console.error(`[pdfExport] Element #${elementId} not found`);
    return false;
  }

  try {
    options.onProgress?.('Preparando documento para PDF...');

    // Render high-resolution canvas of the report content
    const canvas = await html2canvas(element, {
      scale: 2, // 2x resolution for crisp text and print-quality graphics
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 1080,
      onclone: (clonedDoc) => {
        const target = clonedDoc.getElementById(elementId);
        if (target) {
          // Remove scroll/overflow constraints so the entire multi-page document is rendered
          target.style.maxHeight = 'none';
          target.style.height = 'auto';
          target.style.overflow = 'visible';
          target.style.width = '1040px';
          target.style.padding = '24px';
          target.style.background = '#ffffff';

          // Hide any print-hidden items in the clone
          const hiddenElements = target.querySelectorAll('.print\\:hidden, [data-print-hidden="true"]');
          hiddenElements.forEach((el) => {
            (el as HTMLElement).style.display = 'none';
          });
        }
      }
    });

    options.onProgress?.('Maquetando páginas en formato A4...');

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    const pageWidth = 210; // A4 width (mm)
    const pageHeight = 297; // A4 height (mm)
    const margin = 8; // 8mm margin
    const contentWidth = pageWidth - (margin * 2); // 194 mm
    const contentHeight = pageHeight - (margin * 2); // 281 mm

    const imgWidth = contentWidth;
    const imgHeight = (canvas.height * contentWidth) / canvas.width;
    const imgData = canvas.toDataURL('image/jpeg', 0.95);

    let heightLeft = imgHeight;
    let pageIndex = 0;

    // Add first page
    pdf.addImage(
      imgData,
      'JPEG',
      margin,
      margin,
      imgWidth,
      imgHeight,
      undefined,
      'FAST'
    );
    heightLeft -= contentHeight;

    // Add subsequent pages if content exceeds single page
    while (heightLeft > 2) {
      pageIndex++;
      const yOffset = margin - (pageIndex * contentHeight);
      pdf.addPage();
      pdf.addImage(
        imgData,
        'JPEG',
        margin,
        yOffset,
        imgWidth,
        imgHeight,
        undefined,
        'FAST'
      );
      heightLeft -= contentHeight;
    }

    options.onProgress?.('Descargando archivo PDF...');
    pdf.save(filename);
    return true;
  } catch (error) {
    console.error('[pdfExport] Error during PDF generation:', error);
    return false;
  }
}
