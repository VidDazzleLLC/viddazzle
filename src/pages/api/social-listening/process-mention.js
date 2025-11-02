export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text, platform = 'unknown' } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }

  try {
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.XAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'grok-beta',
        messages: [
          {
            role: 'system',
            content: 'Analyze this social media post. Return JSON with: sentiment (positive/negative/neutral), is_lead (true/false), lead_score (0-100), pain_points (array), buying_signals (array).'
          },
          { role: 'user', content: text }
        ],
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      throw new Error(`xAI API error: ${response.status}`);
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);

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