/*
 * File: lib/avatar-utils.ts
 * Purpose: Provides deterministic avatar selection based on username.
 * The same username always gets the same avatar image and color scheme.
 * This ensures consistent user identity across sessions without storing preferences.
 */

import type { ImageSourcePropType } from "react-native";

/**
 * Color pair used to style the avatar ring/background.
 * outer: the outer ring color
 * inner: the inner background color behind the avatar image
 */
export type AvatarTheme = {
  outer: string;
  inner: string;
};

/**
 * The selected avatar image plus its matching theme colors.
 */
export type DeterministicAvatar = {
  icon: ImageSourcePropType;
  colors: AvatarTheme;
};

/**
 * Local train avatar images.
 * Keep these paths static so Metro can bundle them correctly.
 */
const TRAIN_AVATARS: ImageSourcePropType[] = [
  require("@/assets/images/avatars/bnsf.png"),
  require("@/assets/images/avatars/express.png"),
  require("@/assets/images/avatars/passenger.png"),
  require("@/assets/images/avatars/steam_two.png"),
];

/**
 * Available avatar color themes.
 * Each theme pairs an outer ring color with an inner background color.
 */
const AVATAR_COLOR_PAIRS: AvatarTheme[] = [
  { outer: "#4d77ad", inner: "#d7e6ff" }, // Blue theme
  { outer: "#1f6f78", inner: "#d9fbff" }, // Teal theme
  { outer: "#6b5b95", inner: "#efe6ff" }, // Purple theme
  { outer: "#7a8f00", inner: "#eff8c9" }, // Green theme
  { outer: "#b35c1e", inner: "#ffe8d6" }, // Orange theme
  { outer: "#355c7d", inner: "#dbefff" }, // Navy theme
];

/**
 * Turns a username/string seed into a stable numeric hash.
 * The same seed always maps to the same number, ensuring deterministic selection.
 *
 * @param seed - The input string (typically username)
 * @returns A stable hash number between 0 and 99999
 */
export function buildSeedHash(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 100000;
  }
  return hash;
}

/**
 * Returns both the train avatar image and a color pair based on the seed.
 * Used for profile pages where both the image and theme colors are needed.
 *
 * @param seed - The input string (typically username)
 * @returns DeterministicAvatar containing the image and color theme
 */
export function getDeterministicAvatar(seed: string): DeterministicAvatar {
  const hash = buildSeedHash(seed);
  return {
    icon: TRAIN_AVATARS[hash % TRAIN_AVATARS.length],
    colors: AVATAR_COLOR_PAIRS[hash % AVATAR_COLOR_PAIRS.length],
  };
}

/**
 * Returns only the train image for places like the animated route header.
 * More lightweight than getDeterministicAvatar when colors aren't needed.
 *
 * @param seed - The input string (typically username)
 * @returns The train avatar image source
 */
export function getDeterministicTrainAvatar(seed: string): ImageSourcePropType {
  const hash = buildSeedHash(seed);
  return TRAIN_AVATARS[hash % TRAIN_AVATARS.length];
}
