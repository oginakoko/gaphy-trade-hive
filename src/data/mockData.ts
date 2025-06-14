
import { Twitter, Instagram, Link, BarChart, BookOpen, ShoppingCart } from 'lucide-react';

export const affiliateLinks = [
  {
    title: 'Brokerage',
    url: 'https://one.exnesstrack.org/a/ooc7kof3nr',
    description: 'The broker I use and recommend.',
    icon: BarChart,
  },
  {
    title: 'Fundamental Analysis',
    url: 'https://analyst-hub.vercel.app',
    description: 'My go-to hub for FA.',
    icon: Link,
  },
  {
    title: 'Trading Journal',
    url: 'https://gaphy-journal-pro.vercel.app',
    description: 'Track your trades like a pro.',
    icon: BookOpen,
  },
  {
    title: 'Binance Referral',
    url: 'https://www.binance.com/activity/referral-entry/CPA?ref=CPA_009C3L7CHG',
    description: 'Code: CPA_009C3L7CHG',
    icon: ShoppingCart,
  },
];

export const socialLinks = [
  {
    name: 'Twitter',
    url: 'https://x.com/GAPHY_OFFICIAL',
    icon: Twitter,
  },
  {
    name: 'Instagram',
    url: 'https://www.instagram.com/gaphy_official/',
    icon: Instagram,
  },
];

export const tradeIdeas = [
  {
    id: 1,
    author: 'GAPHY_OFFICIAL',
    authorAvatar: '/logo.svg',
    instrument: 'BTC/USD',
    title: 'Potential Long on Bitcoin Pullback',
    breakdown: 'Bitcoin is showing signs of strength, but I\'m waiting for a pullback to the 68k support level before entering a long position. This area aligns with the 0.618 Fibonacci retracement level from the recent swing low to high. Look for bullish confirmation on the 4H chart before entry. Target is the previous high around 73k.',
    image: 'https://images.unsplash.com/photo-1621417484393-df1697c1b5a0?q=80&w=2942&auto=format&fit=crop',
    tags: ['BTC', 'Crypto', 'Long'],
    likes: 125,
    comments: 12,
  },
  {
    id: 2,
    author: 'GAPHY_OFFICIAL',
    authorAvatar: '/logo.svg',
    instrument: 'EUR/USD',
    title: 'EUR/USD Approaching Key Resistance',
    breakdown: 'The pair is testing a major resistance zone at 1.0900. High probability of a reversal here. I am looking for short entries with a tight stop loss above the resistance. The daily RSI is also in overbought territory, supporting the bearish bias. First target is 1.0800.',
    image: 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?q=80&w=2940&auto=format&fit=crop',
    tags: ['EURUSD', 'Forex', 'Short'],
    likes: 231,
    comments: 45,
  },
];

export const donationWallets = [
  { name: 'USDT (ERC20/BEP20)', address: '0x29CEBe41F20f9C7DE27373C9a13d07f2f2d44278' },
  { name: 'BTC', address: 'bc1q4rg947vdyn2u9rqn8p27smmh8rqk6lys66r3jv' },
  { name: 'ETH', address: '0x29CEBe41F20f9C7DE27373C9a13d07f2f2d44278' },
  { name: 'SOL', address: '4KrajAEVV4asJTboshj7JFoZBA5vr1Ns57M9yHeYRqaT' },
  { name: 'BNB', address: '0x29CEBe41F20f9C7DE27373C9a13d07f2f2d44278' },
];

export const mpesaDetails = {
  paybill: '3629008',
  account: 'DONATION',
  name: 'GaphyHive Donations',
};
