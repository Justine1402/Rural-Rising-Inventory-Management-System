import Navbar from '../../components/layout/Navbar';
import WarehouseTabs from '../../components/layout/WarehouseTabs';

const ROWS = [
  { name: 'Mango',    main: '25 KG', alabang: '50 KG', mandaluyong: '0 KG',  harvest: 'Dec 14, 2025', status: 'In Stock' },
  { name: 'Egg Plant',main: '30 KG', alabang: '60 KG', mandaluyong: '10 KG', harvest: 'Dec 11, 2025', status: 'In Stock' },
  { name: 'Banana',   main: '10 KG', alabang: '10 KG', mandaluyong: '10 KG', harvest: 'Dec 1, 2025',  status: 'In Stock' },
  { name: 'Garlic',   main: '10 KG', alabang: '10 KG', mandaluyong: '10 KG', harvest: 'Nov 30, 2025', status: 'In Stock' },
  { name: 'Onion',    main: '10 KG', alabang: '10 KG', mandaluyong: '10 KG', harvest: 'Nov 25, 2025', status: 'In Stock' },
  { name: 'Tomatoes', main: '30 KG', alabang: '30 KG', mandaluyong: '30 KG', harvest: 'Nov 24, 2025', status: 'In Stock' },
  { name: 'Cabbage',  main: '0 KG',  alabang: '0 KG',  mandaluyong: '0 KG',  harvest: '—',            status: 'Out of Stock' },
];

function StatusBadge({ status }) {

  const base = 'inline-block rounded-full px-3 py-0.5 text-xs font-medium';
  if (status === 'In Stock')
    return <span className={`${base} bg-green-100 text-green-800`}>{status}</span>;
  return <span className={`${base} bg-red-100 text-red-700`}>{status}</span>;
}

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Navbar />

      <main className="flex-1 p-5">
        <div className="bg-white rounded-xl shadow overflow-hidden">

          {/* Inventory Table */}
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#1B4D2E] text-white">
                <th className="text-left font-semibold px-5 py-3">Name</th>
                <th className="text-left font-semibold px-5 py-3">Main Warehouse</th>
                <th className="text-left font-semibold px-5 py-3">Alabang Warehouse</th>
                <th className="text-left font-semibold px-5 py-3">Mandaluyong Warehouse</th>
                <th className="text-left font-semibold px-5 py-3">Harvest Date</th>
                <th className="text-left font-semibold px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => (
                <tr key={row.name} className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer">
                  <td className="px-5 py-3 text-gray-800">{row.name}</td>
                  <td className="px-5 py-3 text-gray-600">{row.main}</td>
                  <td className="px-5 py-3 text-gray-600">{row.alabang}</td>
                  <td className="px-5 py-3 text-gray-600">{row.mandaluyong}</td>
                  <td className="px-5 py-3 text-gray-600">{row.harvest}</td>
                  <td className="px-5 py-3">
                    <StatusBadge status={row.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Warehouse Tabs */}
          <WarehouseTabs />

        </div>
      </main>
    </div>
  );
}
