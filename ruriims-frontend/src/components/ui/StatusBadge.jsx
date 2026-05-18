export default function StatusBadge({ status }) {
  const base = 'inline-block rounded-full px-3 py-0.5 text-xs font-medium';

  if (status === 'In Stock' || status === 'Accomplished' || status === 'Complete' || status === 'Active' || status === 'Reviewed') {
    return <span className={`${base} bg-green-100 text-green-800`}>{status}</span>;
  }
  if (status === 'Pending Review') {
    return <span className={`${base} bg-amber-100 text-amber-800`}>{status}</span>;
  }
  return <span className={`${base} bg-red-100 text-red-700`}>{status}</span>;
}
