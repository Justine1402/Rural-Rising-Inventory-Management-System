// Builds a windowed list of page numbers with '...' gaps, e.g. [1, '...', 4, 5, 6, '...', 12].
function getPageRange(page, totalPages) {
  const delta = 1; // pages shown on each side of the current page
  const range = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - delta && i <= page + delta)) {
      range.push(i);
    }
  }

  const withDots = [];
  let prev;
  for (const i of range) {
    if (prev) {
      if (i - prev === 2) withDots.push(prev + 1);        // fill a single gap with the number
      else if (i - prev !== 1) withDots.push('...');       // otherwise collapse to ellipsis
    }
    withDots.push(i);
    prev = i;
  }
  return withDots;
}

// Invisible spacer rows that pad a short (last) page up to a full page, keeping the
// table — and therefore the pagination controls below it — at a constant height.
// `lines` matches the table's row height (2 for the dashboard's date + warehouse-code rows).
export function FillerRows({ count, colSpan, lines = 1 }) {
  if (count <= 0) return null;
  return Array.from({ length: count }).map((_, i) => (
    <tr key={`filler-${i}`} aria-hidden="true">
      <td colSpan={colSpan} className="px-4 py-3">
        {lines === 2 ? (
          <span className="flex flex-col">
            <span className="text-sm">&nbsp;</span>
            <span className="text-xs mt-0.5">&nbsp;</span>
          </span>
        ) : (
          <span className="text-sm">&nbsp;</span>
        )}
      </td>
    </tr>
  ));
}

// Shared page-number bar. Renders nothing when there is only one page.
// Styled to match WarehouseTabs (active = brand green, inactive = white/dark-green outline).
export default function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const pages = getPageRange(page, totalPages);

  const base = 'text-sm font-medium px-3 py-1.5 rounded transition-colors';
  const active = `btn-brand text-white ${base}`;
  const inactive = `bg-white text-[#1A381E] border border-[#1A381E] ${base} hover:bg-green-50`;
  const nav = `bg-white text-[#1A381E] border border-[#1A381E] ${base} hover:bg-green-50 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white`;

  return (
    <div className="flex justify-center items-center gap-2 px-6 py-4">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className={nav}
        aria-label="Previous page"
      >
        ‹ Prev
      </button>

      {pages.map((p, idx) =>
        p === '...' ? (
          <span key={`dots-${idx}`} className="px-1 text-gray-400 select-none">…</span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={p === page ? active : inactive}
            aria-current={p === page ? 'page' : undefined}
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className={nav}
        aria-label="Next page"
      >
        Next ›
      </button>
    </div>
  );
}
