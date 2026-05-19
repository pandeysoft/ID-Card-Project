export const colors = {
  background: "#F8FAFC",
  surface: "#FFFFFF",
  card: "#FFFFFF",
  text: "#111827",
  mutedText: "#667085",
  border: "#E5E7EB",
  primary: "#2454D6",
  primarySoft: "#EAF0FF",
  success: "#16A34A",
  warning: "#D97706",
  danger: "#DC2626",
} as const;

export type ColorToken = keyof typeof colors;
