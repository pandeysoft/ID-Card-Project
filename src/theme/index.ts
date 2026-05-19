export { colors, type ColorToken } from "./colors";
export { spacing, type SpacingToken } from "./spacing";
export { typography, type TypographySizeToken } from "./typography";

import { colors } from "./colors";
import { spacing } from "./spacing";
import { typography } from "./typography";

export const cardiqLightTheme = {
  colors,
  spacing,
  typography,
} as const;

export type CardiqLightTheme = typeof cardiqLightTheme;
