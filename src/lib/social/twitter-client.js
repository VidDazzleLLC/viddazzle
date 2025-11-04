// Twitter API Client for Social Media Listening
import axios from 'axios';

export class TwitterClient {
  constructor(credentials) {
    this.bearerToken = credentials.bearerToken;
    this.apiKey = credentials.apiKey;
    this.apiSecret = credentials.apiSecret;
    this.baseURL = 'https://api.twitter.com/2';
  }

  /**
   * Search recent tweets by keywords
   * @param {string[]} keywords - Keywords to search for
   * @param {Object} options - Search options
   * @returns {Promise<Array>} Array of tweet objects
   */
  async searchTweets(keywords, options = {}) {
    try {
      const query = this.buildSearchQuery(keywords, options);

      const response = await axios.get(`${this.baseURL}/tweets/search/recent`, {
        headers: {
          'Authorization': `Bearer ${this.bearerToken}`,
          'Content-Type': 'application/json',
        },
        params: {
          query,
          max_results: options.maxResults || 100,
          'tweet.fields': 'created_at,public_metrics,author_id,conversation_id,lang',
          'user.fields': 'username,name,public_metrics,profile_image_url',
          'expansions': 'author_id',
          ...(options.startTime && { start_time: options.startTime }),
          ...(options.sinceId && { since_id: options.sinceId }),
        }
      });

      return this.formatTweets(response.data);
    } catch (error) {
      console.error('Twitter search error:', error.response?.data || error.message);
      throw new Error(`Twitter API error: ${error.response?.data?.title || error.message}`);
    }
  }

  /**
   * Monitor specific Twitter accounts
   * @param {string[]} usernames - Twitter usernames to monitor
   * @param {Object} options - Options
   * @returns {Promise<Array>} Array of tweet objects
   */
  async getUserTweets(usernames, options = {}) {
    try {
      const tweets = [];

      for (const username of usernames) {
        // Get user ID first
        const userResponse = await axios.get(`${this.baseURL}/users/by/username/${username}`, {
          headers: {
            'Authorization': `Bearer ${this.bearerToken}`,
          }
        });

        if (!userResponse.data.data) continue;

        const userId = userResponse.data.data.id;

        // Get user's tweets
        const tweetsResponse = await axios.get(`${this.baseURL}/users/${userId}/tweets`, {
          headers: {
            'Authorization': `Bearer ${this.bearerToken}`,
          },
          params: {
            max_results: options.maxResults || 10,
            'tweet.fields': 'created_at,public_metrics,conversation_id,lang',
            'user.fields': 'username,name,public_metrics,profile_image_url',
            'expansions': 'author_id',
            ...(options.sinceId && { since_id: options.sinceId }),
          }
        });

        const formatted = this.formatTweets(tweetsResponse.data);
        tweets.push(...formatted);
      }

      return tweets;
    } catch (error) {
      console.error('Twitter user tweets error:', error.response?.data || error.message);
      throw new Error(`Twitter API error: ${error.response?.data?.title || error.message}`);
    }
  }

  /**
   * Post a reply to a tweet
   * @param {string} tweetId - ID of tweet to reply to
   * @param {string} message - Reply message
   * @returns {Promise<Object>} Tweet response
   */
  async replyToTweet(tweetId, message) {
    try {
      // Note: Requires OAuth 1.0a user context, not just bearer token
      // This is a simplified version - production should use OAuth 1.0a
      const response = await axios.post(
        `${this.baseURL}/tweets`,
        {
          text: message,
          reply: {
            in_reply_to_tweet_id: tweetId
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.bearerToken}`,
            'Content-Type': 'application/json',
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Twitter reply error:', error.response?.data || error.message);
      throw new Error(`Failed to reply: ${error.response?.data?.title || error.message}`);
    }
  }

  /**
   * Send a direct message
   * @param {string} recipientId - Twitter user ID of recipient
   * @param {string} message - DM message
   * @returns {Promise<Object>} DM response
   */
  async sendDirectMessage(recipientId, message) {
    try {
      const response = await axios.post(
        'https://api.twitter.com/1.1/direct_messages/events/new.json',
        {
          event: {
            type: 'message_create',
            message_create: {
              target: {
                recipient_id: recipientId
              },
              message_data: {
                text: message
              }
            }
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.bearerToken}`,
            'Content-Type': 'application/json',
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Twitter DM error:', error.response?.data || error.message);
      throw new Error(`Failed to send DM: ${error.response?.data?.errors?.[0]?.message || error.message}`);
    }
  }

  /**
   * Build search query string
   */
  buildSearchQuery(keywords, options) {
    let query = keywords.map(k => `"${k}"`).join(' OR ');

    if (options.excludeKeywords && options.excludeKeywords.length > 0) {
      const excludes = options.excludeKeywords.map(k => `-"${k}"`).join(' ');
      query += ` ${excludes}`;
    }

    if (options.language) {
      query += ` lang:${options.language}`;
    }

    // Filter out retweets if specified
    if (options.noRetweets !== false) {
      query += ' -is:retweet';
    }

    return query;
  }

  /**
   * Format Twitter API response into standardized format
   */
  formatTweets(data) {
    if (!data.data || data.data.length === 0) {
      return [];
    }

    const users = {};
    if (data.includes?.users) {
      data.includes.users.forEach(user => {
        users[user.id] = user;
      });
    }

    return data.data.map(tweet => {
      const author = users[tweet.author_id] || {};

      return {
        platform: 'twitter',
        platformPostId: tweet.id,
        content: tweet.text,
        authorUsername: author.username || '',
        authorDisplayName: author.name || '',
        authorProfileUrl: author.username ? `https://twitter.com/${author.username}` : '',
        authorFollowerCount: author.public_metrics?.followers_count || 0,
        postUrl: `https://twitter.com/${author.username}/status/${tweet.id}`,
        engagement: {
          likes: tweet.public_metrics?.like_count || 0,
          comments: tweet.public_metrics?.reply_count || 0,
          shares: tweet.public_metrics?.retweet_count || 0,
          views: tweet.public_metrics?.impression_count || 0,
        },
        postCreatedAt: new Date(tweet.created_at),
        metadata: {
          conversationId: tweet.conversation_id,
          language: tweet.lang,
        }
      };
    });
  }
}

export default TwitterClient;
