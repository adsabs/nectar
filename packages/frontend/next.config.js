const { resolve } = require('path');
require('dotenv').config({
  path: resolve(__dirname, '../../.env')
});

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true'
});

module.exports = withBundleAnalyzer({});
