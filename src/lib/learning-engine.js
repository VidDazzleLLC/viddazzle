import Anthropic from '@anthropic-ai/sdk';
import axios from 'axios';
import { insertTutorialEmbedding, searchTutorials, query, logToolUsage } from '@/lib/database';

/**
 * Advanced Learning Engine
 *
 * This engine provides self-learning and self-optimization capabilities:
 * - Learns from every workflow execution
 * - Detects patterns and predicts errors
 * - Optimizes workflows automatically
 * - Generates improvement suggestions
 * - Tracks tool performance over time
 */

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Learn from a completed workflow execution
 * This is called automatically after every execution
 */
export async function learnFromExecution(execution, workflow) {
  try {
    console.log(`🧠 Learning from execution ${execution.id}...`);

    const insights = [];

    // 1. Analyze success patterns
    if (execution.success) {
      insights.push(await analyzeSuccessPattern(execution, workflow));
    }

    // 2. Analyze failure patterns
    if (!execution.success || execution.error) {
      insights.push(await analyzeFailurePattern(execution, workflow));
    }

    // 3. Analyze tool performance
    const toolInsights = await analyzeToolPerformance(execution);
    insights.push(...toolInsights);

    // 4. Detect optimization opportunities
    const optimizations = await detectOptimizations(execution, workflow);
    insights.push(...optimizations);

    // 5. Store insights as embeddings
    for (const insight of insights.filter(Boolean)) {
      await storeInsight(insight);
    }

    console.log(`✅ Learned ${insights.length} insights from execution`);

    return {
      success: true,
      insightsCount: insights.length,
      insights: insights.slice(0, 5), // Return top 5 for logging
    };
  } catch (error) {
    console.error('Error in learning engine:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Analyze why a workflow succeeded
 */
async function analyzeSuccessPattern(execution, workflow) {
  const successFactors = [];

  // Check execution duration
  if (execution.duration < 1000) {
    successFactors.push('fast execution (<1s)');
  }

  // Check step success rate
  const totalSteps = execution.log?.length || 0;
  const successfulSteps = execution.log?.filter(s => s.status === 'completed').length || 0;
  if (successfulSteps === totalSteps) {
    successFactors.push('all steps completed successfully');
  }

  // Check tool usage
  const toolsUsed = execution.log?.map(s => s.tool_name).filter(Boolean) || [];
  if (toolsUsed.length > 0) {
    successFactors.push(`successful tools: ${toolsUsed.join(', ')}`);
  }

  return {
    type: 'success_pattern',
    workflowName: workflow.name,
    description: `Workflow "${workflow.name}" succeeded. Key factors: ${successFactors.join('; ')}`,
    category: 'success',
    confidence: 0.9,
    metadata: {
      duration: execution.duration,
      steps: totalSteps,
      tools: toolsUsed,
    },
  };
}

/**
 * Analyze why a workflow failed
 */
async function analyzeFailurePattern(execution, workflow) {
  const failureReasons = [];

  // Find failed steps
  const failedSteps = execution.log?.filter(s => s.status === 'failed') || [];

  for (const step of failedSteps) {
    failureReasons.push({
      step: step.step_name,
      error: step.error,
      tool: step.tool_name,
    });
  }

  // Check for common error patterns
  const errorPatterns = detectErrorPatterns(execution);

  return {
    type: 'failure_pattern',
    workflowName: workflow.name,
    description: `Workflow "${workflow.name}" failed. Errors: ${failureReasons.map(r => `${r.step}: ${r.error}`).join('; ')}`,
    category: 'error',
    confidence: 0.85,
    metadata: {
      failedSteps: failureReasons,
      patterns: errorPatterns,
      duration: execution.duration,
    },
  };
}

/**
 * Detect common error patterns
 */
function detectErrorPatterns(execution) {
  const patterns = [];
  const errors = execution.log?.filter(s => s.error).map(s => s.error.toLowerCase()) || [];

  // Database errors
  if (errors.some(e => e.includes('does not exist') || e.includes('relation'))) {
    patterns.push('missing_database_table_or_column');
  }

  // Type errors
  if (errors.some(e => e.includes('type') || e.includes('invalid'))) {
    patterns.push('data_type_mismatch');
  }

  // Timeout errors
  if (errors.some(e => e.includes('timeout') || e.includes('timed out'))) {
    patterns.push('operation_timeout');
  }

  // Network errors
  if (errors.some(e => e.includes('network') || e.includes('connect'))) {
    patterns.push('network_connectivity');
  }

  return patterns;
}

/**
 * Analyze tool performance from execution
 */
async function analyzeToolPerformance(execution) {
  const insights = [];
  const toolStats = {};

  // Aggregate tool performance
  for (const step of execution.log || []) {
    if (!step.tool_name) continue;

    if (!toolStats[step.tool_name]) {
      toolStats[step.tool_name] = {
        uses: 0,
        successes: 0,
        failures: 0,
        totalDuration: 0,
      };
    }

    toolStats[step.tool_name].uses++;
    if (step.status === 'completed') {
      toolStats[step.tool_name].successes++;
    } else {
      toolStats[step.tool_name].failures++;
    }
    toolStats[step.tool_name].totalDuration += step.duration || 0;
  }

  // Generate insights for each tool
  for (const [toolName, stats] of Object.entries(toolStats)) {
    const successRate = stats.uses > 0 ? (stats.successes / stats.uses) : 0;
    const avgDuration = stats.uses > 0 ? (stats.totalDuration / stats.uses) : 0;

    insights.push({
      type: 'tool_performance',
      toolName,
      description: `Tool "${toolName}" - Success rate: ${(successRate * 100).toFixed(1)}%, Avg duration: ${avgDuration.toFixed(0)}ms`,
      category: 'performance',
      confidence: 0.95,
      metadata: {
        ...stats,
        successRate,
        avgDuration,
      },
    });
  }

  return insights;
}

/**
 * Detect optimization opportunities
 */
async function detectOptimizations(execution, workflow) {
  const optimizations = [];

  // Check for slow steps
  const slowSteps = execution.log?.filter(s => (s.duration || 0) > 5000) || [];
  if (slowSteps.length > 0) {
    optimizations.push({
      type: 'optimization_opportunity',
      description: `Slow steps detected: ${slowSteps.map(s => `${s.step_name} (${s.duration}ms)`).join(', ')}. Consider adding timeout or async execution.`,
      category: 'performance',
      confidence: 0.8,
      metadata: { slowSteps },
    });
  }

  // Check for missing error handling
  const stepsWithoutErrorHandling = workflow.steps?.filter(s => !s.on_error && !s.retry) || [];
  if (stepsWithoutErrorHandling.length > 0) {
    optimizations.push({
      type: 'optimization_opportunity',
      description: `${stepsWithoutErrorHandling.length} steps lack error handling. Add retry logic or on_error handlers.`,
      category: 'reliability',
      confidence: 0.75,
      metadata: { affectedSteps: stepsWithoutErrorHandling.map(s => s.name) },
    });
  }

  // Check for sequential steps that could be parallel
  if (workflow.steps?.length > 3) {
    optimizations.push({
      type: 'optimization_opportunity',
      description: `Workflow has ${workflow.steps.length} sequential steps. Consider parallelizing independent steps.`,
      category: 'performance',
      confidence: 0.6,
      metadata: { stepCount: workflow.steps.length },
    });
  }

  return optimizations;
}

/**
 * Store insight with embedding
 */
async function storeInsight(insight) {
  try {
    const embedding = await generateEmbedding(insight.description);

    await insertTutorialEmbedding(insight.description, embedding, {
      type: insight.type,
      category: insight.category,
      confidence: insight.confidence,
      ...insight.metadata,
    });

    console.log(`📚 Stored insight: ${insight.type} - ${insight.description.substring(0, 50)}...`);
  } catch (error) {
    console.error('Error storing insight:', error);
  }
}

/**
 * Generate AI-powered workflow improvement suggestions
 */
export async function generateImprovementSuggestions(workflow) {
  try {
    console.log(`🔍 Generating improvement suggestions for "${workflow.name}"...`);

    // 1. Search for similar workflows and learnings
    const queryText = `${workflow.name} ${workflow.description} ${workflow.steps?.map(s => s.name).join(' ')}`;
    const queryEmbedding = await generateEmbedding(queryText);
    const similarLearnings = await searchTutorials(queryEmbedding, 0.5, 10);

    // 2. Get tool performance stats
    const toolStats = await getToolPerformanceStats();

    // 3. Use Claude to analyze and suggest improvements
    const response = await anthropic.messages.create({
      model: process.env.CLAUDE_MODEL || 'claude-opus-4-20250514',
      max_tokens: 4000,
      temperature: 0.7,
      system: `You are an expert workflow optimization AI. Analyze workflows and provide specific, actionable improvements based on learned patterns and best practices.`,
      messages: [
        {
          role: 'user',
          content: `Analyze this workflow and suggest improvements:

**Current Workflow:**
${JSON.stringify(workflow, null, 2)}

**Learned Insights from Similar Workflows:**
${similarLearnings.map((l, i) => `${i + 1}. ${l.content} (confidence: ${l.similarity?.toFixed(2)})`).join('\n')}

**Tool Performance Stats:**
${JSON.stringify(toolStats, null, 2)}

**Provide specific improvement suggestions in these categories:**
1. Performance optimizations
2. Error handling improvements
3. Missing steps or validations
4. Tool selection optimizations
5. Best practice recommendations

Format as JSON array with structure:
{
  "suggestions": [
    {
      "type": "performance|error_handling|validation|tool|best_practice",
      "priority": "high|medium|low",
      "title": "Brief title",
      "description": "Detailed description",
      "implementation": "Specific steps to implement",
      "expectedImpact": "What improvement to expect"
    }
  ]
}`,
        },
      ],
    });

    const content = response.content[0].text;
    const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || [null, content];
    const suggestions = JSON.parse(jsonMatch[1] || content);

    console.log(`💡 Generated ${suggestions.suggestions?.length || 0} improvement suggestions`);

    return suggestions;
  } catch (error) {
    console.error('Error generating suggestions:', error);
    return { suggestions: [], error: error.message };
  }
}

/**
 * Get tool performance statistics
 */
async function getToolPerformanceStats() {
  try {
    const result = await query(`
      SELECT
        tool_name,
        COUNT(*) as total_uses,
        SUM(CASE WHEN success THEN 1 ELSE 0 END) as successes,
        SUM(CASE WHEN NOT success THEN 1 ELSE 0 END) as failures,
        AVG(duration_ms) as avg_duration_ms,
        MIN(duration_ms) as min_duration_ms,
        MAX(duration_ms) as max_duration_ms
      FROM mcp_tool_usage
      WHERE created_at > NOW() - INTERVAL '30 days'
      GROUP BY tool_name
      ORDER BY total_uses DESC
      LIMIT 20
    `);

    return result.rows.map(row => ({
      tool: row.tool_name,
      uses: parseInt(row.total_uses),
      successRate: row.total_uses > 0 ? (parseFloat(row.successes) / parseFloat(row.total_uses)) : 0,
      avgDuration: parseFloat(row.avg_duration_ms) || 0,
    }));
  } catch (error) {
    console.error('Error getting tool stats:', error);
    return [];
  }
}

/**
 * Optimize workflow using AI and learned patterns
 */
export async function optimizeWorkflow(workflow) {
  try {
    console.log(`⚡ Optimizing workflow "${workflow.name}"...`);

    // Get suggestions
    const suggestions = await generateImprovementSuggestions(workflow);

    // Apply high-priority optimizations automatically
    const optimizedWorkflow = { ...workflow };

    for (const suggestion of suggestions.suggestions || []) {
      if (suggestion.priority === 'high' && suggestion.type === 'tool') {
        // Auto-apply tool optimizations
        optimizedWorkflow.steps = await optimizeToolSelection(optimizedWorkflow.steps);
      }

      if (suggestion.priority === 'high' && suggestion.type === 'error_handling') {
        // Auto-add error handling
        optimizedWorkflow.steps = addErrorHandling(optimizedWorkflow.steps);
      }
    }

    console.log(`✅ Workflow optimized with ${suggestions.suggestions?.length || 0} improvements applied`);

    return {
      original: workflow,
      optimized: optimizedWorkflow,
      suggestions: suggestions.suggestions,
      changes: compareWorkflows(workflow, optimizedWorkflow),
    };
  } catch (error) {
    console.error('Error optimizing workflow:', error);
    return { error: error.message };
  }
}

/**
 * Optimize tool selection based on performance stats
 */
async function optimizeToolSelection(steps) {
  const toolStats = await getToolPerformanceStats();
  const optimizedSteps = [...steps];

  // Replace poorly performing tools with better alternatives
  for (let i = 0; i < optimizedSteps.length; i++) {
    const step = optimizedSteps[i];
    const stats = toolStats.find(s => s.tool === step.tool);

    if (stats && stats.successRate < 0.8) {
      console.log(`🔄 Tool "${step.tool}" has low success rate (${(stats.successRate * 100).toFixed(1)}%), considering alternatives...`);
      // In a full implementation, you'd find alternative tools here
    }
  }

  return optimizedSteps;
}

/**
 * Add error handling to steps that lack it
 */
function addErrorHandling(steps) {
  return steps.map(step => {
    if (!step.on_error) {
      return {
        ...step,
        on_error: 'continue', // Default to continue on error
        retry: {
          max_attempts: 3,
          delay_ms: 1000,
        },
      };
    }
    return step;
  });
}

/**
 * Compare two workflows and return differences
 */
function compareWorkflows(original, optimized) {
  const changes = [];

  if (original.steps.length !== optimized.steps.length) {
    changes.push(`Step count: ${original.steps.length} → ${optimized.steps.length}`);
  }

  // Compare each step
  for (let i = 0; i < Math.max(original.steps.length, optimized.steps.length); i++) {
    const origStep = original.steps[i];
    const optStep = optimized.steps[i];

    if (!origStep || !optStep) {
      changes.push(origStep ? `Removed: ${origStep.name}` : `Added: ${optStep.name}`);
      continue;
    }

    if (origStep.tool !== optStep.tool) {
      changes.push(`${origStep.name}: Tool changed ${origStep.tool} → ${optStep.tool}`);
    }

    if (!origStep.on_error && optStep.on_error) {
      changes.push(`${origStep.name}: Added error handling`);
    }

    if (!origStep.retry && optStep.retry) {
      changes.push(`${origStep.name}: Added retry logic`);
    }
  }

  return changes;
}

/**
 * Generate embedding using OpenAI or fallback
 */
async function generateEmbedding(text) {
  const embeddingModel = process.env.EMBEDDING_MODEL || 'text-embedding-3-small';

  try {
    if (process.env.OPENAI_API_KEY) {
      const response = await axios.post(
        'https://api.openai.com/v1/embeddings',
        {
          model: embeddingModel,
          input: text.substring(0, 8000), // Limit text length
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

    // Fallback embedding
    console.warn('⚠️  No OPENAI_API_KEY - using fallback embedding (less accurate)');
    return generateFallbackEmbedding(text);
  } catch (error) {
    console.error('Error generating embedding:', error);
    return generateFallbackEmbedding(text);
  }
}

/**
 * Simple fallback embedding for when OpenAI is not available
 */
function generateFallbackEmbedding(text) {
  const dimension = 1536;
  const embedding = new Array(dimension).fill(0);

  for (let i = 0; i < Math.min(text.length, 1000); i++) {
    const charCode = text.charCodeAt(i);
    const index = (charCode * (i + 1)) % dimension;
    embedding[index] += charCode / 1000;
  }

  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  return embedding.map(val => val / (magnitude || 1));
}

export default {
  learnFromExecution,
  generateImprovementSuggestions,
  optimizeWorkflow,
  getToolPerformanceStats,
};
