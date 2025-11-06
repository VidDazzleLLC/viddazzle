// API Route: URL Optimization with AI
import Anthropic from '@anthropic-ai/sdk';
import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    // 1. Fetch the webpage content
    console.log('Fetching URL:', url);
    let pageContent = '';
    let pageTitle = '';
    let metaDescription = '';
    
    try {
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      const html = response.data;
      
      // Extract title
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      pageTitle = titleMatch ? titleMatch[1] : '';
      
      // Extract meta description
      const metaMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
      metaDescription = metaMatch ? metaMatch[1] : '';
      
      // Extract visible text (basic extraction)
      pageContent = html
        .replace(/<script[^>]*>.*?<\/script>/gi, '')
        .replace(/<style[^>]*>.*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 5000); // Limit to 5000 chars
        
    } catch (fetchError) {
      console.error('Error fetching URL:', fetchError.message);
      // Continue with AI analysis even if fetch fails
    }

    // 2. Use Claude AI to analyze and extract keywords
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const prompt = `Analyze this webpage and extract relevant information for a social media listening campaign:

URL: ${url}
Title: ${pageTitle}
Meta Description: ${metaDescription}
Content Sample: ${pageContent.substring(0, 2000)}

Please extract and provide:
1. 5-10 relevant keywords (single words or short phrases)
2. 3-5 relevant hashtags (without the # symbol)
3. A brief campaign description (1-2 sentences)
4. Suggested platforms (twitter, reddit, linkedin) - choose 1-2 most relevant

Format your response as valid JSON with this structure:
{
  "keywords": ["keyword1", "keyword2"],
  "hashtags": ["hashtag1", "hashtag2"],
  "description": "campaign description",
  "platforms": ["twitter", "reddit"]
}`;

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    // Parse AI response
    const aiResponse = message.content[0].text;
    console.log('AI Response:', aiResponse);
    
    // Extract JSON from response (Claude sometimes includes markdown)
    let result;
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      result = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      result = {
        keywords: ['social media', 'marketing', 'engagement'],
        hashtags: ['socialmedia', 'marketing'],
        description: 'Monitor mentions and conversations related to this product/service',
        platforms: ['twitter', 'reddit']
      };
    }

    // Validate and return
    return res.status(200).json({
      keywords: result.keywords || [],
      hashtags: result.hashtags || [],
      description: result.description || '',
      platforms: result.platforms || ['twitter']
    });

  } catch (error) {
    console.error('Optimization error:', error);
    return res.status(500).json({ 
      error: error.message || 'Failed to optimize URL',
      keywords: [],
      hashtags: [],
      description: '',
      platforms: []
    });
  }
}
