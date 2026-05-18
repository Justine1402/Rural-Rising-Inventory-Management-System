import { useEffect, useState } from 'react';
import { useUI } from '../../context/UIContext';
import api from '../../api/axios';

function formatDate(iso) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[parseInt(m, 10) - 1]} ${parseInt(d, 10)}, ${y}`;
}

function SubTable({ title, headers, rows, emptyMessage }) {
  return (
    <div className="mb-6">
      <h2 className="text-sm font-semibold text-gray-700 mb-3">{title}</h2>
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
                    <td key={j} className="px-4 py-2 text-gray-700 text-sm">{cell ?? '—'}</td>
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

  const meta = twh ? [
    ['Warehouse Name', twh.name],
    ['Event Date', formatDate(twh.event_date)],
    ['Created By', twh.created_by],
    ['Location', twh.location],
    ['Closed By', twh.closed_by ?? '—'],
    ['Date Closed', formatDate(twh.date_closed)],
  ] : [];

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" />

      {/* Card */}
      <div className="fixed top-[105px] left-1/2 -translate-x-1/2 w-[1200px] max-h-[85vh] bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 flex flex-col overflow-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 flex-shrink-0 border-b border-gray-100">
          <button
            onClick={handleClose}
            className="px-6 py-2.5 text-sm font-semibold text-white rounded-lg"
            style={{ backgroundColor: '#409645' }}
          >
            RETURN
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            {twh?.transaction_code ?? 'Temporary Warehouse'}
          </h1>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto px-8 py-6">

          {loading && (
            <p className="text-gray-500 text-sm text-center py-8">Loading…</p>
          )}

          {!loading && error && (
            <p className="text-red-500 text-sm text-center py-8">{error}</p>
          )}

          {!loading && !error && twh && (
            <>
              {/* Metadata block */}
              <div className="grid grid-cols-3 gap-x-12 gap-y-4 mb-8">
                {meta.map(([label, value]) => (
                  <div key={label}>
                    <p className="text-xs text-gray-500 mb-0.5">{label}</p>
                    <p className="text-sm text-gray-800 font-medium">{value}</p>
                  </div>
                ))}
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
