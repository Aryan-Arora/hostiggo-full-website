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
};

module.exports = nextConfig;
