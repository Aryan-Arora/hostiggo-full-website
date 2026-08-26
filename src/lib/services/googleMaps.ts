/**
 * Loader for the Google Maps JavaScript API (with the Places library).
 * Injects the script tag once and caches the loading promise so every map
 * component / geocoding call on the page shares a single script load.
 */

let loadPromise: Promise<typeof google> | null = null;

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
