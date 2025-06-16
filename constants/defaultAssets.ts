export const DEFAULT_ASSETS = {
  avatar: '/images/avatars/default-avatar.png',
  server: '/images/servers/default-server.png',
  ad: '/images/ads/default-ad.png',
  default: '/images/default.png'
} as const;

export type DefaultAsset = keyof typeof DEFAULT_ASSETS;

export const getDefaultAsset = (assetKey: DefaultAsset = 'default') => {
  return DEFAULT_ASSETS[assetKey];
};
