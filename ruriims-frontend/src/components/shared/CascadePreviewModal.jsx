const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export default function CascadePreviewModal({ isOpen, skuCode, productName, qty, unit, plan, onClose }) {
  if (!isOpen || !plan) return null;

  const total = plan.reduce((sum, entry) => sum + entry.quantityDeducted, 0);

  return (
    <div
      className="fixed inset-0 bg-black/50 z-[80] flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-lg leading-none"
        >
          ✕
        </button>
        <h2 className="text-sm font-bold text-gray-800 mb-4 pr-6">
          Cascade preview for {skuCode} {productName} — {qty} {unit}
        </h2>
        <div className="rounded-lg overflow-hidden border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-white" style={{ backgroundColor: '#1A381E' }}>
                <th className="text-left font-semibold px-4 py-2.5">Stock-In-Use Code</th>
                <th className="text-left font-semibold px-4 py-2.5">Harvest Date</th>
                <th className="text-left font-semibold px-4 py-2.5">Quantity</th>
              </tr>
            </thead>
            <tbody>
              {plan.map((entry, i) => (
                <tr key={i} className="border-t border-gray-100">
                  <td className="px-4 py-2.5 font-mono text-xs text-gray-700">{entry.code}</td>
                  <td className="px-4 py-2.5 text-gray-600">{formatDate(entry.harvestDate)}</td>
                  <td className="px-4 py-2.5 text-gray-600">{entry.quantityDeducted} {unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-sm font-semibold text-gray-700 mt-3 text-right">
          Total: {total} {unit}
        </p>
      </div>
    </div>
  );
}
