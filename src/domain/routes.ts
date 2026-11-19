/** App routes for payments. */
export const PAYMENTS_PATH = '/payments';

export function paymentHref(id: string): string {
  return `${PAYMENTS_PATH}/${encodeURIComponent(id)}`;
}
