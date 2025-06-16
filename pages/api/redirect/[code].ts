import { NextApiRequest, NextApiResponse } from 'next';
import { getOriginalUrl } from '../../../utils/urlShortener';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { code } = req.query;
  
  if (typeof code !== 'string') {
    return res.status(400).json({ error: 'Invalid code' });
  }

  const originalUrl = await getOriginalUrl(code);
  
  if (!originalUrl) {
    return res.status(404).json({ error: 'URL not found' });
  }

  res.redirect(301, originalUrl);
}
