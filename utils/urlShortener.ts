import { customAlphabet } from 'nanoid';
import { ShortUrl } from '../models/ShortUrl';

const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyz', 6);

export async function generateShortUrl(originalUrl: string): Promise<string> {
  const shortCode = nanoid();
  const shortUrl = new ShortUrl({
    originalUrl,
    shortCode,
  });
  await shortUrl.save();
  return `https://gaphyhive.ai/${shortCode}`;
}

export async function getOriginalUrl(shortCode: string): Promise<string | null> {
  const shortUrl = await ShortUrl.findOne({ shortCode });
  return shortUrl ? shortUrl.originalUrl : null;
}

export async function createShortUrl(originalUrl: string) {
  const shortUrl = await ShortUrl.create({ originalUrl });
  return `https://gaphyhive.ai/s/${shortUrl.shortId}`;
}

export async function resolveShortUrl(shortId: string) {
  const url = await ShortUrl.findOne({ shortId });
  return url?.originalUrl;
}
