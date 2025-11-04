// Social Media Outreach Automation
import { TwitterClient } from './twitter-client.js';
import { RedditClient } from './reddit-client.js';
import { LinkedInClient } from './linkedin-client.js';

export class OutreachAutomation {
  constructor(dbPool) {
    this.db = dbPool;
    this.clients = {};
  }

  /**
   * Initialize platform clients with credentials
   */
  initializeClients(credentials) {
    if (credentials.twitter) {
      this.clients.twitter = new TwitterClient(credentials.twitter);
    }
    if (credentials.reddit) {
      this.clients.reddit = new RedditClient(credentials.reddit);
    }
    if (credentials.linkedin) {
      this.clients.linkedin = new LinkedInClient(credentials.linkedin);
    }
  }

  /**
   * Send an outreach message
   * @param {string} messageId - Outreach message ID
   * @returns {Promise<Object>} Send result
   */
  async sendMessage(messageId) {
    try {
      // Get message details
      const messageResult = await this.db.query(`
        SELECT om.*, sm.platform, sm.platform_post_id, sm.author_username,
               lc.user_id, sm.metadata
        FROM outreach_messages om
        JOIN social_mentions sm ON om.mention_id = sm.id
        JOIN listening_campaigns lc ON om.campaign_id = lc.id
        WHERE om.id = $1
      `, [messageId]);

      const message = messageResult.rows[0];

      if (!message) {
        throw new Error('Message not found');
      }

      if (message.status !== 'approved') {
        throw new Error('Message not approved for sending');
      }

      // Get credentials
      const credentials = await this.getUserCredentials(message.user_id);
      this.initializeClients(credentials);

      const channel = message.channel;
      let sendResult;

      // Send based on channel type
      switch (channel.type) {
        case 'reply':
          sendResult = await this.sendReply(message, credentials);
          break;
        case 'dm':
          sendResult = await this.sendDirectMessage(message, credentials);
          break;
        case 'email':
          sendResult = await this.sendEmail(message);
          break;
        default:
          throw new Error(`Unknown channel type: ${channel.type}`);
      }

      // Update message status
      await this.db.query(`
        UPDATE outreach_messages
        SET status = 'sent', sent_at = NOW(), updated_at = NOW()
        WHERE id = $1
      `, [messageId]);

      // Mark mention as replied
      await this.db.query(`
        UPDATE social_mentions
        SET is_replied = true
        WHERE id = $1
      `, [message.mention_id]);

      return {
        success: true,
        messageId,
        sendResult,
      };
    } catch (error) {
      console.error('Send message error:', error);

      // Update message with error
      await this.db.query(`
        UPDATE outreach_messages
        SET status = 'failed', error_message = $1, updated_at = NOW()
        WHERE id = $2
      `, [error.message, messageId]);

      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Send a reply to a post
   */
  async sendReply(message, credentials) {
    const platform = message.platform;
    const client = this.clients[platform];

    if (!client) {
      throw new Error(`No client initialized for ${platform}`);
    }

    switch (platform) {
      case 'twitter':
        return await client.replyToTweet(
          message.platform_post_id,
          message.message_content
        );

      case 'reddit':
        // Reddit uses full ID format (t3_xxx or t1_xxx)
        const fullId = message.metadata?.fullId || `t3_${message.platform_post_id}`;
        return await client.replyToPost(fullId, message.message_content);

      case 'linkedin':
        return await client.commentOnPost(
          message.platform_post_id,
          message.message_content
        );

      default:
        throw new Error(`Reply not supported for ${platform}`);
    }
  }

  /**
   * Send a direct message
   */
  async sendDirectMessage(message, credentials) {
    const platform = message.platform;
    const client = this.clients[platform];

    if (!client) {
      throw new Error(`No client initialized for ${platform}`);
    }

    switch (platform) {
      case 'twitter':
        // Would need to get user ID from username first
        throw new Error('Twitter DM requires user ID - not yet implemented');

      case 'reddit':
        return await client.sendPrivateMessage(
          message.author_username,
          'Regarding your post',
          message.message_content
        );

      case 'linkedin':
        throw new Error('LinkedIn DM requires member URN - not yet implemented');

      default:
        throw new Error(`DM not supported for ${platform}`);
    }
  }

  /**
   * Send an email (requires email integration)
   */
  async sendEmail(message) {
    // This would integrate with your email system (SendGrid, etc.)
    throw new Error('Email outreach not yet implemented');
  }

  /**
   * Approve an outreach message
   * @param {string} messageId - Message ID
   * @param {string} userId - User ID approving
   * @returns {Promise<boolean>} Success
   */
  async approveMessage(messageId, userId) {
    try {
      const result = await this.db.query(`
        UPDATE outreach_messages om
        SET status = 'approved', updated_at = NOW()
        FROM listening_campaigns lc
        WHERE om.id = $1 AND om.campaign_id = lc.id AND lc.user_id = $2
          AND om.status = 'pending_approval'
        RETURNING om.id
      `, [messageId, userId]);

      return result.rows.length > 0;
    } catch (error) {
      console.error('Approve message error:', error);
      return false;
    }
  }

  /**
   * Reject an outreach message
   * @param {string} messageId - Message ID
   * @param {string} userId - User ID rejecting
   * @returns {Promise<boolean>} Success
   */
  async rejectMessage(messageId, userId) {
    try {
      const result = await this.db.query(`
        UPDATE outreach_messages om
        SET status = 'rejected', updated_at = NOW()
        FROM listening_campaigns lc
        WHERE om.id = $1 AND om.campaign_id = lc.id AND lc.user_id = $2
          AND om.status = 'pending_approval'
        RETURNING om.id
      `, [messageId, userId]);

      return result.rows.length > 0;
    } catch (error) {
      console.error('Reject message error:', error);
      return false;
    }
  }

  /**
   * Get pending messages for approval
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Pending messages
   */
  async getPendingMessages(userId) {
    const result = await this.db.query(`
      SELECT om.*, sm.platform, sm.content as mention_content,
             sm.author_username, sm.post_url, lc.name as campaign_name
      FROM outreach_messages om
      JOIN social_mentions sm ON om.mention_id = sm.id
      JOIN listening_campaigns lc ON om.campaign_id = lc.id
      WHERE lc.user_id = $1 AND om.status = 'pending_approval'
      ORDER BY om.created_at DESC
      LIMIT 50
    `, [userId]);

    return result.rows;
  }

  /**
   * Process outreach queue (send approved messages)
   * @returns {Promise<Object>} Results
   */
  async processQueue() {
    try {
      // Get approved messages that haven't been sent
      const result = await this.db.query(`
        SELECT DISTINCT ON (lc.user_id) om.id, lc.user_id
        FROM outreach_messages om
        JOIN listening_campaigns lc ON om.campaign_id = lc.id
        WHERE om.status = 'approved' AND om.sent_at IS NULL
        ORDER BY lc.user_id, om.created_at ASC
        LIMIT 20
      `);

      const results = [];

      for (const { id } of result.rows) {
        // Add small delay between sends to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 2000));

        const sendResult = await this.sendMessage(id);
        results.push(sendResult);
      }

      return {
        success: true,
        processed: results.length,
        results,
      };
    } catch (error) {
      console.error('Process queue error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get user credentials
   */
  async getUserCredentials(userId) {
    const result = await this.db.query(
      'SELECT platform, credentials FROM platform_credentials WHERE user_id = $1 AND is_active = true',
      [userId]
    );

    const credentials = {};
    result.rows.forEach(row => {
      credentials[row.platform] = row.credentials;
    });

    return credentials;
  }

  /**
   * Bulk approve messages
   * @param {Array} messageIds - Array of message IDs
   * @param {string} userId - User ID
   * @returns {Promise<number>} Number approved
   */
  async bulkApprove(messageIds, userId) {
    const result = await this.db.query(`
      UPDATE outreach_messages om
      SET status = 'approved', updated_at = NOW()
      FROM listening_campaigns lc
      WHERE om.id = ANY($1) AND om.campaign_id = lc.id AND lc.user_id = $2
        AND om.status = 'pending_approval'
      RETURNING om.id
    `, [messageIds, userId]);

    return result.rows.length;
  }

  /**
   * Get outreach statistics
   * @param {string} campaignId - Campaign ID
   * @returns {Promise<Object>} Statistics
   */
  async getStatistics(campaignId) {
    const result = await this.db.query(`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'pending_approval') as pending,
        COUNT(*) FILTER (WHERE status = 'approved') as approved,
        COUNT(*) FILTER (WHERE status = 'sent') as sent,
        COUNT(*) FILTER (WHERE status = 'failed') as failed,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected,
        COUNT(*) FILTER (WHERE response_received = true) as responses,
        COUNT(*) FILTER (WHERE conversion_tracked = true) as conversions
      FROM outreach_messages
      WHERE campaign_id = $1
    `, [campaignId]);

    return result.rows[0];
  }
}

export default OutreachAutomation;
