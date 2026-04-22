import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  serverExternalPackages: [
    "bullmq",
    "ioredis",
    "@aws-sdk/client-ecs",
    "@aws-sdk/client-s3",
    "@aws-sdk/client-secrets-manager",
    "@aws-sdk/client-cloudwatch-logs",
    "@aws-sdk/s3-request-presigner",
    "bcryptjs",
    "stripe",
    "@anthropic-ai/sdk",
  ],

  webpack: (config) => {
    // TypeScript's moduleResolution:Bundler allows .js imports to resolve to .ts files.
    // Webpack doesn't do this natively — this extensionAlias config teaches it to.
    config.resolve.extensionAlias = {
      ".js": [".ts", ".tsx", ".js"],
      ".mjs": [".mts", ".mjs"],
    };
    return config;
  },
};

export default config;
