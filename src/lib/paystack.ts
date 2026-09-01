declare global {
  interface Window {
    PaystackPop: {
      setup: (config: PaystackConfig) => PaystackHandler;
    };
  }
}

interface PaystackConfig {
  key: string;
  email: string;
  amount: number;
  currency: string;
  ref: string;
  metadata?: Record<string, unknown>;
  callback: (response: PaystackResponse) => void;
  onClose: () => void;
}

interface PaystackHandler {
  openIframe: () => void;
}

export interface PaystackResponse {
  reference: string;
  trans: string;
  status: string;
  message: string;
  transaction: string;
  trxref: string;
}

let paystackScriptLoaded = false;

export function loadPaystackScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (paystackScriptLoaded && window.PaystackPop) {
      resolve();
      return;
    }

    const existing = document.querySelector('script[src*="paystack"]');
    if (existing) {
      paystackScriptLoaded = true;
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    script.onload = () => {
      paystackScriptLoaded = true;
      resolve();
    };
    script.onerror = () => reject(new Error('Failed to load Paystack'));
    document.head.appendChild(script);
  });
}

export function initiatePayment({
  email,
  amountPesewas,
  reference,
  metadata,
  onSuccess,
  onClose,
}: {
  email: string;
  amountPesewas: number;
  reference: string;
  metadata?: Record<string, unknown>;
  onSuccess: (response: PaystackResponse) => void;
  onClose: () => void;
}) {
  const handler = window.PaystackPop.setup({
    key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!,
    email,
    amount: amountPesewas,
    currency: 'GHS',
    ref: reference,
    metadata,
    callback: onSuccess,
    onClose,
  });

  handler.openIframe();
}

export function generateReference(): string {
  return `vote_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}
