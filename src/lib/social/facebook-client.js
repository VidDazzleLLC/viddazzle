// Facebook Graph API Client for Social Media Listening
import axios from 'axios';

export class FacebookClient {
  constructor(credentials) {
    this.appId = credentials.appId;
    this.appSecret = credentials.appSecret;
    this.accessToken = credentials.accessToken;
    this.baseURL = 'https://graph.facebook.com/v18.0';
  }

  /**
   * Search public posts by keywords
   * @param {string[]} keywords - Keywords to search for
   * @param {Object} options - Search options
   * @returns {Promise<Array>} Array of post objects
   */
  async searchPosts(keywords, options = {}) {
    try {
      const posts = [];

      // Facebook Graph API doesn't have a direct keyword search for public posts
      // We need to search within specific pages or use Page Public Content Access
      // This implementation searches public pages that match keywords

      for (const keyword of keywords) {
        const response = await axios.get(`${this.baseURL}/search`, {
          params: {
            q: keyword,
            type: 'post',
            fields: 'id,message,created_time,from,permalink_url,shares,reactions.summary(true),comments.summary(true)',
            access_token: this.accessToken,
            limit: options.maxResults || 25,
          }
        });

        if (response.data.data && response.data.data.length > 0) {
          const formatted = this.formatPosts(response.data.data, keyword);
          posts.push(...formatted);
        }
      }

      // Remove duplicates based on platform_post_id
      const uniquePosts = this.removeDuplicates(posts);
      return uniquePosts;
    } catch (error) {
      console.error('Facebook search error:', error.response?.data || error.message);

      // Handle specific Facebook API errors
      if (error.response?.data?.error?.code === 190) {
        throw new Error('Facebook access token expired or invalid');
      }

      throw new Error(`Facebook API error: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Monitor specific Facebook pages
   * @param {string[]} pageIds - Facebook page IDs or usernames to monitor
   * @param {Object} options - Options
   * @returns {Promise<Array>} Array of post objects
   */
  async getPagePosts(pageIds, options = {}) {
    try {
      const posts = [];

      for (const pageId of pageIds) {
        const response = await axios.get(`${this.baseURL}/${pageId}/posts`, {
          params: {
            fields: 'id,message,created_time,from,permalink_url,shares,reactions.summary(true),comments.summary(true),insights.metric(post_impressions)',
            access_token: this.accessToken,
            limit: options.maxResults || 25,
            ...(options.since && { since: options.since }),
          }
        });

        if (response.data.data && response.data.data.length > 0) {
          const formatted = this.formatPosts(response.data.data);
          posts.push(...formatted);
        }
      }

      return posts;
    } catch (error) {
      console.error('Facebook page posts error:', error.response?.data || error.message);
      throw new Error(`Facebook API error: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Search for pages by keyword
   * @param {string[]} keywords - Keywords to search for pages
   * @returns {Promise<Array>} Array of page objects
   */
  async searchPages(keywords, options = {}) {
    try {
      const pages = [];

      for (const keyword of keywords) {
        const response = await axios.get(`${this.baseURL}/search`, {
          params: {
            q: keyword,
            type: 'page',
            fields: 'id,name,username,fan_count,category,about',
            access_token: this.accessToken,
            limit: options.maxResults || 25,
          }
        });

        if (response.data.data) {
          pages.push(...response.data.data);
        }
      }

      return pages;
    } catch (error) {
      console.error('Facebook page search error:', error.response?.data || error.message);
      throw new Error(`Facebook API error: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Post a comment on a Facebook post
   * @param {string} postId - ID of post to comment on
   * @param {string} message - Comment message
   * @returns {Promise<Object>} Comment response
   */
  async commentOnPost(postId, message) {
    try {
      const response = await axios.post(
        `${this.baseURL}/${postId}/comments`,
        null,
        {
          params: {
            message: message,
            access_token: this.accessToken,
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Facebook comment error:', error.response?.data || error.message);
      throw new Error(`Failed to comment: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Send a message via Facebook Messenger (requires Messenger API setup)
   * @param {string} recipientId - Facebook user ID (PSID)
   * @param {string} message - Message text
   * @returns {Promise<Object>} Message response
   */
  async sendMessage(recipientId, message) {
    try {
      const response = await axios.post(
        `${this.baseURL}/me/messages`,
        {
          recipient: { id: recipientId },
          message: { text: message }
        },
        {
          params: {
            access_token: this.accessToken,
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Facebook message error:', error.response?.data || error.message);
      throw new Error(`Failed to send message: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Get hashtag posts (requires Instagram Graph API for Instagram hashtags)
   * @param {string[]} hashtags - Hashtags to search
   * @returns {Promise<Array>} Array of posts
   */
  async searchHashtags(hashtags, options = {}) {
    try {
      const posts = [];

      // Note: Facebook deprecated public hashtag search
      // This would require Instagram Graph API for Instagram hashtags
      // Or Page Public Content Access for Facebook page hashtag searches

      console.warn('Facebook hashtag search requires Instagram Graph API or Page Public Content Access');

      return posts;
    } catch (error) {
      console.error('Facebook hashtag search error:', error.response?.data || error.message);
      throw new Error(`Facebook API error: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Format Facebook API response into standardized format
   */
  formatPosts(data, matchedKeyword = '') {
    if (!data || data.length === 0) {
      return [];
    }

    return data.map(post => {
      const from = post.from || {};
      const reactions = post.reactions?.summary?.total_count || 0;
      const comments = post.comments?.summary?.total_count || 0;
      const shares = post.shares?.count || 0;

      return {
        platform: 'facebook',
        platformPostId: post.id,
        content: post.message || post.story || '',
        authorUsername: from.id || '',
        authorDisplayName: from.name || '',
        authorProfileUrl: `https://facebook.com/${from.id}`,
        authorFollowerCount: from.fan_count || 0,
        postUrl: post.permalink_url || `https://facebook.com/${post.id}`,
        engagement: {
          likes: reactions, // Facebook combines all reactions
          comments: comments,
          shares: shares,
          views: 0, // Not available in basic Graph API
        },
        postCreatedAt: new Date(post.created_time),
        metadata: {
          postType: post.type || 'status',
          matchedKeyword: matchedKeyword,
        }
      };
    });
  }

  /**
   * Remove duplicate posts based on platform_post_id
   */
  removeDuplicates(posts) {
    const seen = new Set();
    return posts.filter(post => {
      const duplicate = seen.has(post.platformPostId);
      seen.add(post.platformPostId);
      return !duplicate;
    });
  }

  /**
   * Verify access token is valid
   * @returns {Promise<Object>} Token info
   */
  async verifyToken() {
    try {
      const response = await axios.get(`${this.baseURL}/debug_token`, {
        params: {
          input_token: this.accessToken,
          access_token: `${this.appId}|${this.appSecret}`,
        }
      });

      return response.data.data;
    } catch (error) {
      console.error('Facebook token verification error:', error.response?.data || error.message);
      throw new Error(`Token verification failed: ${error.response?.data?.error?.message || error.message}`);
    }
  }
}

export default FacebookClient;
