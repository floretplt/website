import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

let supabaseHost = "localhost";
try {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    supabaseHost = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname;
  }
} catch {
  /* ignore */
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: [
          "**/node_modules/**",
          "**/.git/**",
          "**/.cursor/**",
          // Large camera dumps in repo root (not app imports) — fewer watchers, avoids EMFILE on macOS.
          "**/IMG_*.jpg",
          "**/IMG_*.JPG",
        ],
      };
    }
    return config;
  },
  images: {
    /** Serve modern formats when the browser supports them (smaller than JPEG). */
    formats: ["image/avif", "image/webp"],
    /** How long the optimized image is cached (CDN / Image Optimization). */
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [
      {
        protocol: "https",
        hostname: supabaseHost,
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
  async headers() {
    const security = [
      { key: "X-DNS-Prefetch-Control", value: "on" },
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=()",
      },
      // Nonce-free CSP directives that are safe regardless of inline scripts:
      // frame-ancestors supersedes X-Frame-Options in modern browsers.
      // object-src blocks Flash/plugin injection.
      // base-uri prevents <base> tag hijacking.
      {
        key: "Content-Security-Policy",
        value: "frame-ancestors 'self'; object-src 'none'; base-uri 'self';",
      },
    ];
    if (process.env.NODE_ENV === "production") {
      security.push({
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      });
    }
    return [{ source: "/:path*", headers: security }];
  },
};

export default withNextIntl(nextConfig);
