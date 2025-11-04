// Reddit API Client for Social Media Listening
import axios from 'axios';

export class RedditClient {
  constructor(credentials) {
    this.clientId = credentials.clientId;
    this.clientSecret = credentials.clientSecret;
    this.username = credentials.username;
    this.password = credentials.password;
    this.accessToken = null;
    this.tokenExpiry = null;
    this.baseURL = 'https://oauth.reddit.com';
  }

  /**
   * Authenticate with Reddit API
   */
  async authenticate() {
    try {
      const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

      const response = await axios.post(
        'https://www.reddit.com/api/v1/access_token',
        new URLSearchParams({
          grant_type: 'password',
          username: this.username,
          password: this.password,
        }),
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'WorkflowAutopilot/1.0',
          }
        }
      );

      this.accessToken = response.data.access_token;
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000);

      return this.accessToken;
    } catch (error) {
      console.error('Reddit auth error:', error.response?.data || error.message);
      throw new Error(`Reddit authentication failed: ${error.message}`);
    }
  }

  /**
   * Ensure we have a valid access token
   */
  async ensureAuthenticated() {
    if (!this.accessToken || Date.now() >= this.tokenExpiry) {
      await this.authenticate();
    }
  }

  /**
   * Search Reddit posts by keywords
   * @param {string[]} keywords - Keywords to search for
   * @param {Object} options - Search options
   * @returns {Promise<Array>} Array of post objects
   */
  async searchPosts(keywords, options = {}) {
    await this.ensureAuthenticated();

    try {
      const query = keywords.join(' OR ');
      const subreddits = options.subreddits || 'all';

      const response = await axios.get(
        `${this.baseURL}/r/${subreddits}/search`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'User-Agent': 'WorkflowAutopilot/1.0',
          },
          params: {
            q: query,
            sort: options.sort || 'new',
            t: options.timeframe || 'day', // hour, day, week, month, year, all
            limit: options.limit || 100,
            restrict_sr: subreddits !== 'all',
            ...(options.after && { after: options.after }),
          }
        }
      );

      return this.formatPosts(response.data);
    } catch (error) {
      console.error('Reddit search error:', error.response?.data || error.message);
      throw new Error(`Reddit API error: ${error.message}`);
    }
  }

  /**
   * Get posts from specific subreddits
   * @param {string[]} subreddits - Subreddit names
   * @param {Object} options - Options
   * @returns {Promise<Array>} Array of post objects
   */
  async getSubredditPosts(subreddits, options = {}) {
    await this.ensureAuthenticated();

    try {
      const posts = [];

      for (const subreddit of subreddits) {
        const response = await axios.get(
          `${this.baseURL}/r/${subreddit}/new`,
          {
            headers: {
              'Authorization': `Bearer ${this.accessToken}`,
              'User-Agent': 'WorkflowAutopilot/1.0',
            },
            params: {
              limit: options.limit || 25,
              ...(options.after && { after: options.after }),
            }
          }
        );

        const formatted = this.formatPosts(response.data);
        posts.push(...formatted);
      }

      return posts;
    } catch (error) {
      console.error('Reddit subreddit posts error:', error.response?.data || error.message);
      throw new Error(`Reddit API error: ${error.message}`);
    }
  }

  /**
   * Search Reddit comments by keywords
   * @param {string[]} keywords - Keywords to search for
   * @param {Object} options - Search options
   * @returns {Promise<Array>} Array of comment objects
   */
  async searchComments(keywords, options = {}) {
    await this.ensureAuthenticated();

    try {
      const query = keywords.join(' OR ');
      const subreddits = options.subreddits || 'all';

      const response = await axios.get(
        `${this.baseURL}/r/${subreddits}/search`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'User-Agent': 'WorkflowAutopilot/1.0',
          },
          params: {
            q: query,
            type: 'comment',
            sort: options.sort || 'new',
            t: options.timeframe || 'day',
            limit: options.limit || 100,
            restrict_sr: subreddits !== 'all',
          }
        }
      );

      return this.formatComments(response.data);
    } catch (error) {
      console.error('Reddit comments search error:', error.response?.data || error.message);
      throw new Error(`Reddit API error: ${error.message}`);
    }
  }

  /**
   * Reply to a post or comment
   * @param {string} thingId - Full ID of post/comment (e.g., t3_xxx or t1_xxx)
   * @param {string} message - Reply message (supports markdown)
   * @returns {Promise<Object>} Comment response
   */
  async replyToPost(thingId, message) {
    await this.ensureAuthenticated();

    try {
      const response = await axios.post(
        `${this.baseURL}/api/comment`,
        new URLSearchParams({
          thing_id: thingId,
          text: message,
        }),
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'User-Agent': 'WorkflowAutopilot/1.0',
            'Content-Type': 'application/x-www-form-urlencoded',
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Reddit reply error:', error.response?.data || error.message);
      throw new Error(`Failed to reply: ${error.message}`);
    }
  }

  /**
   * Send a private message
   * @param {string} username - Reddit username
   * @param {string} subject - Message subject
   * @param {string} message - Message body
   * @returns {Promise<Object>} Message response
   */
  async sendPrivateMessage(username, subject, message) {
    await this.ensureAuthenticated();

    try {
      const response = await axios.post(
        `${this.baseURL}/api/compose`,
        new URLSearchParams({
          to: username,
          subject: subject,
          text: message,
        }),
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'User-Agent': 'WorkflowAutopilot/1.0',
            'Content-Type': 'application/x-www-form-urlencoded',
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Reddit PM error:', error.response?.data || error.message);
      throw new Error(`Failed to send PM: ${error.message}`);
    }
  }

  /**
   * Format Reddit posts into standardized format
   */
  formatPosts(data) {
    if (!data.data?.children || data.data.children.length === 0) {
      return [];
    }

    return data.data.children
      .filter(child => child.kind === 't3') // Posts
      .map(child => {
        const post = child.data;

        return {
          platform: 'reddit',
          platformPostId: post.id,
          fullId: post.name, // t3_xxx format for API calls
          content: `${post.title}\n\n${post.selftext || ''}`.trim(),
          authorUsername: post.author,
          authorDisplayName: post.author,
          authorProfileUrl: `https://reddit.com/user/${post.author}`,
          authorFollowerCount: 0, // Reddit doesn't expose this easily
          postUrl: `https://reddit.com${post.permalink}`,
          engagement: {
            likes: post.ups || 0,
            comments: post.num_comments || 0,
            shares: 0,
            views: 0,
          },
          postCreatedAt: new Date(post.created_utc * 1000),
          metadata: {
            subreddit: post.subreddit,
            score: post.score,
            upvoteRatio: post.upvote_ratio,
            isVideo: post.is_video,
            linkFlairText: post.link_flair_text,
          }
        };
      });
  }

  /**
   * Format Reddit comments into standardized format
   */
  formatComments(data) {
    if (!data.data?.children || data.data.children.length === 0) {
      return [];
    }

    return data.data.children
      .filter(child => child.kind === 't1') // Comments
      .map(child => {
        const comment = child.data;

        return {
          platform: 'reddit',
          platformPostId: comment.id,
          fullId: comment.name, // t1_xxx format for API calls
          content: comment.body,
          authorUsername: comment.author,
          authorDisplayName: comment.author,
          authorProfileUrl: `https://reddit.com/user/${comment.author}`,
          authorFollowerCount: 0,
          postUrl: `https://reddit.com${comment.permalink}`,
          engagement: {
            likes: comment.ups || 0,
            comments: 0,
            shares: 0,
            views: 0,
          },
          postCreatedAt: new Date(comment.created_utc * 1000),
          metadata: {
            subreddit: comment.subreddit,
            score: comment.score,
            parentId: comment.parent_id,
            linkId: comment.link_id,
          }
        };
      });
  }
}

export default RedditClient;
