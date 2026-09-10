/**
 * Loader for the Razorpay Checkout script. Injects the script tag once and
 * caches the loading promise, same pattern as loadGoogleMaps() -- every
 * checkout attempt on the page shares a single script load.
 */

export type RazorpayCheckoutOptions = {
  key: string;
  amount: number; // paise
  currency: string;
  order_id: string;
  name?: string;
  description?: string;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string };
  handler: (response: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => void;
  modal?: { ondismiss?: () => void };
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => { open: () => void };
  }
}

let loadPromise: Promise<void> | null = null;

export function loadRazorpayCheckout(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('loadRazorpayCheckout can only run in the browser'));
  }

  if (window.Razorpay) return Promise.resolve();

  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      loadPromise = null;
      reject(new Error('Failed to load Razorpay Checkout'));
    };
    document.head.appendChild(script);
  });

  return loadPromise;
}

/** Opens Razorpay Checkout and resolves with the verified-by-Razorpay (but
 * not yet verified by us -- that happens server-side) success response, or
 * rejects if the guest closes the widget without paying. */
export async function openRazorpayCheckout(
  options: Omit<RazorpayCheckoutOptions, 'handler' | 'modal'>,
): Promise<{ razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }> {
  await loadRazorpayCheckout();
  return new Promise((resolve, reject) => {
    const razorpay = new window.Razorpay!({
      ...options,
      handler: (response) => resolve(response),
      modal: { ondismiss: () => reject(new Error('Payment cancelled.')) },
    });
    razorpay.open();
  });
}
