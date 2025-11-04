const { getSentryExpoConfig } = require("@sentry/react-native/metro");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getSentryExpoConfig(__dirname);

// Add Hermes-specific configuration to prevent read-only property conflicts
config.transformer = {
  ...config.transformer,
  unstable_profile: "hermes-stable", // Use stable Hermes profile
};

module.exports = config;