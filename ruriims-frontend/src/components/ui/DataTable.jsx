export default function DataTable({ columns = [], data = [] }) {
  return (
    <div className="overflow-hidden rounded-xl shadow">
      <table className="w-full text-sm">
        <thead>
          <tr style={{ backgroundColor: '#1A381E' }}>
            {columns.map((col) => (
              <th
                key={col.key}
                className="text-left font-semibold text-white px-5 py-3"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="text-center text-gray-400 py-12 text-sm"
              >
                No data available
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr
                key={i}
                className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-5 py-3 text-gray-700">
                    {row[col.key] ?? '—'}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
