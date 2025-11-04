import { Dimensions, Platform, StatusBar } from 'react-native';

const { width, height } = Dimensions.get('window');

// Device dimension constants
export const DEVICE = {
  width,
  height,
  isSmallDevice: width < 375,
  isLargeDevice: width >= 414,
  isTablet: Platform.OS === 'ios' ? width >= 768 : width >= 600,
  isLandscape: width > height,
};

// Calculate adaptive tab bar dimensions based on screen size
const calculateTabBarHeight = () => {
  if (Platform.OS === 'android') {
    // Android devices often need slightly different sizing
    if (DEVICE.isSmallDevice) {
      return 65;
    } else if (DEVICE.isLargeDevice) {
      return 80; // Slightly smaller for Android large devices
    }
    return 70; // Standard Android height
  } else {
    // iOS devices
    if (DEVICE.isSmallDevice) {
      return 65;
    } else if (DEVICE.isLargeDevice) {
      return 75;
    }
    return 75;
  }
};

const calculateTabBarBorderRadius = () => {
  if (Platform.OS === 'android') {
    // Android devices often prefer slightly more rounded corners
    if (DEVICE.isSmallDevice) {
      return 25;
    } else if (DEVICE.isLargeDevice) {
      return 35;
    }
    return 30;
  } else {
    // iOS devices
    if (DEVICE.isSmallDevice) {
      return 28;
    } else if (DEVICE.isLargeDevice) {
      return 38;
    }
    return 32;
  }
};

// UI Constants - Adaptive
export const TAB_BAR_HEIGHT = calculateTabBarHeight();
export const TAB_BAR_BORDER_RADIUS = calculateTabBarBorderRadius();
export const TAB_BAR_HORIZONTAL_MARGIN = 16; // Consistent margin for sides

// Additional adaptive constants
export const ICON_SIZE = DEVICE.isSmallDevice ? 22 : 24;
export const FONT_SIZE_TAB_LABEL = DEVICE.isSmallDevice ? 11 : 12;

// Safe area offsets for different devices
export const SAFE_AREA_BOTTOM = Platform.select({
  ios: 34,
  android: 20,
});

// Dynamic content container padding based on device
export const CONTENT_PADDING_BOTTOM = TAB_BAR_HEIGHT + 20;

// Check for devices with notch and Android cutouts
export const hasNotch = () => {
  // iOS devices with notch
  if (Platform.OS === 'ios' && (height >= 812 || width >= 812)) {
    return true;
  }
  
  // Android devices with cutouts (using a more reliable method)
  if (Platform.OS === 'android') {
    // For Android, check if status bar height is larger than normal (indicating cutout)
    return StatusBar.currentHeight > 24;
  }
  
  return false;
};

// Calculate adaptive bottom offset for tab bar
export const TAB_BAR_BOTTOM_OFFSET = Platform.OS === 'android' 
  ? (hasNotch() ? 25 : 15)  // Samsung and other Android devices with cutouts need more space
  : (hasNotch() ? 20 : 10); // iOS devices

// Export common screen dimensions
export const SCREEN = {
  WIDTH: width,
  HEIGHT: height,
  SCALE: width / 375, // Scale factor relative to iPhone SE size
};