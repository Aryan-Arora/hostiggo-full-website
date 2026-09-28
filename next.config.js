/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'i.pravatar.cc' },
      { protocol: 'https', hostname: 'jhihqmkqvbwfniwculhk.supabase.co' },
      // Google account profile photos (user_metadata.avatar_url / picture
      // from Google OAuth) -- shown on the onboarding screen and profile.
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
    // Next 16 requires local images to be explicitly allow-listed,
    // especially ones with a query string (e.g. the hero photo's cache-
    // buster). Everything served from /public here is our own fixed,
    // trusted set of static assets, not a user-controlled path, so a broad
    // allow is safe.
    localPatterns: [{ pathname: '/**' }],
    // The hero image explicitly requests quality={95}; Next 16 requires
    // any quality value actually used in the app to be allow-listed here.
    qualities: [75, 95],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 604800,
    deviceSizes: [360, 640, 828, 1080, 1200, 1920],
  },
  // Proxy listing-search and location-lookup to the standalone Go search
  // service (github.com/Aryan-Arora/search-service-backend) instead of this
  // app's own route handlers. beforeFiles makes the rewrite win over the
  // filesystem routes at src/app/api/{search,locations}, so those route.ts
  // files never run while this is in place.
  //
  // /api/hotels is deliberately NOT proxied here: this app's route also
  // serves GET /api/hotels?ids=1,2,3 (card lookups for Recently Viewed /
  // wishlist, added after this Go service was first built), which the Go
  // service's HotelsService only supports as a location-scoped teaser
  // query (?locationId=&limit=), not an arbitrary ID list. Proxying it as-is
  // would silently return empty results for every ids= lookup. Add /api/hotels
  // back here once the Go service supports that query shape too.
  async rewrites() {
    const searchServiceUrl =
      process.env.SEARCH_SERVICE_URL || 'https://search-service-backend.vercel.app';
    return {
      beforeFiles: [
        { source: '/api/search', destination: `${searchServiceUrl}/api/search` },
        { source: '/api/locations', destination: `${searchServiceUrl}/api/locations` },
      ],
    };
  },
};

module.exports = nextConfig;
