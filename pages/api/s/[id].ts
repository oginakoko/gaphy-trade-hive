import { NextApiRequest, NextApiResponse } from 'next';
import { resolveShortUrl } from '../../../utils/urlShortener';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  
  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid ID' });
  }

  const originalUrl = await resolveShortUrl(id);
  if (!originalUrl) {
    return res.status(404).json({ error: 'URL not found' });
  }

  res.redirect(301, originalUrl);
}
