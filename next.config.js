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
  // TEMPORARY, this-branch-only: proxy the listing-search endpoints to the
  // standalone Go search service (github.com/Aryan-Arora/search-service-backend)
  // for integration testing, instead of this app's own route handlers.
  // beforeFiles makes the rewrite win over the filesystem routes at
  // src/app/api/{search,locations,hotels}, so those route.ts files never
  // run while this is in place. Remove this block (and revert to the
  // original route handlers) once the search service is the confirmed,
  // permanent backend for these three endpoints.
  async rewrites() {
    const searchServiceUrl =
      process.env.SEARCH_SERVICE_URL || 'https://search-service-backend.vercel.app';
    return {
      beforeFiles: [
        { source: '/api/search', destination: `${searchServiceUrl}/api/search` },
        { source: '/api/locations', destination: `${searchServiceUrl}/api/locations` },
        { source: '/api/hotels', destination: `${searchServiceUrl}/api/hotels` },
      ],
    };
  },
};

module.exports = nextConfig;
