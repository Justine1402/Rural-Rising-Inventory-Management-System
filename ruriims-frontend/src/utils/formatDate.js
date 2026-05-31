// Shared date formatter for reports and detail pages.
// Returns 'MMM D, YYYY' (en-US locale) or '—' when input is missing.

export const formatDate = (d) => {
  if (!d || d === '—') return '—';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
};
