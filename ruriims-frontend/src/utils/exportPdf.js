import { jsPDF } from 'jspdf';

const fmtNum = (val) => {
  if (val == null || val === '') return null;
  const str = String(val).trim();
  if (/^-?\d+(\.\d+)?$/.test(str)) {
    return parseFloat(str).toString();
  }
  const match = str.match(/^(-?\d+(?:\.\d+)?)\s+(.+)$/);
  if (match) {
    return parseFloat(match[1]).toString() + ' ' + match[2];
  }
  return str;
};

const safeCell = (val) => {
  if (val == null) return '—';
  const numFormatted = fmtNum(val);
  const str = numFormatted != null ? String(numFormatted) : String(val);
  return str.replace('₱', 'PHP ');
};

const fmtMoney = (val) =>
  'PHP ' + Number(val).toLocaleString('en-PH', { minimumFractionDigits: 2 });

// ─── Private helpers ──────────────────────────────────────────────────────────

function drawTitleBlock(doc, subtitle, code) {
  const margin = 12;
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(26, 56, 30);
  doc.text('Rural Rising Philippines', margin, 16);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  doc.text(subtitle, margin, 24);

  doc.setFontSize(10);
  doc.setTextColor(107, 114, 128);
  doc.text(code ?? '', margin, 31);

  const exportDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
  doc.setFontSize(9);
  doc.text('Exported: ' + exportDate, margin, 37);

  doc.setDrawColor(26, 56, 30);
  doc.setLineWidth(1);
  doc.line(margin, 40, pageWidth - margin, 40);

  return 44; // y after title block
}

function drawSectionLabel(doc, label, y) {
  const margin = 12;
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(107, 114, 128);
  doc.text(label.toUpperCase(), margin, y);

  y += 2;
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.4);
  doc.line(margin, y, pageWidth - margin, y);

  return y + 4;
}

function drawTable(doc, columns, rows, startY, columnWidths = null) {
  const margin = 12;
  const pageWidth = doc.internal.pageSize.getWidth();
  const usableWidth = pageWidth - margin * 2;
  const colWidths = (() => {
    if (columnWidths && columnWidths.length === columns.length) {
      const total = columnWidths.reduce((a, b) => a + b, 0);
      return columnWidths.map(w => (w / total) * usableWidth);
    }
    const eq = usableWidth / columns.length;
    return columns.map(() => eq);
  })();
  const headerHeight = 8;
  const rowHeight = 7;
  let y = startY;

  // Header row
  doc.setFillColor(26, 56, 30);
  doc.rect(margin, y, usableWidth, headerHeight, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  let x = margin;
  columns.forEach((col, i) => {
    const truncated = doc.splitTextToSize(String(col), colWidths[i] - 2)[0];
    doc.text(truncated, x + 1, y + 5.5);
    x += colWidths[i];
  });

  y += headerHeight;

  // Data rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  rows.forEach((row, rowIdx) => {
    if (y + rowHeight > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      y = margin + 5;
    }

    doc.setFillColor(rowIdx % 2 === 0 ? 255 : 249, rowIdx % 2 === 0 ? 255 : 250, rowIdx % 2 === 0 ? 255 : 251);
    doc.rect(margin, y, usableWidth, rowHeight, 'F');

    doc.setTextColor(30, 30, 30);
    let rx = margin;
    row.forEach((cell, i) => {
      const truncated = doc.splitTextToSize(safeCell(cell), colWidths[i] - 2)[0];
      doc.text(truncated, rx + 1, y + 4.8);
      rx += colWidths[i];
    });

    y += rowHeight;
  });

  return y;
}

function drawHeaderFields(doc, fields, startY) {
  const margin = 12;
  const pageWidth = doc.internal.pageSize.getWidth();
  const colW = (pageWidth - margin * 2) / 2;
  const lineH = 7;
  let y = startY;

  for (let i = 0; i < fields.length; i += 2) {
    const left = fields[i];
    const right = fields[i + 1];

    if (left) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(107, 114, 128);
      doc.text(left[0] + ':', margin, y);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text(safeCell(left[1]), margin + colW * 0.35, y);
    }
    if (right) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(107, 114, 128);
      doc.text(right[0] + ':', margin + colW, y);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text(safeCell(right[1]), margin + colW + colW * 0.35, y);
    }

    y += lineH;
  }

  return y + 3;
}

// ─── exportTablePdf ───────────────────────────────────────────────────────────

export function exportTablePdf({ title, filename, columns, rows, orientation = 'landscape', columnWidths = null }) {
  const doc = new jsPDF({ orientation, unit: 'mm', format: 'a4' });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 12;
  const usableWidth = pageWidth - margin * 2;

  // Title block
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Rural Rising Philippines', margin, 16);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(title, margin, 23);

  doc.setFontSize(8);
  const exportDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
  doc.text('Exported: ' + exportDate, margin, 29);

  doc.setDrawColor(26, 56, 30);
  doc.setLineWidth(0.4);
  doc.line(margin, 32, pageWidth - margin, 32);

  // Column width resolution — proportional or equal fallback
  const colWidths = (() => {
    if (columnWidths && columnWidths.length === columns.length) {
      const total = columnWidths.reduce((a, b) => a + b, 0);
      return columnWidths.map(w => (w / total) * usableWidth);
    }
    const eq = usableWidth / columns.length;
    return columns.map(() => eq);
  })();

  const headerHeight = 8;
  const rowHeight = 7;
  let y = 36;

  // Header row
  doc.setFillColor(26, 56, 30);
  doc.rect(margin, y, usableWidth, headerHeight, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  let x = margin;
  columns.forEach((col, i) => {
    const truncated = doc.splitTextToSize(String(col), colWidths[i] - 2)[0];
    doc.text(truncated, x + 1, y + 5.5);
    x += colWidths[i];
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
    let rx = margin;
    row.forEach((cell, i) => {
      const cellStr = safeCell(cell);
      const truncated = doc.splitTextToSize(cellStr, colWidths[i] - 2)[0];
      doc.text(truncated, rx + 1, y + 4.8);
      rx += colWidths[i];
    });

    y += rowHeight;
  });

  doc.save(filename);
}

// ─── exportDetailPdf ──────────────────────────────────────────────────────────

export function exportDetailPdf({ type, records }) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const subtitleMap = {
    ro:  'Receive Order',
    trf: 'Transfer Request',
    iss: 'Issue Product',
    twh: 'Temporary Warehouse',
    rc:  'Inventory Reconciliation',
  };

  const filenameMap = {
    ro:  records.length > 1 ? 'ro-details.pdf'  : 'ro-detail.pdf',
    trf: records.length > 1 ? 'trf-details.pdf' : 'trf-detail.pdf',
    iss: records.length > 1 ? 'iss-details.pdf' : 'iss-detail.pdf',
    twh: records.length > 1 ? 'twh-details.pdf' : 'twh-detail.pdf',
    rc:  records.length > 1 ? 'rc-details.pdf'  : 'rc-detail.pdf',
  };

  const subtitle = subtitleMap[type] ?? type;

  records.forEach((record, recordIdx) => {
    if (recordIdx > 0) doc.addPage();

    const code = type === 'twh' || type === 'rc'
      ? record.transaction_code
      : record.code;

    let y = drawTitleBlock(doc, subtitle, code);

    if (type === 'ro') {
      const fields = [
        ['Supplier Name', record.supplier_name],
        ['Date Ordered',  record.date_ordered],
        ['Warehouse',     record.warehouse],
        ['Date Arrived',  record.date_arrived],
        ['Created By',    record.created_by],
        ['Verified By',   record.verified_by],
        ['Order Cost',    record.order_cost != null ? fmtMoney(record.order_cost) : null],
        ['Delivery Fee',  record.delivery_fee != null ? fmtMoney(record.delivery_fee) : null],
        ['Total',         record.total != null ? fmtMoney(record.total) : null],
        null,
      ];
      y = drawHeaderFields(doc, fields, y);
      y = drawSectionLabel(doc, 'Product Details', y);
      const cols = ['Product Code', 'Product Name', 'Unit', 'Qty Ordered', 'Qty Arrived', 'Harvest Date', 'Product Cost'];
      const rows = (record.items ?? []).map((item) => [
        item.product_code,
        item.product_name,
        item.unit,
        item.quantity_ordered,
        item.quantity_arrived,
        item.harvest_date,
        item.product_cost != null ? fmtMoney(item.product_cost) : null,
      ]);
      drawTable(doc, cols, rows, y, [2, 3, 1, 2, 2, 2, 2]);
    }

    else if (type === 'trf') {
      const fields = [
        ['Requested By',        record.requested_by],
        ['Date Requested',      record.date_requested],
        ['Source Warehouse',    record.source_warehouse],
        ['Destination Warehouse', record.destination_warehouse],
        ['Verified By',         record.verified_by],
        ['Date Received',       record.date_received],
      ];
      y = drawHeaderFields(doc, fields, y);
      y = drawSectionLabel(doc, 'Product Details', y);
      const cols = ['Product SKU', 'Product Name', 'Stock-In-Use Code', 'Qty Requested', 'Qty Received', 'Harvest Date'];
      const rows = (record.items ?? []).map((item) => [
        item.product_code,
        item.product_name,
        item.stock_in_use_code,
        item.quantity_requested,
        item.quantity_received,
        item.harvest_date,
      ]);
      drawTable(doc, cols, rows, y);
    }

    else if (type === 'iss') {
      const fields = [
        ['Issued By',  record.issued_by],
        ['Date Issued', record.date_issued],
        ['Warehouse',  record.warehouse],
        ['Issue Type', record.issue_type],
      ];
      y = drawHeaderFields(doc, fields, y);
      y = drawSectionLabel(doc, 'Product Details', y);
      const cols = ['Product SKU', 'Product Name', 'Stock-In-Use Code', 'Qty Issued', 'Harvest Date', 'Note'];
      const rows = (record.items ?? []).map((item) => [
        item.product_code,
        item.product_name,
        item.stock_in_use_code,
        item.quantity_issued,
        item.harvest_date,
        item.note ?? '—',
      ]);
      drawTable(doc, cols, rows, y, [2, 2, 2, 2, 2, 3]);
    }

    else if (type === 'twh') {
      const fields = [
        ['Warehouse Name', record.name],
        ['Event Date',     record.event_date],
        ['Location',       record.location],
        ['Created By',     record.created_by],
        ['Closed By',      record.closed_by],
        ['Date Closed',    record.date_closed],
      ];
      y = drawHeaderFields(doc, fields, y);

      // Section 1 — Transferred In
      y = drawSectionLabel(doc, 'Products Transferred In', y);
      const tInCols = ['Product SKU', 'Product Name', 'Transfer Code', 'Stock-In-Use Code', 'Qty Received', 'Harvest Date', 'Source Warehouse'];
      const tInRows = (record.products_transferred_in ?? []).length > 0
        ? (record.products_transferred_in).map((item) => [
            item.product_code, item.product_name, item.transfer_request_code,
            item.stock_in_use_code, item.quantity_received,
            item.harvest_date, item.source_warehouse,
          ])
        : [['No records.', '', '', '', '', '', '']];
      y = drawTable(doc, tInCols, tInRows, y, [2, 2, 2, 2, 2, 2, 3]) + 4;

      // Section 2 — Issued
      y = drawSectionLabel(doc, 'Products Issued', y);
      const issCols = ['Product SKU', 'Product Name', 'Issue Code', 'Stock-In-Use Code', 'Qty Issued', 'Harvest Date', 'Issue Type'];
      const issRows = (record.products_issued ?? []).length > 0
        ? (record.products_issued).map((item) => [
            item.product_code, item.product_name, item.issue_product_code,
            item.stock_in_use_code, item.quantity_issued,
            item.harvest_date, item.issue_type,
          ])
        : [['No records.', '', '', '', '', '', '']];
      y = drawTable(doc, issCols, issRows, y, [2, 2, 2, 2, 2, 2, 2]) + 4;

      // Section 3 — Returned
      y = drawSectionLabel(doc, 'Products Returned', y);
      const retCols = ['Product SKU', 'Product Name', 'Source Batch', 'Qty Returned', 'Returned To'];
      const retRows = (record.products_returned ?? []).length > 0
        ? (record.products_returned).map((item) => [
            item.product_code, item.product_name, item.source_batch_code,
            item.quantity_returned, item.destination_warehouse,
          ])
        : [['No records.', '', '', '', '']];
      drawTable(doc, retCols, retRows, y);
    }

    else if (type === 'rc') {
      const fields = [
        ['Reconciled By',  record.reconciled_by],
        ['Date Reconciled', record.date_reconciled],
        ['Reviewed By',    record.reviewed_by],
        ['Date Reviewed',  record.date_reviewed],
        ['Warehouse',      record.warehouse],
        null,
      ];
      y = drawHeaderFields(doc, fields, y);

      // Section 1 — Counted Items
      y = drawSectionLabel(doc, 'Counted Items', y);
      const itemCols = ['Product SKU', 'Product Name', 'Expected Stock', 'Actual Count', 'Discrepancy', 'Remarks'];
      const itemRows = (record.items ?? []).map((item) => [
        item.product_code,
        item.product_name,
        item.expected_stock,
        item.actual_count,
        item.discrepancy,
        item.remarks ?? '—',
      ]);
      y = drawTable(doc, itemCols, itemRows, y, [2, 3, 2, 2, 2, 3]) + 4;

      // Section 2 — Adjustments (derived from items with non-zero discrepancy)
      y = drawSectionLabel(doc, 'Inventory Adjustment Upon Confirmation', y);
      const adjCols = ['Product Name', 'Adjustment', 'Variance'];
      const adjustedItems = (record.items ?? []).filter(
        (i) => Math.abs(parseFloat(i.discrepancy)) >= 0.0005
      );
      const adjRows = adjustedItems.length > 0
        ? adjustedItems.map((item) => [
            item.product_name,
            String(item.expected_stock) + ' -> ' + String(item.actual_count),
            (parseFloat(item.discrepancy) > 0 ? '+' : '') + parseFloat(item.discrepancy).toFixed(2),
          ])
        : [["No adjustments — all counts matched.", '', '']];
      drawTable(doc, adjCols, adjRows, y, [3, 3, 2]);
    }
  });

  doc.save(filenameMap[type] ?? `${type}-detail.pdf`);
}
