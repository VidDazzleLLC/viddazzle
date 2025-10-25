import Anthropic from '@anthropic-ai/sdk';
import { insertTutorialEmbedding, searchTutorials } from '@/lib/database';
import axios from 'axios';

// Initialize Anthropic client (for future embedding generation if needed)
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Learn from tutorials and provide context-aware suggestions
 *
 * This endpoint handles:
 * 1. Storing new tutorials with vector embeddings
 * 2. Searching for relevant tutorials based on queries
 * 3. Generating suggestions for workflow improvements
 */
export default async function handler(req, res) {
  if (req.method === 'POST') {
    return handleLearn(req, res);
  } else if (req.method === 'GET') {
    return handleSearch(req, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

/**
 * Handle learning - store new tutorials with embeddings
 */
async function handleLearn(req, res) {
  try {
    const { content, metadata = {}, category = null, tags = [] } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    // Generate embedding using OpenAI's embedding model
    // You can also use Claude's embedding capabilities or other providers
    const embedding = await generateEmbedding(content);

    // Store in database with vector embedding
    const result = await insertTutorialEmbedding(content, embedding, {
      ...metadata,
      category,
      tags,
    });

    return res.status(200).json({
      success: true,
      id: result.id,
      message: 'Tutorial learned successfully',
    });
  } catch (error) {
    console.error('Error learning tutorial:', error);
    return res.status(500).json({
      error: 'Failed to learn tutorial',
      message: error.message,
    });
  }
}

/**
 * Handle search - find relevant tutorials
 */
async function handleSearch(req, res) {
  try {
    const { query, matchCount = 5, matchThreshold = 0.7 } = req.query;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query);

    // Search for similar tutorials
    const results = await searchTutorials(
      queryEmbedding,
      parseFloat(matchThreshold),
      parseInt(matchCount)
    );

    return res.status(200).json({
      success: true,
      results,
      count: results.length,
    });
  } catch (error) {
    console.error('Error searching tutorials:', error);
    return res.status(500).json({
      error: 'Failed to search tutorials',
      message: error.message,
    });
  }
}

/**
 * Generate embedding for text
 *
 * This uses OpenAI's text-embedding-3-small model by default
 * You can also use Claude's embedding capabilities or other providers
 */
async function generateEmbedding(text) {
  const embeddingModel = process.env.EMBEDDING_MODEL || 'text-embedding-3-small';

  try {
    // Using OpenAI's embedding API
    // You'll need to set OPENAI_API_KEY in your environment
    if (process.env.OPENAI_API_KEY) {
      const response = await axios.post(
        'https://api.openai.com/v1/embeddings',
        {
          model: embeddingModel,
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

    // Fallback: Generate a simple embedding (for testing only)
    // In production, you should always use a proper embedding model
    console.warn('No embedding API key found, using fallback embedding');
    return generateFallbackEmbedding(text);
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw new Error('Failed to generate embedding');
  }
}

/**
 * Generate a simple fallback embedding (for testing only)
 * This creates a deterministic vector based on the text content
 *
 * WARNING: This is NOT suitable for production use!
 * Use a proper embedding model like OpenAI's text-embedding-3-small
 */
function generateFallbackEmbedding(text) {
  const dimension = parseInt(process.env.EMBEDDING_DIMENSION) || 1536;
  const embedding = new Array(dimension).fill(0);

  // Simple hash-based embedding (not semantically meaningful)
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    const index = (charCode * (i + 1)) % dimension;
    embedding[index] += charCode / 1000;
  }

  // Normalize the vector
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  return embedding.map(val => val / (magnitude || 1));
}

/**
 * Suggest workflow improvements based on learned patterns
 *
 * This can be called from the frontend to get AI-powered suggestions
 */
export async function suggestImprovements(workflow) {
  try {
    // Search for similar workflows in the knowledge base
    const query = `${workflow.name} ${workflow.description}`;
    const queryEmbedding = await generateEmbedding(query);
    const similarTutorials = await searchTutorials(queryEmbedding, 0.6, 3);

    if (similarTutorials.length === 0) {
      return {
        suggestions: [],
        message: 'No similar workflows found in knowledge base',
      };
    }

    // Use Claude to analyze and generate suggestions
    const response = await anthropic.messages.create({
      model: process.env.CLAUDE_MODEL || 'claude-opus-4-20250514',
      max_tokens: 4000,
      system: 'You are an expert workflow optimization assistant. Analyze workflows and provide specific, actionable improvement suggestions.',
      messages: [
        {
          role: 'user',
          content: `Analyze this workflow and suggest improvements based on these similar workflows:

Current Workflow:
${JSON.stringify(workflow, null, 2)}

Similar Workflows from Knowledge Base:
${similarTutorials.map((t, i) => `${i + 1}. ${t.content} (similarity: ${t.similarity})`).join('\n\n')}

Please provide:
1. Specific improvements to make the workflow more efficient
2. Potential error cases to handle
3. Best practices to apply
4. Any missing steps or considerations

Format your response as a JSON array of suggestions with this structure:
{
  "suggestions": [
    {
      "type": "optimization|error_handling|best_practice|missing_step",
      "title": "Brief title",
      "description": "Detailed description",
      "priority": "high|medium|low",
      "implementation": "How to implement this suggestion"
    }
  ]
}`,
        },
      ],
    });

    const content = response.content[0].text;
    const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || [null, content];
    const suggestions = JSON.parse(jsonMatch[1] || content);

    return suggestions;
  } catch (error) {
    console.error('Error generating suggestions:', error);
    return {
      suggestions: [],
      error: error.message,
    };
  }
}

/**
 * Analyze workflow execution patterns and learn from them
 */
export async function analyzeExecutionPatterns(executionLogs) {
  try {
    // Use Claude to analyze execution logs and extract insights
    const response = await anthropic.messages.create({
      model: process.env.CLAUDE_MODEL || 'claude-opus-4-20250514',
      max_tokens: 4000,
      system: 'You are an expert at analyzing workflow execution patterns and extracting insights.',
      messages: [
        {
          role: 'user',
          content: `Analyze these workflow execution logs and extract patterns, common errors, and optimization opportunities:

${JSON.stringify(executionLogs, null, 2)}

Please provide:
1. Common error patterns
2. Performance bottlenecks
3. Success patterns
4. Recommendations for improvement

Format as JSON.`,
        },
      ],
    });

    const content = response.content[0].text;
    const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || [null, content];
    const analysis = JSON.parse(jsonMatch[1] || content);

    // Store insights as new tutorial embeddings
    if (analysis.insights) {
      for (const insight of analysis.insights) {
        const embedding = await generateEmbedding(insight.description);
        await insertTutorialEmbedding(insight.description, embedding, {
          type: 'execution_insight',
          category: insight.category,
          confidence: insight.confidence,
        });
      }
    }

    return analysis;
  } catch (error) {
    console.error('Error analyzing execution patterns:', error);
    throw error;
  }
}
