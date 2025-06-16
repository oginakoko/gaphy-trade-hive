export const BACKGROUND_IMAGES = {
  default: '/backgrounds/Copilot_20250616_131412.png',
} as const;

export type BackgroundImage = keyof typeof BACKGROUND_IMAGES;
