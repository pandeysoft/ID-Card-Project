export const typography = {
  sizes: {
    title: 32,
    heading: 24,
    body: 16,
    small: 14,
    caption: 12,
  },
} as const;

export type TypographySizeToken = keyof typeof typography.sizes;
