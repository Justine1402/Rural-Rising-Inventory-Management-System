import { jsPDF } from 'jspdf';

export function exportTablePdf({ title, filename, columns, rows, orientation = 'landscape' }) {
  const doc = new jsPDF({ orientation, unit: 'mm', format: 'a4' });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 12;
  const usableWidth = pageWidth - margin * 2;

  // Title block
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Rural Rising Philippines', margin, 16);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(title, margin, 23);

  doc.setFontSize(8);
  const exportDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
  doc.text('Exported: ' + exportDate, margin, 29);

  // Divider line
  doc.setDrawColor(26, 56, 30);
  doc.setLineWidth(0.4);
  doc.line(margin, 32, pageWidth - margin, 32);

  // Table setup
  const colWidth = usableWidth / columns.length;
  const headerHeight = 8;
  const rowHeight = 7;
  let y = 36;

  // Header row — dark green background, white text
  doc.setFillColor(26, 56, 30);
  doc.rect(margin, y, usableWidth, headerHeight, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  columns.forEach((col, i) => {
    doc.text(col, margin + i * colWidth + 2, y + 5.5, { maxWidth: colWidth - 3 });
  });

  y += headerHeight;

  // Data rows — zebra striping
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  rows.forEach((row, rowIdx) => {
    if (y + rowHeight > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      y = margin + 5;
    }

    if (rowIdx % 2 === 0) {
      doc.setFillColor(255, 255, 255);
    } else {
      doc.setFillColor(249, 250, 251);
    }
    doc.rect(margin, y, usableWidth, rowHeight, 'F');

    doc.setTextColor(30, 30, 30);
    row.forEach((cell, i) => {
      const cellText = cell === null || cell === undefined ? '—' : String(cell);
      doc.text(cellText, margin + i * colWidth + 2, y + 4.8, { maxWidth: colWidth - 3 });
    });

    y += rowHeight;
  });

  doc.save(filename);
}
