export const TRADE_IMAGES = {
  default: '/images/trades/Copilot_20250616_131412.png',
} as const;

export type TradeImage = keyof typeof TRADE_IMAGES;

export const getTradeImageUrl = (imageKey: TradeImage = 'default') => {
  return TRADE_IMAGES[imageKey];
};
