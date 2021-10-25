
const withOptimizedImages = require('next-optimized-images');

module.exports = withOptimizedImages({
  /* config for next-optimized-images */
  reactStrictMode: true,
  images: {
    // domains: ['gateway.pinata.cloud'],
    domains: ['chainedvampires.mypinata.cloud'],
  },
  // your config for other plugins or the general next.js here...
});
