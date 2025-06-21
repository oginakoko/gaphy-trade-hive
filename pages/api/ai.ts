// pages/api/ai.ts
// API route for server-side AI chat, using same restrictions/modeling as GaphyBot

import type { NextApiRequest, NextApiResponse } from 'next';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL = 'mistralai/mixtral-8x7b-instruct';

// Helper to create system prompt (copied from GaphyBot)
function createSystemPrompt(userMessage: string, profile: any, contextObj: any) {
  const casualIndicators = ['talk', 'chat', 'hi', 'hello', 'hey', 'how are you', 'whats up', 'conversation', 'just chat', 'lets talk'];
  const isCasualRequest = casualIndicators.some(indicator => userMessage.toLowerCase().includes(indicator.toLowerCase()));
  const tradingIndicators = ['trade', 'analyze', 'risk', 'reward', 'entry', 'setup', 'ideas', 'breakdown', 'trading', 'market', 'stock', 'forex', 'crypto'];
  const dataIndicators = ['ads', 'users', 'servers', 'data', 'show me', 'list', 'find', 'search', 'get me'];
  const isTradingRequest = tradingIndicators.some(indicator => userMessage.toLowerCase().includes(indicator.toLowerCase()));
  const isDataRequest = dataIndicators.some(indicator => userMessage.toLowerCase().includes(indicator.toLowerCase()));
  const hasTradeIdeas = contextObj.tradeIdeas && contextObj.tradeIdeas.length > 0;
  const hasOtherData = contextObj.ads || contextObj.users || contextObj.servers;
  if (isCasualRequest && !isTradingRequest && !isDataRequest) {
    return `You are AlphaFinder, a friendly AI assistant for Gaphy Trade Hive. You can have normal conversations about anything and also help with trading when asked. Be natural, conversational, and engaging. Don't mention trading unless the user brings it up. Keep responses casual and human-like.`;
  }
  if (profile?.is_admin && (isDataRequest || hasOtherData)) {
    return `You are AlphaFinder, the AI assistant for Gaphy Trade Hive.\n\nYou have access to the following data from the Gaphy Trade Hive platform:\n\nTRADE IDEAS (${contextObj.tradeIdeas?.length || 0} available):\n${JSON.stringify(contextObj.tradeIdeas || [], null, 2)}\n\nSERVERS (${contextObj.servers?.length || 0} available):\n${JSON.stringify(contextObj.servers || [], null, 2)}\n\nUSERS (${contextObj.users?.length || 0} available):\n${JSON.stringify(contextObj.users || [], null, 2)}\n\nADS (${contextObj.ads?.length || 0} available):\n${JSON.stringify(contextObj.ads || [], null, 2)}\n\nAFFILIATE LINKS (${contextObj.affiliateLinks?.length || 0} available):\n${JSON.stringify(contextObj.affiliateLinks || [], null, 2)}\n\nINSTRUCTIONS:\n- Use this data to answer questions about the platform\n- Be helpful and provide relevant information when asked\n- For casual conversation, be natural and friendly\n- Always give accurate information based on the data provided\n- If asked about specific trades, users, ads, etc., refer to this data`;
  }
  if (isTradingRequest || hasTradeIdeas) {
    return `You are AlphaFinder, a trading assistant for Gaphy Trade Hive. \n\nYou have access to these trade ideas from the platform:\n${JSON.stringify(contextObj.tradeIdeas || [], null, 2)}\n\nINSTRUCTIONS:\n- Help analyze these trade ideas when asked\n- Provide insights on risk/reward, entry points, setups\n- Reference specific trades from the data when relevant\n- For casual conversation, be natural and friendly\n- Always base trading advice on the actual trade data provided\n- If no specific trade data matches the question, be honest about limitations`;
  }
  return `You are AlphaFinder, a friendly AI assistant for Gaphy Trade Hive. \n\n${hasTradeIdeas ? `You have access to ${contextObj.tradeIdeas.length} trade ideas from the platform.` : ''}\n${hasOtherData ? 'You also have access to platform data including servers, users, and ads.' : ''}\n\nBe natural, conversational, and helpful. Use the available data when relevant to answer questions, but don't force it into every conversation. Respond naturally to what the user is asking.`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!OPENROUTER_API_KEY) {
    return res.status(500).json({ error: 'No OpenRouter API key configured' });
  }
  const { messages, profile, contextObj } = req.body;
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'No messages provided' });
  }
  const systemPrompt = createSystemPrompt(messages[messages.length-1]?.content || '', profile, contextObj || {});
  const chatMessages = [
    { role: 'system', content: systemPrompt },
    ...messages.slice(-10)
  ];
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://gaphyhive.com',
        'X-Title': 'GaphyHive'
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages: chatMessages,
        temperature: 0.7,
        max_tokens: 4000,
        frequency_penalty: 0,
        presence_penalty: 0,
        stream: false
      })
    });
    if (!response.ok) {
      const err = await response.text();
      return res.status(response.status).json({ error: err });
    }
    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error?.toString() });
  }
}
