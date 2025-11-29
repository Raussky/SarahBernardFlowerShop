const { withAndroidManifest } = require('@expo/config-plugins');

/**
 * Config plugin to enable resizeable activity and remove screen orientation restrictions
 * This fixes Android 15/16 compatibility issues with large screens
 */
const withAndroidResizeableActivity = (config) => {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;
    const mainApplication = androidManifest.manifest.application[0];

    if (mainApplication && mainApplication.activity) {
      mainApplication.activity.forEach((activity) => {
        if (activity.$['android:name'] === '.MainActivity') {
          // Remove screenOrientation attribute
          delete activity.$['android:screenOrientation'];

          // Add resizeableActivity attribute (boolean for New Architecture)
          activity.$['android:resizeableActivity'] = true;
        }
      });
    }

    return config;
  });
};

module.exports = withAndroidResizeableActivity;
