import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../src/integrations/supabase/client';
import { TradeIdea } from '../../src/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).send('Invalid ID');
  }

  const tradeIdeaId = parseInt(id, 10);
  if (isNaN(tradeIdeaId)) {
    return res.status(400).send('Invalid Trade Idea ID');
  }

  const { data: tradeIdea, error } = await supabase
    .from('trade_ideas')
    .select('id, title, breakdown, image_url')
    .eq('id', tradeIdeaId)
    .single();

  if (error || !tradeIdea) {
    console.error('Error fetching trade idea:', error);
    return res.status(404).send('Trade Idea not found');
  }

  const pageUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://gaphyhive.ai'}/trade-ideas/${tradeIdea.id}`;
  const imageUrl = tradeIdea.image_url || `${process.env.NEXT_PUBLIC_BASE_URL || 'https://gaphyhive.ai'}/images/default-trade-idea.png`;
  const description = tradeIdea.breakdown?.[0]?.replace(/\[MEDIA:[^\]]+\]/g, '').trim().substring(0, 200) || 'Check out this trade idea on GaphyHive.AI';

  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${tradeIdea.title} - GaphyHive.AI</title>
        <meta property="og:title" content="${tradeIdea.title}" />
        <meta property="og:description" content="${description}" />
        <meta property="og:image" content="${imageUrl}" />
        <meta property="og:url" content="${pageUrl}" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="GaphyHive.AI" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="${tradeIdea.title}" />
        <meta name="twitter:description" content="${description}" />
        <meta name="twitter:image" content="${imageUrl}" />

        <meta http-equiv="refresh" content="0;url=${pageUrl}" />
        <link rel="canonical" href="${pageUrl}" />
    </head>
    <body>
        <p>If you are not redirected automatically, follow this <a href="${pageUrl}">link to the trade idea</a>.</p>
    </body>
    </html>
  `);
}
}
