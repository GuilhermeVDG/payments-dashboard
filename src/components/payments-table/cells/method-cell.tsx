import type { ComponentType } from 'react';
import { describeMethod, maskedLast4 } from '@/domain/display';
import { assertNever, type CardBrand, type PaymentMethod, type Wallet } from '@/domain/payment';
import {
  AmexMark,
  ApplePayMark,
  BankMark,
  DiscoverMark,
  GooglePayMark,
  MastercardMark,
  VisaMark,
} from '@/components/ui/icons';

const BRAND_MARKS: Record<CardBrand, ComponentType> = {
  visa: VisaMark,
  mastercard: MastercardMark,
  amex: AmexMark,
  discover: DiscoverMark,
};

const WALLET_MARKS: Record<Wallet, ComponentType> = {
  apple_pay: ApplePayMark,
  google_pay: GooglePayMark,
};

function Marks({ method }: { method: PaymentMethod }) {
  switch (method.type) {
    case 'card': {
      const Brand = BRAND_MARKS[method.brand];
      return <Brand />;
    }
    case 'ach':
      return <BankMark />;
    case 'wallet': {
      const WalletMark = WALLET_MARKS[method.wallet];
      const Brand = BRAND_MARKS[method.brand];
      return (
        <>
          <WalletMark />
          <Brand />
        </>
      );
    }
    default:
      return assertNever(method);
  }
}

/** Wallet mark (if any), brand or bank mark, then `•••• 4242`. */
export function MethodCell({ method }: { method: PaymentMethod }) {
  const description = describeMethod(method);
  return (
    <span className="method-cell inline-flex items-center justify-end gap-1.5" title={description}>
      <span aria-hidden className="method-cell__marks inline-flex items-center gap-1">
        <Marks method={method} />
      </span>
      <span aria-hidden className="method-cell__last4 tabular whitespace-nowrap text-fg">
        {maskedLast4(method.last4)}
      </span>
      <span className="sr-only">{description}</span>
    </span>
  );
}
