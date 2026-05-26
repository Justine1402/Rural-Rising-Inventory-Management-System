import { useNavigate } from 'react-router-dom';

const TYPE_OPTIONS = [
  { label: 'All Reports',                      value: 'all',                  path: '/reports' },
  { label: 'Create Product Reports',           value: 'products',             path: '/reports/products' },
  { label: 'Receive Order Reports',            value: 'receive-orders',       path: '/reports/receive-orders' },
  { label: 'Transfer Request Reports',         value: 'transfer-requests',    path: '/reports/transfer-requests' },
  { label: 'Issue Product Reports',            value: 'issue-products',       path: '/reports/issue-products' },
  { label: 'Temporary Warehouse Reports',      value: 'temporary-warehouses', path: '/reports/temporary-warehouses' },
  { label: 'Inventory Reconciliation Reports', value: 'reconciliation',       path: '/reports/reconciliation' },
];

const inputClass = 'border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#409645]';
const labelClass = 'text-sm text-gray-600 mr-1';

const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

export default function ReportsFilterBar({
  warehouses = [],
  currentType,
  onTypeChange,
  warehouseId,
  onWarehouseChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  search,
  onSearchChange,
  showPdfButton = false,
  onExportPdf,
}) {
  const navigate = useNavigate();

  const handleTypeChange = (e) => {
    const newValue = e.target.value;
    onTypeChange(newValue);
    const option = TYPE_OPTIONS.find((o) => o.value === newValue);
    if (option) navigate(option.path);
  };

  const permanentWarehouses = warehouses.filter((w) => !w.isTemporary);

  return (
    <div className="flex items-center gap-3 flex-wrap p-4 border-b border-gray-200 bg-white">

      {/* Report Type */}
      <select
        value={currentType}
        onChange={handleTypeChange}
        className={`${inputClass} w-56`}
      >
        {TYPE_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      {/* Warehouse */}
      <select
        value={warehouseId}
        onChange={(e) => onWarehouseChange(e.target.value)}
        className={`${inputClass} w-48`}
      >
        <option value="">All Warehouses</option>
        {permanentWarehouses.map((w) => (
          <option key={w.id} value={String(w.id)}>{w.name}</option>
        ))}
      </select>

      {/* Date From */}
      <div className="flex items-center">
        <span className={labelClass}>From:</span>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => onDateFromChange(e.target.value)}
          className={`${inputClass} w-40`}
        />
      </div>

      {/* Date To */}
      <div className="flex items-center">
        <span className={labelClass}>To:</span>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => onDateToChange(e.target.value)}
          className={`${inputClass} w-40`}
        />
      </div>

      {/* Inventory Summary Report */}
      <button
        onClick={() => navigate('/reports/inventory-summary')}
        className="btn-brand text-white text-sm px-3 py-1.5 rounded transition-colors"
      >
        Inventory Summary Report
      </button>

      {/* Export as PDF — conditional */}
      {showPdfButton && (
        <button
          onClick={onExportPdf}
          className="btn-brand-outline text-sm px-3 py-1.5 rounded border transition-colors"
          style={{ color: '#409645', borderColor: '#409645' }}
        >
          Export as PDF
        </button>
      )}

      {/* Search */}
      <div className="ml-auto relative flex items-center">
        <span className="absolute left-2 text-gray-400 pointer-events-none">
          <SearchIcon />
        </span>
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className={`${inputClass} w-56 pl-7`}
        />
      </div>
    </div>
  );
}
