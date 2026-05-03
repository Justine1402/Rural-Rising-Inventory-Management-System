export default function StatusBadge({ status }) {
  const base = 'inline-block rounded-full px-3 py-0.5 text-xs font-medium';
  const green = 'bg-green-100 text-green-800';
  const red = 'bg-red-100 text-red-700';
  const isGreen = status === 'In Stock' || status === 'Accomplished';
  return <span className={`${base} ${isGreen ? green : red}`}>{status}</span>;
}
