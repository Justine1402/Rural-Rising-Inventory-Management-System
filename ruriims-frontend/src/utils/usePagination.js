import { useState } from 'react';

// Rows per page for tables that carry the warehouse-tabs footer (inventory + list pages).
export const DEFAULT_PAGE_SIZE = 9;

// Reports pages have no warehouse-tabs footer / search-bar row, so more rows fit.
export const REPORTS_PAGE_SIZE = 14;

// Transaction-list pages (Receive Orders, Transfer Requests, Reconciliation) have
// single-line rows and no search bar, so more rows are needed to match the
// Dashboard's (taller two-line row) card height.
export const LIST_PAGE_SIZE = 15;

// When a list has zero real rows, padding all the way to a full page (15 rows)
// leaves a huge blank gap under the "No X yet" message. Cap the empty-state
// filler at a smaller, fixed row count instead — tune this to taste.
export const EMPTY_STATE_FILLER_ROWS = 11;

/**
 * Client-side pagination over an already-filtered/sorted array.
 *
 * @param {Array}  items              The full displayed array (post filter/sort).
 * @param {Object} options
 * @param {number} options.pageSize   Rows per page (defaults to DEFAULT_PAGE_SIZE).
 * @param {*}      options.resetKey   When this value changes, the page resets to 1
 *                                    (e.g. a string of the active filter/search values).
 * @returns {{ page: number, setPage: Function, totalPages: number, pageItems: Array }}
 */
export function usePagination(items, { pageSize = DEFAULT_PAGE_SIZE, resetKey } = {}) {
  const [page, setPage] = useState(1);
  const [prevKey, setPrevKey] = useState(resetKey);

  // Reset to the first page whenever the filter/search context changes. Adjusting
  // state during render (React's recommended pattern over an effect) re-renders
  // immediately with the corrected page, so there is no extra commit or flicker.
  if (resetKey !== prevKey) {
    setPrevKey(resetKey);
    setPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  // Derive the safe page so a shrinking list never leaves us on an empty page.
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const pageItems = items.slice(start, start + pageSize);

  // Empty rows to pad a short page up to a full page, so the table — and the
  // controls below it — always hold a constant height. A truly empty list gets
  // a smaller fixed filler count instead, so the "No X yet" message isn't
  // followed by an oversized blank gap.
  const fillerCount = pageItems.length > 0
    ? pageSize - pageItems.length
    : EMPTY_STATE_FILLER_ROWS;

  return { page: safePage, setPage, totalPages, pageItems, fillerCount };
}
