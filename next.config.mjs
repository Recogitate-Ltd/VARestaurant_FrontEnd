/** @type {import('next').NextConfig} */
const nextConfig = {
  // Wine images come from our S3 bucket (or, until copied, the supplier's
  // site), so they're served as-is rather than through the image optimiser.
  images: { unoptimized: true },
  poweredByHeader: false,
};

export default nextConfig;
