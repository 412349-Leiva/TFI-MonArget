import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const BRAND_GOLD = [217, 180, 74];
const BRAND_DARK = [15, 37, 67];
const TEXT_DARK = [15, 37, 67];
const TEXT_MUTED = [100, 116, 139];
const ROW_ALT = [248, 250, 252];
const ROW_HEADER = [241, 245, 249];

const formatGeneratedDate = (date = new Date()) =>
  date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });

const formatPercent = (value, total) => {
  if (!total) return '0 %';
  return `${((value / total) * 100).toLocaleString('es-AR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })} %`;
};

const drawWatermark = (pdf, pageWidth, pageHeight) => {
  pdf.saveGraphicsState();
  pdf.setTextColor(230, 235, 242);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(52);
  const cx = pageWidth / 2;
  const cy = pageHeight / 2;
  pdf.text('MonArgent', cx, cy, { align: 'center', angle: 35 });
  pdf.restoreGraphicsState();
};

const drawHeader = (pdf, pageWidth, margin) => {
  pdf.setFillColor(...BRAND_DARK);
  pdf.rect(0, 0, pageWidth, 52, 'F');
  pdf.setFillColor(...BRAND_GOLD);
  pdf.rect(0, 52, pageWidth, 3, 'F');

  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(20);
  pdf.text('MonArgent', margin, 26);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(203, 213, 225);
  pdf.text('Gestión financiera personal', margin, 38);
};

const drawFooter = (pdf, pageWidth, pageHeight, margin, pageNumber, pageCount) => {
  pdf.setFontSize(8);
  pdf.setTextColor(...TEXT_MUTED);
  pdf.text('MonArgent — Reporte generado automáticamente', margin, pageHeight - 16);
  if (pageCount > 1) {
    pdf.text(`Página ${pageNumber} de ${pageCount}`, pageWidth - margin, pageHeight - 16, { align: 'right' });
  }
};

const ensureSpace = (pdf, y, needed, pageHeight, startPage) => {
  if (y + needed > pageHeight - 40) {
    pdf.addPage();
    return startPage();
  }
  return y;
};

const drawKeyValueTable = (pdf, { margin, contentWidth, y, title, rows }) => {
  let cursor = y;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(...TEXT_DARK);
  pdf.text(title, margin, cursor);
  cursor += 16;

  const colLabel = contentWidth * 0.55;
  const rowHeight = 20;

  pdf.setFillColor(...ROW_HEADER);
  pdf.rect(margin, cursor, contentWidth, rowHeight, 'F');
  pdf.setFontSize(9);
  pdf.text('Indicador', margin + 8, cursor + 13);
  pdf.text('Valor', margin + colLabel + 8, cursor + 13);
  cursor += rowHeight;

  pdf.setFont('helvetica', 'normal');
  rows.forEach((row, index) => {
    if (index % 2 === 0) {
      pdf.setFillColor(...ROW_ALT);
      pdf.rect(margin, cursor, contentWidth, rowHeight, 'F');
    }
    pdf.setTextColor(...TEXT_DARK);
    pdf.text(String(row.label), margin + 8, cursor + 13);
    pdf.text(String(row.value), margin + colLabel + 8, cursor + 13);
    cursor += rowHeight;
  });

  return cursor + 12;
};

const drawDataTable = (pdf, {
  margin,
  contentWidth,
  y,
  title,
  headers,
  rows,
  colWidths,
}) => {
  let cursor = y;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(...TEXT_DARK);
  pdf.text(title, margin, cursor);
  cursor += 16;

  const rowHeight = 20;
  const widths = colWidths || [contentWidth * 0.5, contentWidth * 0.25, contentWidth * 0.25];

  pdf.setFillColor(...ROW_HEADER);
  pdf.rect(margin, cursor, contentWidth, rowHeight, 'F');
  pdf.setFontSize(9);
  let x = margin + 8;
  headers.forEach((header, i) => {
    const align = i === 0 ? 'left' : 'right';
    const tx = i === 0 ? x : margin + widths.slice(0, i + 1).reduce((a, b) => a + b, 0) - 8;
    pdf.text(header, tx, cursor + 13, { align });
  });
  cursor += rowHeight;

  pdf.setFont('helvetica', 'normal');
  rows.forEach((row, index) => {
    if (index % 2 === 0) {
      pdf.setFillColor(...ROW_ALT);
      pdf.rect(margin, cursor, contentWidth, rowHeight, 'F');
    }
    pdf.setTextColor(...TEXT_DARK);
    pdf.text(String(row[0]), margin + 8, cursor + 13);
    if (widths.length === 2) {
      pdf.text(String(row[1]), margin + contentWidth - 8, cursor + 13, { align: 'right' });
    } else {
      if (row[1] != null) {
        pdf.text(String(row[1]), margin + widths[0] + widths[1] - 8, cursor + 13, { align: 'right' });
      }
      if (row[2] != null) {
        pdf.text(String(row[2]), margin + contentWidth - 8, cursor + 13, { align: 'right' });
      }
    }
    cursor += rowHeight;
  });

  return cursor + 12;
};

const drawParagraphs = (pdf, { margin, contentWidth, y, title, lines }) => {
  let cursor = y;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(...TEXT_DARK);
  pdf.text(title, margin, cursor);
  cursor += 16;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(...TEXT_MUTED);
  lines.forEach((line) => {
    const wrapped = pdf.splitTextToSize(line, contentWidth);
    pdf.text(wrapped, margin, cursor);
    cursor += wrapped.length * 12 + 4;
  });

  return cursor + 8;
};

async function captureChart(chartElement) {
  if (!chartElement) return null;
  const canvas = await html2canvas(chartElement, {
    backgroundColor: '#0f2543',
    scale: 2,
    useCORS: true,
    logging: false,
  });
  return {
    dataUrl: canvas.toDataURL('image/png'),
    width: canvas.width,
    height: canvas.height,
  };
}

async function addChartImage(pdf, chart, margin, contentWidth, y, title, pageHeight, startPage) {
  if (!chart) return y;
  let cursor = ensureSpace(pdf, y, 220, pageHeight, startPage);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(...TEXT_DARK);
  pdf.text(title, margin, cursor);
  cursor += 14;

  const maxImgWidth = contentWidth;
  const maxImgHeight = 180;
  let imgWidth = maxImgWidth;
  let imgHeight = (chart.height / chart.width) * imgWidth;
  if (imgHeight > maxImgHeight) {
    imgHeight = maxImgHeight;
    imgWidth = (chart.width / chart.height) * imgHeight;
  }
  const imgX = margin + (contentWidth - imgWidth) / 2;
  pdf.addImage(chart.dataUrl, 'PNG', imgX, cursor, imgWidth, imgHeight);
  return cursor + imgHeight + 16;
}

function finalizePdf(pdf, pageWidth, pageHeight, margin) {
  const pageCount = pdf.internal.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    pdf.setPage(page);
    drawWatermark(pdf, pageWidth, pageHeight);
    drawFooter(pdf, pageWidth, pageHeight, margin, page, pageCount);
  }
}

/**
 * PDF — Comparativa de gastos
 */
export async function exportComparisonReportPdf({
  chartElement,
  filename,
  periodLabel,
  summaryRows,
  monthlyRows,
  analysisLines,
}) {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;
  const generatedAt = formatGeneratedDate();
  const chart = await captureChart(chartElement);

  const startPage = () => {
    drawHeader(pdf, pageWidth, margin);
    return 68;
  };

  let y = startPage();

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  pdf.setTextColor(...TEXT_DARK);
  pdf.text('Comparativa de gastos', margin, y);
  y += 20;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(...TEXT_MUTED);
  pdf.text(`Período analizado: ${periodLabel}`, margin, y);
  y += 14;
  pdf.text(`Fecha de generación: ${generatedAt}`, margin, y);
  y += 20;

  y = drawKeyValueTable(pdf, {
    margin,
    contentWidth,
    y,
    title: 'Resumen',
    rows: summaryRows,
  });

  if (chart) {
    y = await addChartImage(pdf, chart, margin, contentWidth, y, 'Evolución de gastos', pageHeight, startPage);
  }

  y = ensureSpace(pdf, y, 80, pageHeight, startPage);
  y = drawDataTable(pdf, {
    margin,
    contentWidth,
    y,
    title: 'Detalle mensual',
    headers: ['Mes', 'Gasto', ''],
    rows: monthlyRows,
    colWidths: [contentWidth * 0.55, contentWidth * 0.45],
  });

  y = ensureSpace(pdf, y, 80, pageHeight, startPage);
  drawParagraphs(pdf, {
    margin,
    contentWidth,
    y,
    title: 'Análisis del período',
    lines: analysisLines,
  });

  finalizePdf(pdf, pageWidth, pageHeight, margin);
  pdf.save(filename);
}

/**
 * PDF — Gastos por categoría
 */
export async function exportCategoryReportPdf({
  chartElement,
  filename,
  periodLabel,
  summaryRows,
  categoryRows,
  rankingRows,
  analysisLines,
}) {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;
  const generatedAt = formatGeneratedDate();
  const chart = await captureChart(chartElement);

  const startPage = () => {
    drawHeader(pdf, pageWidth, margin);
    return 68;
  };

  let y = startPage();

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  pdf.setTextColor(...TEXT_DARK);
  pdf.text('Gastos por categoría', margin, y);
  y += 20;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(...TEXT_MUTED);
  pdf.text(`Período: ${periodLabel}`, margin, y);
  y += 14;
  pdf.text(`Fecha de generación: ${generatedAt}`, margin, y);
  y += 20;

  y = drawKeyValueTable(pdf, {
    margin,
    contentWidth,
    y,
    title: 'Resumen',
    rows: summaryRows,
  });

  if (chart) {
    y = await addChartImage(pdf, chart, margin, contentWidth, y, 'Distribución de gastos', pageHeight, startPage);
  }

  y = ensureSpace(pdf, y, 80, pageHeight, startPage);
  y = drawDataTable(pdf, {
    margin,
    contentWidth,
    y,
    title: 'Detalle por categoría',
    headers: ['Categoría', 'Monto', '%'],
    rows: categoryRows,
  });

  y = ensureSpace(pdf, y, 80, pageHeight, startPage);
  y = drawDataTable(pdf, {
    margin,
    contentWidth,
    y,
    title: 'Ranking de categorías',
    headers: ['Posición', 'Categoría', 'Monto'],
    rows: rankingRows,
  });

  y = ensureSpace(pdf, y, 80, pageHeight, startPage);
  drawParagraphs(pdf, {
    margin,
    contentWidth,
    y,
    title: 'Análisis del período',
    lines: analysisLines,
  });

  finalizePdf(pdf, pageWidth, pageHeight, margin);
  pdf.save(filename);
}

export { formatPercent };
