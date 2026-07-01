import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const BRAND_GOLD = [217, 180, 74];
const BRAND_DARK = [15, 37, 67];
const TEXT_DARK = [15, 37, 67];
const TEXT_MUTED = [100, 116, 139];
const ROW_ALT = [248, 250, 252];
const ROW_HEADER = [241, 245, 249];
const BORDER = [226, 232, 240];

const formatGeneratedDate = (date = new Date()) =>
  date.toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' });

const drawHeader = (pdf, pageWidth, margin) => {
  pdf.setFillColor(...BRAND_DARK);
  pdf.rect(0, 0, pageWidth, 56, 'F');
  pdf.setFillColor(...BRAND_GOLD);
  pdf.rect(0, 56, pageWidth, 4, 'F');

  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(22);
  pdf.text('MonArgent', margin, 28);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(203, 213, 225);
  pdf.text('Gestión financiera personal', margin, 42);
};

const drawFooter = (pdf, pageWidth, pageHeight, margin, pageNumber, pageCount) => {
  pdf.setFontSize(8);
  pdf.setTextColor(...TEXT_MUTED);
  pdf.text('MonArgent — Reporte generado automáticamente', margin, pageHeight - 18);
  if (pageCount > 1) {
    pdf.text(`Página ${pageNumber} de ${pageCount}`, pageWidth - margin, pageHeight - 18, { align: 'right' });
  }
};

const truncateText = (pdf, text, maxWidth) => {
  const value = String(text ?? '');
  if (pdf.getTextWidth(value) <= maxWidth) {
    return value;
  }
  let truncated = value;
  while (truncated.length > 1 && pdf.getTextWidth(`${truncated}…`) > maxWidth) {
    truncated = truncated.slice(0, -1);
  }
  return `${truncated}…`;
};

const drawTable = (pdf, {
  margin,
  contentWidth,
  pageHeight,
  startPage,
  y: startY,
  tableTitle,
  tableHeaders,
  tableRows,
}) => {
  let y = startY;

  if (tableRows.length === 0) {
    return y;
  }

  const colWidths = [contentWidth - 150, 90, 60];
  const rowHeight = 22;

  const drawTableHeader = () => {
    pdf.setFillColor(...ROW_HEADER);
    pdf.setDrawColor(...BORDER);
    pdf.rect(margin, y, contentWidth, rowHeight, 'FD');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(...TEXT_DARK);
    pdf.text(tableHeaders[0], margin + 8, y + 14);
    pdf.text(tableHeaders[1], margin + colWidths[0] + colWidths[1] - 8, y + 14, { align: 'right' });
    pdf.text(tableHeaders[2], margin + contentWidth - 8, y + 14, { align: 'right' });
    y += rowHeight;
  };

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.setTextColor(...TEXT_DARK);
  pdf.text(tableTitle, margin, y);
  y += 18;
  drawTableHeader();

  pdf.setFont('helvetica', 'normal');
  tableRows.forEach((row, rowIndex) => {
    if (y > pageHeight - 50) {
      pdf.addPage();
      y = startPage();
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.setTextColor(...TEXT_DARK);
      pdf.text(tableTitle, margin, y);
      y += 18;
      drawTableHeader();
      pdf.setFont('helvetica', 'normal');
    }

    if (rowIndex % 2 === 0) {
      pdf.setFillColor(...ROW_ALT);
      pdf.rect(margin, y, contentWidth, rowHeight, 'F');
    }

    pdf.setFontSize(9);
    pdf.setTextColor(...TEXT_DARK);
    pdf.text(truncateText(pdf, row.label, colWidths[0] - 16), margin + 8, y + 14);
    pdf.setTextColor(...TEXT_MUTED);
    pdf.text(String(row.amount), margin + colWidths[0] + colWidths[1] - 8, y + 14, { align: 'right' });
    pdf.text(String(row.percent), margin + contentWidth - 8, y + 14, { align: 'right' });
    y += rowHeight;
  });

  return y + 16;
};

/**
 * Exporta un reporte A4 vertical: encabezado MonArgent, tabla, gráfico.
 */
export async function exportChartReportPdf({
  chartElement,
  filename,
  title,
  dateRangeLabel,
  summaryStats = [],
  tableTitle = 'Detalle',
  tableHeaders = ['Concepto', 'Monto', '%'],
  tableRows = [],
}) {
  if (!chartElement) {
    throw new Error('No hay contenido para exportar');
  }

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;
  const generatedAt = formatGeneratedDate();

  const canvas = await html2canvas(chartElement, {
    backgroundColor: '#ffffff',
    scale: 2,
    useCORS: true,
    logging: false,
  });
  const imgData = canvas.toDataURL('image/png');

  const startPage = () => {
    drawHeader(pdf, pageWidth, margin);
    return 76;
  };

  let y = startPage();

  pdf.setTextColor(...TEXT_DARK);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(18);
  pdf.text(title.toUpperCase(), pageWidth / 2, y, { align: 'center' });
  y += 22;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(...TEXT_MUTED);
  pdf.text(`Período: ${dateRangeLabel}`, margin, y);
  y += 14;
  pdf.text(`Generado: ${generatedAt}`, margin, y);
  y += 20;

  if (summaryStats.length > 0) {
    const colWidth = contentWidth / summaryStats.length;
    summaryStats.forEach((stat, index) => {
      const x = margin + index * colWidth;
      pdf.setFillColor(...ROW_ALT);
      pdf.setDrawColor(...BORDER);
      pdf.roundedRect(x + 4, y, colWidth - 8, 46, 4, 4, 'FD');
      pdf.setFontSize(8);
      pdf.setTextColor(...TEXT_MUTED);
      pdf.text(stat.label, x + 12, y + 14);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.setTextColor(...TEXT_DARK);
      pdf.text(stat.value, x + 12, y + 32);
      pdf.setFont('helvetica', 'normal');
    });
    y += 58;
  }

  y = drawTable(pdf, {
    margin,
    contentWidth,
    pageHeight,
    startPage,
    y,
    tableTitle,
    tableHeaders,
    tableRows,
  });

  if (y > pageHeight - 280) {
    pdf.addPage();
    y = startPage();
  }

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.setTextColor(...TEXT_DARK);
  pdf.text('Gráfico', margin, y);
  y += 14;

  const maxImgWidth = contentWidth;
  const maxImgHeight = 280;
  let imgWidth = maxImgWidth;
  let imgHeight = (canvas.height / canvas.width) * imgWidth;
  if (imgHeight > maxImgHeight) {
    imgHeight = maxImgHeight;
    imgWidth = (canvas.width / canvas.height) * imgHeight;
  }
  const imgX = margin + (contentWidth - imgWidth) / 2;
  pdf.setDrawColor(...BORDER);
  pdf.setLineWidth(0.75);
  pdf.roundedRect(imgX - 4, y - 4, imgWidth + 8, imgHeight + 8, 4, 4, 'S');
  pdf.addImage(imgData, 'PNG', imgX, y, imgWidth, imgHeight);

  const pageCount = pdf.internal.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    pdf.setPage(page);
    drawFooter(pdf, pageWidth, pageHeight, margin, page, pageCount);
  }

  pdf.save(filename);
}
