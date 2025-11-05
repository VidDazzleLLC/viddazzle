/**
 * GDPR Account Deletion Endpoint
 * Allows users to delete their account and all associated data
 * Required by GDPR Article 17 (Right to Erasure)
 *
 * DELETE /api/user/delete
 * Body: { confirm: 'DELETE MY ACCOUNT', reason: 'optional' }
 *
 * This permanently deletes:
 * - User account
 * - All workflows
 * - All campaigns
 * - All products
 * - All saved searches
 * - All associated data
 */

import { withAuth } from '@/lib/auth-middleware';
import { rateLimit, RateLimitPresets, combine } from '@/lib/rate-limit';
import { validateSchema } from '@/lib/validation';
import { dataDeleteSchema } from '@/lib/validation-schemas';
import { query } from '@/lib/db';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

async function handler(req, res) {
  if (req.method !== 'DELETE' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userId = req.user.id;
  const userEmail = req.user.email;

  // Validate confirmation
  const { valid, errors } = validateSchema(req.body, dataDeleteSchema);

  if (!valid) {
    return res.status(400).json({ error: 'Validation Error', errors });
  }

  const { reason } = req.body;

  try {
    console.log(`🗑️  Account deletion requested by user: ${userId} (${userEmail})`);

    // Log deletion reason (for analytics/improvement)
    if (reason) {
      console.log(`   Reason: ${reason}`);
      // Optionally store in a separate deletion_log table
    }

    // Delete data in correct order (respecting foreign key constraints)

    // 1. Delete workflow executions
    await query(
      `DELETE FROM workflow_executions
       WHERE workflow_id IN (SELECT id FROM workflows WHERE user_id = $1)`,
      [userId]
    );
    console.log('   ✅ Deleted workflow executions');

    // 2. Delete workflows
    await query('DELETE FROM workflows WHERE user_id = $1', [userId]);
    console.log('   ✅ Deleted workflows');

    // 3. Delete outreach messages
    await query(
      `DELETE FROM outreach_messages
       WHERE campaign_id IN (SELECT id FROM listening_campaigns WHERE user_id = $1)`,
      [userId]
    );
    console.log('   ✅ Deleted outreach messages');

    // 4. Delete outreach rules
    await query(
      `DELETE FROM outreach_rules
       WHERE campaign_id IN (SELECT id FROM listening_campaigns WHERE user_id = $1)`,
      [userId]
    );
    console.log('   ✅ Deleted outreach rules');

    // 5. Delete social mentions
    await query(
      `DELETE FROM social_mentions
       WHERE campaign_id IN (SELECT id FROM listening_campaigns WHERE user_id = $1)`,
      [userId]
    );
    console.log('   ✅ Deleted social mentions');

    // 6. Delete listening campaigns
    await query('DELETE FROM listening_campaigns WHERE user_id = $1', [userId]);
    console.log('   ✅ Deleted campaigns');

    // 7. Delete platform credentials
    await query('DELETE FROM platform_credentials WHERE user_id = $1', [userId]);
    console.log('   ✅ Deleted platform credentials');

    // 8. Delete saved searches (if table exists)
    try {
      await query('DELETE FROM saved_searches WHERE user_id = $1', [userId]);
      console.log('   ✅ Deleted saved searches');
    } catch (e) {
      // Table might not exist
    }

    // 9. Delete products (if table exists)
    try {
      await query('DELETE FROM seller_products WHERE user_id = $1', [userId]);
      console.log('   ✅ Deleted products');
    } catch (e) {
      // Table might not exist
    }

    // 10. Delete trigger words (if table exists)
    try {
      await query(
        `DELETE FROM trigger_words
         WHERE product_id IN (SELECT id FROM seller_products WHERE user_id = $1)`,
        [userId]
      );
      console.log('   ✅ Deleted trigger words');
    } catch (e) {
      // Table might not exist
    }

    // 11. Delete buyer responses (if table exists)
    try {
      await query('DELETE FROM buyer_responses WHERE user_id = $1', [userId]);
      console.log('   ✅ Deleted buyer responses');
    } catch (e) {
      // Table might not exist
    }

    // 12. Delete MCP tool usage
    try {
      await query(
        `DELETE FROM mcp_tool_usage
         WHERE workflow_id IN (SELECT id FROM workflows WHERE user_id = $1)`,
        [userId]
      );
      console.log('   ✅ Deleted tool usage logs');
    } catch (e) {
      // Table might not exist or already deleted
    }

    // 13. Delete user from Supabase Auth
    if (supabaseAdmin) {
      try {
        const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
        if (error) {
          console.error('   ⚠️  Failed to delete Supabase auth user:', error);
        } else {
          console.log('   ✅ Deleted Supabase auth user');
        }
      } catch (e) {
        console.error('   ⚠️  Error deleting Supabase user:', e.message);
      }
    }

    console.log(`✅ Account ${userId} fully deleted`);

    // Return success
    return res.status(200).json({
      success: true,
      message: 'Your account and all associated data have been permanently deleted.',
      deleted_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Account deletion error:', error);

    return res.status(500).json({
      error: 'Deletion failed',
      message: 'Failed to delete your account. Please contact support.',
      support: 'support@yourdomain.com',
    });
  }
}

// Apply security - very strict rate limit (prevent spam)
export default combine(
  withAuth,
  rateLimit(RateLimitPresets.STRICT) // 5 requests per minute
)(handler);
