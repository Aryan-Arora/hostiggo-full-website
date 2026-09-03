/**
 * Loader for the Google Maps JavaScript API (with the Places library).
 * Injects the script tag once and caches the loading promise so every map
 * component / geocoding call on the page shares a single script load.
 */

let loadPromise: Promise<typeof google> | null = null;

// Google's documented global callback for a bad/restricted/unbilled API key
// (InvalidKeyMapError and friends): https://developers.google.com/maps/documentation/javascript/events#auth-errors
// The Maps script itself still loads and calls our own load callback below
// even when the key is invalid -- the SDK only reports the failure via
// this separate global hook (and a console error), not by rejecting
// anything. Without wiring it up, every map on the page rendered broken
// with no way for the app to know and show a fallback instead of a dead
// gray tile grid. Registered once; every InteractiveMap/MapPreview
// instance subscribes so all of them can fall back together.
const authFailureListeners = new Set<() => void>();

export function onGoogleMapsAuthFailure(cb: () => void): () => void {
  authFailureListeners.add(cb);
  return () => authFailureListeners.delete(cb);
}

if (typeof window !== 'undefined' && !(window as any).gm_authFailure) {
  (window as any).gm_authFailure = () => {
    authFailureListeners.forEach((cb) => cb());
  };
}

export function loadGoogleMaps(): Promise<typeof google> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('loadGoogleMaps can only run in the browser'));
  }

  if (window.google?.maps) {
    return Promise.resolve(window.google);
  }

  if (loadPromise) return loadPromise;

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return Promise.reject(
      new Error('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set'),
    );
  }

  loadPromise = new Promise((resolve, reject) => {
    const callbackName = '__hostiggoGoogleMapsLoaded';

    (window as any)[callbackName] = () => {
      delete (window as any)[callbackName];
      resolve(window.google);
    };

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
      apiKey,
    )}&libraries=places&callback=${callbackName}`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      loadPromise = null;
      reject(new Error('Failed to load Google Maps script'));
    };

    document.head.appendChild(script);
  });

  return loadPromise;
}
