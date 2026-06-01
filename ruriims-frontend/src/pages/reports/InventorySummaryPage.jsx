import { useEffect, useState, useMemo } from 'react';
import api from '../../api/axios';
import { useWarehouse } from '../../context/WarehouseContext';
import Navbar from '../../components/layout/Navbar';
import ReportsFilterBar from '../../components/shared/ReportsFilterBar';
import { exportTablePdf } from '../../utils/exportPdf';

export default function InventorySummaryPage() {
  const { warehouses } = useWarehouse();

  const [products, setProducts]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [warehouseId, setWarehouseId] = useState('');
  const [dateFrom, setDateFrom]       = useState('');
  const [dateTo, setDateTo]           = useState('');
  const [search, setSearch]           = useState('');

  const permanentWarehouses = useMemo(
    () => warehouses.filter(w => !w.isTemporary),
    [warehouses]
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const params = {};
    if (warehouseId) params.warehouse_id = warehouseId;
    if (dateFrom)    params.date_from    = dateFrom;
    if (dateTo)      params.date_to      = dateTo;
    if (search)      params.search       = search;

    api.get('/reports/inventory-summary', { params })
      .then(res => {
        if (!cancelled) setProducts(res.data.products);
      })
      .catch(err => {
        if (!cancelled) setError(err.response?.data?.message ?? 'Failed to load inventory summary.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [warehouseId, dateFrom, dateTo, search]);

  // Strip trailing decimal zeros: "25.000 kg" → "25 kg", "27.500 kg" → "27.5 kg"
  const fmtQty = (qty, unit) => `${parseFloat(qty)} ${unit}`;

  const getWarehouseQty = (product, whId) => {
    const entry = product.warehouses.find(w => w.warehouse_id === whId);
    return entry ? fmtQty(entry.total_quantity, product.unit) : `0 ${product.unit}`;
  };

  const selectedWarehouseName = permanentWarehouses.find(
    w => String(w.id) === warehouseId
  )?.name ?? 'Warehouse';

  const colCount = warehouseId === ''
    ? 3 + permanentWarehouses.length + 1
    : 4;

  const handleExportPdf = () => {
    const warehouseHeaders = warehouseId === ''
      ? permanentWarehouses.map(w => w.name)
      : [selectedWarehouseName];
    const grandTotalHeader = warehouseId === '' ? ['Grand Total'] : [];
    const columns = ['Product SKU', 'Product Name', 'Unit', ...warehouseHeaders, ...grandTotalHeader];

    const rows = products.map(p => {
      const cells = [p.sku_code, p.product_name, p.unit];
      if (warehouseId === '') {
        permanentWarehouses.forEach(w => cells.push(getWarehouseQty(p, w.id)));
        cells.push(fmtQty(p.grand_total, p.unit));
      } else {
        cells.push(getWarehouseQty(p, Number(warehouseId)));
      }
      return cells;
    });

    exportTablePdf({
      title: 'Inventory Summary Report',
      filename: 'inventory-summary.pdf',
      orientation: 'landscape',
      columns,
      rows,
    });
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <div className="p-6">
        <div className="bg-white rounded shadow">
          <ReportsFilterBar
            warehouses={warehouses}
            currentType="inventory-summary"
            onTypeChange={() => {}}
            warehouseId={warehouseId}
            onWarehouseChange={setWarehouseId}
            dateFrom={dateFrom}
            onDateFromChange={setDateFrom}
            dateTo={dateTo}
            onDateToChange={setDateTo}
            search={search}
            onSearchChange={setSearch}
            showPdfButton={true}
            onExportPdf={handleExportPdf}
          />

          {error && <p className="px-4 py-3 text-red-500 text-sm">{error}</p>}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-white" style={{ backgroundColor: '#1A381E' }}>
                  <th className="text-left font-semibold px-4 py-3">Product SKU</th>
                  <th className="text-left font-semibold px-4 py-3">Product Name</th>
                  <th className="text-left font-semibold px-4 py-3">Unit</th>
                  {warehouseId === '' ? (
                    <>
                      {permanentWarehouses.map(w => (
                        <th key={w.id} className="text-left font-semibold px-4 py-3">{w.name}</th>
                      ))}
                      <th className="text-left font-semibold px-4 py-3">Grand Total</th>
                    </>
                  ) : (
                    <th className="text-left font-semibold px-4 py-3">{selectedWarehouseName}</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={colCount} className="px-4 py-6 text-center text-gray-400">Loading…</td>
                  </tr>
                )}
                {!loading && !error && products.length === 0 && (
                  <tr>
                    <td colSpan={colCount} className="px-4 py-6 text-center text-gray-400">
                      No inventory data to display.
                    </td>
                  </tr>
                )}
                {!loading && !error && products.map((product, idx) => (
                  <tr
                    key={product.product_id}
                    className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-gray-700">{product.sku_code}</td>
                    <td className="px-4 py-3 text-gray-800">{product.product_name}</td>
                    <td className="px-4 py-3 text-gray-600">{product.unit}</td>
                    {warehouseId === '' ? (
                      <>
                        {permanentWarehouses.map(w => (
                          <td key={w.id} className="px-4 py-3 text-gray-600">
                            {getWarehouseQty(product, w.id)}
                          </td>
                        ))}
                        <td className="px-4 py-3 text-gray-700 font-medium">
                          {fmtQty(product.grand_total, product.unit)}
                        </td>
                      </>
                    ) : (
                      <td className="px-4 py-3 text-gray-600">
                        {getWarehouseQty(product, Number(warehouseId))}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
