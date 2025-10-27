import Anthropic from '@anthropic-ai/sdk';
import axios from 'axios';
import { insertTutorialEmbedding } from '@/lib/database';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Auto-learn from any URL
 * POST /api/learn-from-url
 * Body: { url: string, platform_name?: string }
 *
 * Automatically:
 * 1. Fetches the documentation/tutorial page
 * 2. Uses Claude to parse and understand it
 * 3. Extracts API endpoints, auth, operations
 * 4. Generates tutorial content
 * 5. Stores in learning system
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { url, platform_name } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    console.log(`🔍 Auto-learning from URL: ${url}`);

    // Step 1: Fetch the documentation page
    const content = await fetchDocumentation(url);

    if (!content || content.length < 100) {
      return res.status(400).json({
        error: 'Failed to fetch content or content too short',
        url
      });
    }

    console.log(`✅ Fetched ${content.length} characters from ${url}`);

    // Step 2: Use Claude to parse and extract tutorials
    const tutorials = await parseDocumentationWithAI(content, url, platform_name);

    if (!tutorials || tutorials.length === 0) {
      return res.status(400).json({
        error: 'Could not extract tutorials from content',
        suggestion: 'Try a URL with more detailed API documentation'
      });
    }

    console.log(`✅ Extracted ${tutorials.length} tutorials from documentation`);

    // Step 3: Store each tutorial
    const stored = [];
    for (const tutorial of tutorials) {
      try {
        // Generate embedding
        const embedding = await generateEmbedding(tutorial.content);

        // Store in database
        const result = await insertTutorialEmbedding(
          tutorial.content,
          embedding,
          {
            platform: tutorial.platform,
            category: tutorial.category,
            source_url: url,
            auto_learned: true,
            learned_at: new Date().toISOString(),
            ...tutorial.metadata
          }
        );

        stored.push({
          id: result.id,
          platform: tutorial.platform,
          operation: tutorial.operation
        });
      } catch (error) {
        console.error('Error storing tutorial:', error);
      }
    }

    console.log(`✅ Stored ${stored.length} tutorials in learning system`);

    return res.status(200).json({
      success: true,
      url,
      tutorials_found: tutorials.length,
      tutorials_stored: stored.length,
      tutorials: stored,
      message: `Successfully learned ${stored.length} operations from ${tutorials[0]?.platform || 'the platform'}`,
      next_steps: [
        `You can now use these operations via Autopilot`,
        `Try: "Use ${tutorials[0]?.platform || 'this platform'} to ${tutorials[0]?.operation || 'perform an action'}"`
      ]
    });

  } catch (error) {
    console.error('Error learning from URL:', error);
    return res.status(500).json({
      error: 'Failed to learn from URL',
      message: error.message,
      suggestion: 'Make sure the URL is accessible and contains API documentation'
    });
  }
}

/**
 * Fetch documentation from URL
 */
async function fetchDocumentation(url) {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; WorkflowAutopilot/1.0; +https://autopilot.ai)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      timeout: 30000,
      maxContentLength: 5 * 1024 * 1024, // 5MB max
    });

    let content = response.data;

    // If it's HTML, extract text content
    if (typeof content === 'string' && content.includes('<html')) {
      // Simple HTML to text conversion
      content = content
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }

    return content;
  } catch (error) {
    console.error('Error fetching documentation:', error);
    throw new Error(`Failed to fetch URL: ${error.message}`);
  }
}

/**
 * Use Claude to parse documentation and extract tutorials
 */
async function parseDocumentationWithAI(content, sourceUrl, platformName) {
  try {
    // Truncate content if too long (Claude has token limits)
    const maxChars = 50000;
    const truncatedContent = content.length > maxChars
      ? content.substring(0, maxChars) + '\n\n[Content truncated...]'
      : content;

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-20250514',
      max_tokens: 4096,
      system: `You are an expert at analyzing API documentation and extracting actionable tutorials.

Your job:
1. Read the provided documentation
2. Identify the platform/service name
3. Extract API endpoints, authentication methods, and operations
4. Generate clear, step-by-step tutorials for common operations
5. Format as JSON

Focus on:
- Authentication setup
- Core CRUD operations (create, read, update, delete)
- Common use cases
- Request/response examples

Return ONLY valid JSON array, no markdown formatting.`,
      messages: [{
        role: 'user',
        content: `Analyze this API documentation and extract tutorials:

URL: ${sourceUrl}
${platformName ? `Platform Name: ${platformName}` : ''}

Documentation:
${truncatedContent}

Extract tutorials and return JSON array:
[
  {
    "platform": "Platform Name",
    "operation": "What this does (e.g., 'Create User', 'Send Email')",
    "category": "Category (e.g., 'user_management', 'email', 'crm')",
    "content": "Detailed step-by-step tutorial with exact API calls, authentication, parameters, etc.",
    "metadata": {
      "api_endpoint": "Base API URL if found",
      "auth_method": "API key, OAuth, Bearer token, etc.",
      "difficulty": "beginner|intermediate|advanced"
    }
  }
]

Extract 3-10 most important operations. Be specific and include exact endpoints and parameters.`
      }]
    });

    const rawResponse = response.content[0].text;

    // Parse JSON from response
    let tutorials;
    try {
      // Remove markdown code blocks if present
      const jsonMatch = rawResponse.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        tutorials = JSON.parse(jsonMatch[0]);
      } else {
        tutorials = JSON.parse(rawResponse);
      }
    } catch (parseError) {
      console.error('Failed to parse Claude response:', rawResponse);
      throw new Error('AI returned invalid JSON format');
    }

    // Validate and clean tutorials
    if (!Array.isArray(tutorials)) {
      tutorials = [tutorials];
    }

    return tutorials.filter(t => t.platform && t.content && t.content.length > 50);

  } catch (error) {
    console.error('Error parsing documentation with AI:', error);
    throw error;
  }
}

/**
 * Generate embedding for tutorial content
 */
async function generateEmbedding(text) {
  try {
    // Use OpenAI embeddings if available
    if (process.env.OPENAI_API_KEY) {
      const response = await axios.post(
        'https://api.openai.com/v1/embeddings',
        {
          model: 'text-embedding-3-small',
          input: text,
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data.data[0].embedding;
    }

    // Fallback: Simple embedding
    console.warn('Using fallback embedding - consider adding OPENAI_API_KEY');
    return generateFallbackEmbedding(text);
  } catch (error) {
    console.error('Error generating embedding:', error);
    return generateFallbackEmbedding(text);
  }
}

/**
 * Fallback embedding generator
 */
function generateFallbackEmbedding(text) {
  const dimension = 1536;
  const embedding = new Array(dimension).fill(0);

  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    const index = (charCode * (i + 1)) % dimension;
    embedding[index] += charCode / 1000;
  }

  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  return embedding.map(val => val / (magnitude || 1));
}
