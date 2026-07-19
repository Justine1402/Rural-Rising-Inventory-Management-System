// Centered empty-state row: message on top, a small outline icon below it for
// visual weight. Reuses the app's inline-SVG icon convention (stroke=currentColor).
export default function EmptyState({ colSpan, message }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-5 py-10 text-center text-gray-400">
        <div className="flex flex-col items-center gap-2">
          <span>{message}</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-9 w-9 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V7a2 2 0 00-2-2H6a2 2 0 00-2 2v6m16 0l-2.5 5.5a2 2 0 01-1.8 1.5H8.3a2 2 0 01-1.8-1.5L4 13m16 0h-4.5a1 1 0 00-.9.6l-.6 1.4a1 1 0 01-.9.6h-2.2a1 1 0 01-.9-.6l-.6-1.4a1 1 0 00-.9-.6H4" />
          </svg>
        </div>
      </td>
    </tr>
  );
}
