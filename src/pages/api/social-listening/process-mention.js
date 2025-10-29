import OpenAI from 'openai';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    const { text, platform } = req.body || {};
    if (!text || !platform) return res.status(400).json({ error: 'Missing text/platform' });

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: "json_object" },
      messages: [
        { role: 'system', content: 'Return JSON: {sentiment, is_lead, lead_score, pain_points: [], buying_signals: []}' },
        { role: 'user', content: text }
      ]
    });

    const analysis = JSON.parse(response.choices[0].message.content);

    return res.json({
      success: true,
      analysis,
      text_preview: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
      platform
    });
  } catch (error) {
    console.error('AI error:', error);
    return res.status(500).json({ error: 'AI failed' });
  }
}