import { Grok } from 'grok-sdk';

const grok = new Grok({
  apiKey: process.env.XAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text, platform = 'unknown' } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }

  try {
    const completion = await grok.chat.completions.create({
      model: 'grok-beta',
      messages: [
        {
          role: 'system',
          content: 'Analyze this social media post. Return JSON with: sentiment (positive/negative/neutral), is_lead (true/false), lead_score (0-100), pain_points (array), buying_signals (array).'
        },
        { role: 'user', content: text }
      ],
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(completion.choices[0].message.content);

    res.status(200).json({
      success: true,
      ...result,
      platform
    });
  } catch (error) {
    console.error('AI failed:', error.message);
    res.status(500).json({ error: 'AI failed' });
  }
}