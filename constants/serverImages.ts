export const SERVER_IMAGES = {
  default: '/images/servers/Copilot_20250616_131412.png',
} as const;

export type ServerImage = keyof typeof SERVER_IMAGES;

export const getServerImageUrl = (imageKey: ServerImage = 'default') => {
  return SERVER_IMAGES[imageKey];
};
