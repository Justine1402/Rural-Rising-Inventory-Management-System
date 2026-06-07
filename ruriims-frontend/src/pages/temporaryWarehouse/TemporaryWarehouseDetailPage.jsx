import { useEffect, useState } from 'react';
import { useUI } from '../../context/UIContext';
import api from '../../api/axios';
import { exportDetailPdf } from '../../utils/exportPdf';
import { formatDate } from '../../utils/formatDate';

function SubTable({ title, headers, rows, emptyMessage }) {
  return (
    <div className="mb-8">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">{title}</p>
      <div className="rounded-lg overflow-hidden border border-gray-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-white" style={{ backgroundColor: '#1A381E' }}>
              {headers.map((h) => (
                <th key={h} className="text-left font-semibold px-4 py-2.5 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={headers.length} className="px-4 py-5 text-center text-gray-400">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((cells, i) => (
                <tr key={i} className="border-t border-gray-100 hover:bg-gray-50">
                  {cells.map((cell, j) => (
                    <td key={j} className="px-4 py-2.5 text-gray-700 text-sm">{cell ?? '—'}</td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function TemporaryWarehouseDetailPage() {
  const { temporaryWarehouseDetailOverlayTwhId, setTemporaryWarehouseDetailOverlayTwhId } = useUI();

  const id = temporaryWarehouseDetailOverlayTwhId;

  const [twh, setTwh] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (id === null) {
      setTwh(null);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    api.get(`/temporary-warehouses/${id}`)
      .then((res) => setTwh(res.data.temporary_warehouse))
      .catch(() => setError('Failed to load temporary warehouse record.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (id === null) return null;

  const handleClose = () => setTemporaryWarehouseDetailOverlayTwhId(null);

  const handleExportPdf = () => {
    if (!twh) return;
    exportDetailPdf({ type: 'twh', records: [twh] });
  };

  const transferredInRows = (twh?.products_transferred_in ?? []).map((p) => [
    <span key="sku" className="font-mono text-xs">{p.product_code}</span>,
    p.product_name,
    <span key="trf" className="font-mono text-xs">{p.transfer_request_code}</span>,
    <span key="siu" className="font-mono text-xs">{p.stock_in_use_code ?? '—'}</span>,
    `${p.quantity_received} ${p.unit}`,
    formatDate(p.harvest_date),
    p.source_warehouse ?? '—',
  ]);

  const issuedRows = (twh?.products_issued ?? []).map((p) => [
    <span key="sku" className="font-mono text-xs">{p.product_code}</span>,
    p.product_name,
    <span key="iss" className="font-mono text-xs">{p.issue_product_code}</span>,
    <span key="siu" className="font-mono text-xs">{p.stock_in_use_code ?? '—'}</span>,
    `${p.quantity_issued} ${p.unit}`,
    formatDate(p.harvest_date),
    p.issue_type ?? '—',
  ]);

  const returnedRows = (twh?.products_returned ?? []).map((p) => [
    <span key="sku" className="font-mono text-xs">{p.product_code}</span>,
    p.product_name,
    <span key="src" className="font-mono text-xs">{p.source_batch_code}</span>,
    `${p.quantity_returned} ${p.unit}`,
    p.destination_warehouse,
  ]);

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" />

      {/* Card */}
      <div className="fixed top-[105px] left-1/2 -translate-x-1/2 w-[1200px] max-h-[85vh] bg-white rounded-lg shadow-xl z-50 overflow-y-auto">

        {/* Dark green sticky header */}
        <div
          className="flex items-center justify-between px-6 py-4 sticky top-0 z-10"
          style={{ backgroundColor: '#1A381E' }}
        >
          <button
            onClick={handleClose}
            className="flex items-center gap-2 text-sm font-semibold text-white hover:opacity-80"
          >
            ← RETURN
          </button>
          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold text-white font-mono">
              {twh?.transaction_code ?? ''}
            </span>
            <button
              onClick={handleExportPdf}
              disabled={!twh}
              className="text-xs font-semibold text-white border border-white rounded px-3 py-1.5 hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Export as PDF
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-8 py-6">

          {loading && (
            <p className="text-gray-500 text-sm text-center py-8">Loading…</p>
          )}

          {!loading && error && (
            <p className="text-red-500 text-sm text-center py-8">{error}</p>
          )}

          {!loading && !error && twh && (
            <>
              {/* Section label */}
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                Warehouse Details
              </p>

              {/* Metadata grid */}
              <div className="grid grid-cols-3 gap-x-8 gap-y-4 mb-8">
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Warehouse Name</p>
                  <p className="text-sm font-medium text-gray-800">{twh.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Event Date</p>
                  <p className="text-sm font-medium text-gray-800">{formatDate(twh.event_date)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Created By</p>
                  <p className="text-sm font-medium text-gray-800">{twh.created_by}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Location</p>
                  <p className="text-sm font-medium text-gray-800">{twh.location}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Closed By</p>
                  <p className="text-sm font-medium text-gray-800">{twh.closed_by ?? '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Date Closed</p>
                  <p className="text-sm font-medium text-gray-800">{formatDate(twh.date_closed)}</p>
                </div>
              </div>

              <SubTable
                title="Products Transferred In"
                headers={['Product SKU', 'Product Name', 'Transfer Code', 'Stock-In-Use Code', 'Qty Received', 'Harvest Date', 'Source Warehouse']}
                rows={transferredInRows}
                emptyMessage="No records."
              />

              <SubTable
                title="Products Issued"
                headers={['Product SKU', 'Product Name', 'Issue Code', 'Stock-In-Use Code', 'Qty Issued', 'Harvest Date', 'Issue Type']}
                rows={issuedRows}
                emptyMessage="No records."
              />

              <SubTable
                title="Products Returned"
                headers={['Product SKU', 'Product Name', 'Source Batch', 'Qty Returned', 'Returned To']}
                rows={returnedRows}
                emptyMessage="No records."
              />
            </>
          )}

        </div>
      </div>
    </>
  );
}
