/** App routes for payments. */
export const PAYMENTS_PATH = '/payments';

export function paymentHref(id: string): string {
  return `${PAYMENTS_PATH}/${encodeURIComponent(id)}`;
}

/** sessionStorage key for the list's last query, so "‹ Payments" restores the view. */
export const LAST_LIST_QUERY_KEY = 'payments:last-list-query';

const MAX_QUERY_LENGTH = 2000;

/** Back link to the list, restoring a stored `?query` when it is well formed. */
export function paymentsListHref(storedQuery: string | null | undefined): string {
  if (!storedQuery || storedQuery === '?') return PAYMENTS_PATH;
  const valid =
    storedQuery.startsWith('?') &&
    storedQuery.length <= MAX_QUERY_LENGTH &&
    !/[#\s]/.test(storedQuery);
  return valid ? `${PAYMENTS_PATH}${storedQuery}` : PAYMENTS_PATH;
}
