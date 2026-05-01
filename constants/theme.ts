/*
 * File: constants/theme.ts
 * Purpose: Defines the color system for light and dark mode across the entire app.
 * All hardcoded colors in components should reference this file for consistency.
 */

import { Platform } from "react-native";

// Base tint colors for navigation and active states
const tintColorLight = "#0a7ea4";
const tintColorDark = "#fff";

export const Colors = {
  light: {
    // Core UI colors (standard across both modes)
    text: "#11181C",
    background: "#fff",
    tint: tintColorLight,
    icon: "#687076",
    tabIconDefault: "#687076",
    tabIconSelected: tintColorLight,

    // App-specific theme colors for StayonTrack
    primary: "#6f92d6", // Hero section backgrounds, primary headers
    success: "#79bd00", // Track progress, completed items, active states
    accent: "#4d77ad", // Buttons, active tab indicators, important actions
    cardBackground: "#5a5a5a", // Secondary cards and containers
    cardBorder: "#2e2e2e", // Borders for cards and form elements
    warning: "#f6c15b", // Floating action button (FAB), warning states
    error: "#b00020", // Error messages, destructive actions
    notification: "#f5fd13", // Star icon, notification badges
    darkBackground: "#0b0b0b", // Screen backgrounds in dark sections
    lightBackground: "#f7f7f7", // Input fields, light card backgrounds
    mutedText: "#666666", // Secondary text, labels, metadata
    placeholderText: "#7a7a7a", // Input placeholder text
    stationTrack: "#2d2d2d", // Train track base color
    stationMarker: "#f6e6c5", // Station markers on the route map
    stationBorder: "#3a2e1c", // Borders for station markers
  },
  dark: {
    // Dark mode equivalents - maintains same semantic meaning with darker values
    text: "#ECEDEE",
    background: "#151718",
    tint: tintColorDark,
    icon: "#9BA1A6",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: tintColorDark,

    primary: "#6f92d6",
    success: "#79bd00",
    accent: "#4d77ad",
    cardBackground: "#5a5a5a",
    cardBorder: "#2e2e2e",
    warning: "#f6c15b",
    error: "#b00020",
    notification: "#f5fd13",
    darkBackground: "#0b0b0b",
    lightBackground: "#2a2a2a", // Darker than light mode for contrast
    mutedText: "#aaaaaa", // Brighter than light mode for visibility
    placeholderText: "#7a7a7a",
    stationTrack: "#2d2d2d",
    stationMarker: "#f6e6c5",
    stationBorder: "#3a2e1c",
  },
};

// Font configurations per platform for consistent typography
export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
