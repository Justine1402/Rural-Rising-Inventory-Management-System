// Shared discrepancy formatting for Reconciliation pages.
// Used by ReconciliationFormPage (Stage 3) and ReconciliationReviewPage (Stage 4).

export const EPSILON = 0.0005;

// Trim trailing zeros from a decimal.
// Accepts number or numeric string.
//   trimDecimal(1)       -> "1"
//   trimDecimal("1.500") -> "1.5"
//   trimDecimal(1.234)   -> "1.234"
const trimDecimal = (n) => parseFloat(n).toFixed(3).replace(/\.?0+$/, '');

// Format a discrepancy value for display.
// Returns { label, color } where color is a hex string suitable for
// inline `style={{ color }}` usage, or null if the discrepancy is not
// computable (null, undefined, or NaN input).
//
//   disc < 0  -> { label: "-2 KG",  color: '#DC2626' }  (red, shortage)
//   disc ≈ 0  -> { label: "0 KG",   color: '#000000' }  (black, matched)
//   disc > 0  -> { label: "+2 KG",  color: '#16A34A' }  (green, surplus)
//
// `disc` may be a number or numeric string (e.g. PHP decimal cast output).
export const formatDiscrepancy = (disc, unit) => {
  if (disc === null || disc === undefined) return null;
  const d = parseFloat(disc);
  if (Number.isNaN(d)) return null;
  if (Math.abs(d) < EPSILON) {
    return { label: `0 ${unit}`, color: '#000000' };
  }
  const sign = d > 0 ? '+' : '';
  return {
    label: `${sign}${trimDecimal(d)} ${unit}`,
    color: d < 0 ? '#DC2626' : '#16A34A',
  };
};

// Format an "expected → actual" string for the Inventory Adjustment sub-table.
//   formatAdjustmentArrow("25.000", "23.000", "KG") -> "25 KG → 23 KG"
export const formatAdjustmentArrow = (expected, actual, unit) =>
  `${trimDecimal(expected)} ${unit} → ${trimDecimal(actual)} ${unit}`;
